import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CRANE_TTL_MS,
  createCraneMessage,
  getRetentionStatus,
  loadCraneThread,
  purgeExpiredEphemeral,
  saveCraneThread,
} from '../lib/craneRetentionStore';
import { evaluateEphemeralLifecycle, hardPurgeStorageKey } from './useEphemeralStorage';

const EPHEMERAL_PREFIX = 'surge.crane.ephemeral.';

function ephemeralKeyForSession(sessionId) {
  return sessionId ? EPHEMERAL_PREFIX + sessionId : null;
}

/**
 * Sovereignty-aware Crane conversation retention.
 * Ephemeral by default (24h). Opt-in persistent local save.
 * Mount-time purge via evaluateEphemeralLifecycle contract.
 */
export function useCraneRetention(sessionId) {
  const [messages, setMessages] = useState([]);
  const [savePersistently, setSavePersistently] = useState(false);
  const [createdAt, setCreatedAt] = useState(() => Date.now());
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + CRANE_TTL_MS);
  const [hydrated, setHydrated] = useState(false);
  const [purged, setPurged] = useState(false);
  const memoryOnlyRef = useRef(false);

  /** Immediate lifecycle check on mount — zero dependencies. */
  useEffect(() => {
    purgeExpiredEphemeral();

    if (!sessionId) {
      setHydrated(true);
      return;
    }

    const thread = loadCraneThread(sessionId);
    const key = ephemeralKeyForSession(sessionId);

    if (thread?.savePersistently) {
      setMessages(thread.messages ?? []);
      setSavePersistently(true);
      setCreatedAt(thread.createdAt ?? Date.now());
      setExpiresAt(undefined);
      setHydrated(true);
      return;
    }

    const { purged: wasPurged, record } = evaluateEphemeralLifecycle({
      storageKey: key,
      ttlMs: CRANE_TTL_MS,
      savePersistently: false,
    });

    if (wasPurged) {
      hardPurgeStorageKey(key);
      setMessages([]);
      setSavePersistently(false);
      setCreatedAt(Date.now());
      setExpiresAt(Date.now() + CRANE_TTL_MS);
      setPurged(true);
      setHydrated(true);
      return;
    }

    if (thread) {
      setMessages(thread.messages ?? []);
      setSavePersistently(false);
      setCreatedAt(thread.createdAt ?? record?.createdAt ?? Date.now());
      setExpiresAt(thread.expiresAt ?? thread.createdAt + CRANE_TTL_MS);
    } else if (record?.data?.messages) {
      setMessages(record.data.messages);
      setCreatedAt(record.createdAt);
      setExpiresAt(record.createdAt + CRANE_TTL_MS);
    }

    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only sovereignty purge
  }, []);

  const thread = useMemo(
    () => ({
      sessionId,
      messages,
      savePersistently,
      createdAt,
      expiresAt: savePersistently ? undefined : expiresAt,
    }),
    [sessionId, messages, savePersistently, createdAt, expiresAt],
  );

  const retention = useMemo(() => getRetentionStatus(thread), [thread]);

  const [, setTick] = useState(0);
  useEffect(() => {
    if (savePersistently) return undefined;
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, [savePersistently]);

  const persist = useCallback(() => {
    if (!sessionId || memoryOnlyRef.current) return;
    saveCraneThread(thread);
  }, [sessionId, thread]);

  useEffect(() => {
    if (!hydrated || !sessionId) return;
    const timer = window.setTimeout(persist, 350);
    return () => window.clearTimeout(timer);
  }, [hydrated, sessionId, persist]);

  const appendMessage = useCallback((role, content, extras = {}) => {
    const msg = createCraneMessage(role, content, extras);
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const toggleSavePersistently = useCallback(() => {
    setSavePersistently((prev) => {
      const next = !prev;
      const key = ephemeralKeyForSession(sessionId);
      if (next) {
        setExpiresAt(undefined);
        if (key) hardPurgeStorageKey(key);
      } else {
        setExpiresAt(Date.now() + CRANE_TTL_MS);
      }
      return next;
    });
  }, [sessionId]);

  const setPersistently = useCallback(
    (value) => {
      setSavePersistently(value);
      const key = ephemeralKeyForSession(sessionId);
      if (value) {
        setExpiresAt(undefined);
        if (key) hardPurgeStorageKey(key);
      } else {
        setExpiresAt(Date.now() + CRANE_TTL_MS);
      }
    },
    [sessionId],
  );

  return {
    messages,
    savePersistently,
    retentionLabel: retention.label,
    hoursRemaining: retention.hoursRemaining,
    hydrated,
    purged,
    appendMessage,
    toggleSavePersistently,
    setSavePersistently: setPersistently,
    memoryOnlyRef,
  };
}

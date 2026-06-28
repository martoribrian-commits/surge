import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CRANE_TTL_MS,
  createCraneMessage,
  getRetentionStatus,
  loadCraneThread,
  purgeExpiredEphemeral,
  saveCraneThread,
} from '../lib/craneRetentionStore';

/**
 * Sovereignty-aware Crane conversation retention.
 * Ephemeral by default (24h). Opt-in persistent local save.
 */
export function useCraneRetention(sessionId) {
  const [messages, setMessages] = useState([]);
  const [savePersistently, setSavePersistently] = useState(false);
  const [createdAt, setCreatedAt] = useState(() => Date.now());
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + CRANE_TTL_MS);
  const [hydrated, setHydrated] = useState(false);
  const memoryOnlyRef = useRef(false);

  useEffect(() => {
    purgeExpiredEphemeral();
    if (!sessionId) {
      setHydrated(true);
      return;
    }

    const thread = loadCraneThread(sessionId);
    if (thread) {
      setMessages(thread.messages);
      setSavePersistently(thread.savePersistently);
      setCreatedAt(thread.createdAt);
      setExpiresAt(thread.expiresAt ?? thread.createdAt + CRANE_TTL_MS);
    }
    setHydrated(true);
  }, [sessionId]);

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

  // Refresh expiry label periodically when ephemeral
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

  const appendMessage = useCallback((role, content) => {
    const msg = createCraneMessage(role, content);
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const toggleSavePersistently = useCallback(() => {
    setSavePersistently((prev) => {
      const next = !prev;
      if (next) {
        setExpiresAt(undefined);
      } else {
        setExpiresAt(Date.now() + CRANE_TTL_MS);
      }
      return next;
    });
  }, []);

  const setPersistently = useCallback((value) => {
    setSavePersistently(value);
    if (value) {
      setExpiresAt(undefined);
    } else {
      setExpiresAt(Date.now() + CRANE_TTL_MS);
    }
  }, []);

  return {
    messages,
    savePersistently,
    retentionLabel: retention.label,
    hoursRemaining: retention.hoursRemaining,
    hydrated,
    appendMessage,
    toggleSavePersistently,
    setSavePersistently: setPersistently,
    memoryOnlyRef,
  };
}

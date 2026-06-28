import { useCallback, useEffect, useRef, useState } from 'react';

export const DEFAULT_EPHEMERAL_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * @template T
 * @typedef {Object} EphemeralRecord
 * @property {T} data
 * @property {number} createdAt
 * @property {boolean} [persist]
 */

/**
 * Hard purge: remove storage key, overwrite memory, reset state.
 * @param {string} storageKey
 * @param {Storage} [storage]
 */
export function hardPurgeStorageKey(storageKey, storage = localStorage) {
  if (!storageKey) return;
  try {
    storage.removeItem(storageKey);
  } catch {
    /* private browsing */
  }
}

/**
 * @template T
 * @param {string} raw
 * @returns {EphemeralRecord<T> | null}
 */
function safeParseRecord(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed == null || typeof parsed !== 'object') return null;
    if (typeof parsed.createdAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Standalone mount-time lifecycle evaluation — used by hooks and store purge.
 * @template T
 * @returns {{ purged: boolean, record: EphemeralRecord<T> | null }}
 */
export function evaluateEphemeralLifecycle({
  storageKey,
  ttlMs = DEFAULT_EPHEMERAL_TTL_MS,
  savePersistently = false,
  storage = typeof localStorage !== 'undefined' ? localStorage : null,
  now = Date.now(),
}) {
  if (!storageKey || !storage || savePersistently) {
    return { purged: false, record: null };
  }

  let record = null;
  try {
    record = safeParseRecord(storage.getItem(storageKey));
  } catch {
    return { purged: false, record: null };
  }

  if (!record) return { purged: false, record: null };

  if (now - record.createdAt > ttlMs) {
    hardPurgeStorageKey(storageKey, storage);
    return { purged: true, record: null };
  }

  return { purged: false, record };
}

/**
 * Bulletproof ephemeral storage hook for Crane conversation sovereignty.
 *
 * On mount (zero-dependency effect): immediately checks whether stored data
 * exceeds TTL. Ephemeral records older than 24h are irreversibly purged.
 *
 * @template T
 * @param {Object} options
 * @param {string} options.storageKey localStorage key for this record
 * @param {number} [options.ttlMs=86400000] ephemeral TTL in milliseconds
 * @param {boolean} [options.savePersistently=false] when true, TTL check is skipped
 * @param {() => T} [options.createDefault] factory when no valid record exists
 * @param {Storage} [options.storage=localStorage] storage backend
 */
export function useEphemeralStorage({
  storageKey,
  ttlMs = DEFAULT_EPHEMERAL_TTL_MS,
  savePersistently = false,
  createDefault = () => null,
  storage = typeof localStorage !== 'undefined' ? localStorage : null,
}) {
  const [data, setData] = useState(null);
  const [createdAt, setCreatedAt] = useState(() => Date.now());
  const [purged, setPurged] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const memoryRef = useRef(null);

  /** Immediate lifecycle check — runs once on mount, zero dependencies. */
  useEffect(() => {
    if (!storageKey || !storage) {
      const fallback = createDefault();
      memoryRef.current = fallback;
      setData(fallback);
      setHydrated(true);
      return;
    }

    let record = null;
    try {
      record = safeParseRecord(storage.getItem(storageKey));
    } catch {
      record = null;
    }

    const now = Date.now();
    const isPersistent = savePersistently || record?.persist === true;

    if (record && !isPersistent && now - record.createdAt > ttlMs) {
      hardPurgeStorageKey(storageKey, storage);
      memoryRef.current = null;
      setData(null);
      setCreatedAt(now);
      setPurged(true);
      setHydrated(true);
      return;
    }

    if (record) {
      memoryRef.current = record.data ?? null;
      setData(record.data ?? null);
      setCreatedAt(record.createdAt);
    } else {
      const initial = createDefault();
      memoryRef.current = initial;
      setData(initial);
      setCreatedAt(now);
    }

    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only lifecycle purge
  }, []);

  const persist = useCallback(
    (nextData, options = {}) => {
      if (!storageKey || !storage) {
        memoryRef.current = nextData;
        setData(nextData);
        return;
      }

      const persistFlag = options.persist ?? savePersistently;
      const ts = options.createdAt ?? createdAt ?? Date.now();

      memoryRef.current = nextData;
      setData(nextData);
      setCreatedAt(ts);

      if (!persistFlag) {
        const now = Date.now();
        if (now - ts > ttlMs) {
          hardPurgeStorageKey(storageKey, storage);
          memoryRef.current = null;
          setData(null);
          setPurged(true);
          return;
        }
      }

      try {
        storage.setItem(
          storageKey,
          JSON.stringify({
            data: nextData,
            createdAt: ts,
            persist: persistFlag,
            updatedAt: Date.now(),
          }),
        );
      } catch {
        /* quota / private mode — memory only */
      }
    },
    [storageKey, storage, savePersistently, createdAt, ttlMs],
  );

  const purge = useCallback(() => {
    if (storageKey && storage) {
      hardPurgeStorageKey(storageKey, storage);
    }
    memoryRef.current = null;
    setData(null);
    setPurged(true);
  }, [storageKey, storage]);

  return {
    data,
    createdAt,
    purged,
    hydrated,
    memoryRef,
    persist,
    purge,
    setData,
  };
}

/**
 * Crane hybrid retention — ephemeral (24h TTL) vs persistent local insights.
 * Client-only. No remote sync.
 */

export const CRANE_TTL_MS = 24 * 60 * 60 * 1000;

const EPHEMERAL_PREFIX = 'surge.crane.ephemeral.';
const PERSISTENT_PREFIX = 'surge.crane.saved.';
const PREFERENCE_PREFIX = 'surge.crane.pref.';

/** @typedef {{ id: string, role: 'user' | 'crane', content: string, createdAt: number }} CraneMessage */

/**
 * @typedef {Object} CraneThread
 * @property {string} sessionId
 * @property {CraneMessage[]} messages
 * @property {boolean} savePersistently
 * @property {number} createdAt
 * @property {number} [expiresAt]
 */

function ephemeralKey(sessionId) {
  return EPHEMERAL_PREFIX + sessionId;
}

function persistentKey(sessionId) {
  return PERSISTENT_PREFIX + sessionId;
}

function preferenceKey(sessionId) {
  return PREFERENCE_PREFIX + sessionId;
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** @returns {CraneThread | null} */
export function loadCraneThread(sessionId) {
  if (!sessionId) return null;

  purgeExpiredEphemeral();

  const pref = loadSavePreference(sessionId);

  if (pref) {
    const saved = safeParse(localStorage.getItem(persistentKey(sessionId)));
    if (saved?.messages) {
      return {
        sessionId,
        messages: saved.messages,
        savePersistently: true,
        createdAt: saved.createdAt ?? Date.now(),
        expiresAt: undefined,
      };
    }
  }

  const raw = localStorage.getItem(ephemeralKey(sessionId));
  if (!raw) {
    return {
      sessionId,
      messages: [],
      savePersistently: false,
      createdAt: Date.now(),
      expiresAt: Date.now() + CRANE_TTL_MS,
    };
  }

  const record = safeParse(raw);
  if (!record) return null;

  if (record.expiresAt && record.expiresAt < Date.now()) {
    localStorage.removeItem(ephemeralKey(sessionId));
    return {
      sessionId,
      messages: [],
      savePersistently: false,
      createdAt: Date.now(),
      expiresAt: Date.now() + CRANE_TTL_MS,
    };
  }

  return {
    sessionId,
    messages: record.messages ?? [],
    savePersistently: false,
    createdAt: record.createdAt ?? Date.now(),
    expiresAt: record.expiresAt ?? Date.now() + CRANE_TTL_MS,
  };
}

/** @param {CraneThread} thread */
export function saveCraneThread(thread) {
  if (!thread?.sessionId) return;

  const payload = {
    messages: thread.messages,
    createdAt: thread.createdAt,
    updatedAt: Date.now(),
  };

  try {
    saveSavePreference(thread.sessionId, thread.savePersistently);

    if (thread.savePersistently) {
      localStorage.setItem(persistentKey(thread.sessionId), JSON.stringify(payload));
      localStorage.removeItem(ephemeralKey(thread.sessionId));
    } else {
      localStorage.setItem(
        ephemeralKey(thread.sessionId),
        JSON.stringify({
          ...payload,
          expiresAt: thread.expiresAt ?? Date.now() + CRANE_TTL_MS,
        }),
      );
      localStorage.removeItem(persistentKey(thread.sessionId));
    }
  } catch {
    /* private browsing — in-memory only in hook */
  }
}

export function loadSavePreference(sessionId) {
  try {
    return localStorage.getItem(preferenceKey(sessionId)) === 'true';
  } catch {
    return false;
  }
}

function saveSavePreference(sessionId, value) {
  try {
    localStorage.setItem(preferenceKey(sessionId), value ? 'true' : 'false');
  } catch {
    /* ignore */
  }
}

export function purgeExpiredEphemeral() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(EPHEMERAL_PREFIX)) keys.push(k);
    }
    for (const k of keys) {
      const record = safeParse(localStorage.getItem(k));
      if (record?.expiresAt && record.expiresAt < Date.now()) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    /* ignore */
  }
}

/**
 * @param {CraneThread} thread
 * @returns {{ label: string, hoursRemaining: number | null }}
 */
export function getRetentionStatus(thread) {
  if (!thread) {
    return { label: 'Data will auto-delete in 24 hours', hoursRemaining: 24 };
  }

  if (thread.savePersistently) {
    return { label: 'Saved locally on this device', hoursRemaining: null };
  }

  const expiresAt = thread.expiresAt ?? thread.createdAt + CRANE_TTL_MS;
  const msLeft = Math.max(0, expiresAt - Date.now());
  const hoursRemaining = Math.max(1, Math.ceil(msLeft / (60 * 60 * 1000)));

  return {
    label: `Data will auto-delete in ${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'}`,
    hoursRemaining,
  };
}

export function clearCraneThread(sessionId) {
  if (!sessionId) return;
  try {
    localStorage.removeItem(ephemeralKey(sessionId));
    localStorage.removeItem(persistentKey(sessionId));
    localStorage.removeItem(preferenceKey(sessionId));
  } catch {
    /* ignore */
  }
}

/** @param {string} role @param {string} content */
export function createCraneMessage(role, content) {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: Date.now(),
  };
}

/**
 * Local ephemeral storage — 24h TTL, Supabase-ready opt-in layer later.
 */

const PREFIX = 'surge.ephemeral.';
const TTL_MS = 24 * 60 * 60 * 1000;

function key(sessionId) {
  return PREFIX + sessionId;
}

export function saveEphemeralNote(sessionId, text) {
  if (!sessionId) return;
  const record = {
    text,
    createdAt: Date.now(),
    expiresAt: Date.now() + TTL_MS,
  };
  try {
    localStorage.setItem(key(sessionId), JSON.stringify(record));
  } catch {
    /* private browsing */
  }
}

export function loadEphemeralNote(sessionId) {
  if (!sessionId) return '';
  try {
    const raw = localStorage.getItem(key(sessionId));
    if (!raw) return '';
    const record = JSON.parse(raw);
    if (record.expiresAt < Date.now()) {
      localStorage.removeItem(key(sessionId));
      return '';
    }
    return record.text ?? '';
  } catch {
    return '';
  }
}

export function clearEphemeralNote(sessionId) {
  if (!sessionId) return;
  try {
    localStorage.removeItem(key(sessionId));
  } catch {
    /* ignore */
  }
}

export const EPHEMERAL_TTL_HOURS = 24;

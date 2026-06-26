const STORAGE_KEY = 'surge.sessionPayload';

/**
 * Builds a session payload for Heron / Marrow ingestion.
 */
export function buildSessionPayload(durationInSeconds, completedFullCycle) {
  return {
    sessionId: crypto.randomUUID(),
    durationInSeconds: Math.round(durationInSeconds),
    completedFullCycle: Boolean(completedFullCycle),
  };
}

/**
 * Persists session payload to localStorage via native JSON serialization.
 * Survives offline — ready for Heron AI guide on reconnect.
 */
export function cacheSessionPayload(payload) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Private browsing — payload remains in memory for this session
  }
}

export function getCachedSessionPayload() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Placeholder routing to the Marrow web application.
 * Cached payload is available for Heron AI guide ingestion.
 */
export function routeToMarrow() {
  const payload = getCachedSessionPayload();

  // eslint-disable-next-line no-console
  console.info('[Surge] Routing to Marrow with session payload:', payload);

  const marrowUrl = import.meta.env.VITE_MARROW_URL;
  if (marrowUrl) {
    window.location.href = marrowUrl;
  }
}

/**
 * Ephemeral notes — 24h local TTL. Supabase opt-in ready later.
 */
(function (global) {
  var PREFIX = 'surge.ephemeral.';
  var TTL_MS = 24 * 60 * 60 * 1000;

  function key(sessionId) {
    return PREFIX + sessionId;
  }

  function save(sessionId, text) {
    if (!sessionId) return;
    try {
      localStorage.setItem(
        key(sessionId),
        JSON.stringify({
          text: text,
          createdAt: Date.now(),
          expiresAt: Date.now() + TTL_MS,
        }),
      );
    } catch {
      /* private browsing */
    }
  }

  function load(sessionId) {
    if (!sessionId) return '';
    try {
      var raw = localStorage.getItem(key(sessionId));
      if (!raw) return '';
      var record = JSON.parse(raw);
      if (record.expiresAt < Date.now()) {
        localStorage.removeItem(key(sessionId));
        return '';
      }
      return record.text || '';
    } catch {
      return '';
    }
  }

  global.EphemeralStore = {
    TTL_HOURS: 24,
    save: save,
    load: load,
  };
})(typeof window !== 'undefined' ? window : globalThis);

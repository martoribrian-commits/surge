/**
 * AI anchor calibration — optional one-word input → personalized hold phrase.
 * Cached locally; falls back to science-backed defaults offline.
 */
(function (global) {
  var CACHE_KEY = 'surge.engineAnchor';
  var API = '/api/engine-anchor';

  var FALLBACKS = [
    { anchor: 'Feet on the floor.', breathCue: 'Longer exhale.' },
    { anchor: 'This will pass.', breathCue: 'Five breaths per minute.' },
    { anchor: 'Hold. Then soften.', breathCue: 'Let the jaw drop.' },
    { anchor: 'Stay with the pulse.', breathCue: 'Exhale twice as long.' },
  ];

  function readCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeCache(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      /* private browsing */
    }
  }

  function fallback(word) {
    var idx = word ? word.charCodeAt(0) % FALLBACKS.length : 0;
    return Object.assign({ source: 'fallback' }, FALLBACKS[idx]);
  }

  function fetchAnchor(word) {
    var trimmed = (word || '').trim().slice(0, 32);
    var cached = readCache();
    if (cached && cached.word === trimmed && cached.anchor) {
      return Promise.resolve(cached);
    }

    if (!trimmed) {
      var empty = fallback('');
      writeCache(empty);
      return Promise.resolve(empty);
    }

    return fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: trimmed }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('anchor failed');
        return res.json();
      })
      .then(function (data) {
        var result = {
          word: trimmed,
          anchor: String(data.anchor || '').slice(0, 80),
          breathCue: String(data.breathCue || '').slice(0, 60),
          source: 'ai',
        };
        if (!result.anchor) throw new Error('empty anchor');
        writeCache(result);
        return result;
      })
      .catch(function () {
        var fb = fallback(trimmed);
        fb.word = trimmed;
        writeCache(fb);
        return fb;
      });
  }

  function getCached() {
    return readCache() || fallback('');
  }

  function clearCache() {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch {
      /* ignore */
    }
  }

  global.EngineAnchor = {
    fetchAnchor: fetchAnchor,
    getCached: getCached,
    clearCache: clearCache,
  };
})(typeof window !== 'undefined' ? window : globalThis);

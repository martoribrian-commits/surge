/**
 * Single somatic decay curve — intensity 1.0 → 0.0 over 90 seconds.
 * ease-in-out. All engine outputs derive from this value.
 */
(function (global) {
  const DURATION_MS = 90 * 1000;

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  /** @param {number} elapsedMs */
  function intensityAt(elapsedMs) {
    const progress = Math.min(Math.max(elapsedMs / DURATION_MS, 0), 1);
    return 1 - easeInOut(progress);
  }

  /** Interpolate white (#FFFFFF) to soften (#1C1C1E) by intensity t (1→0) */
  function colorAt(t) {
    const start = { r: 255, g: 255, b: 255 };
    const end = { r: 28, g: 28, b: 30 };
    const p = 1 - t;
    const r = Math.round(start.r + (end.r - start.r) * p);
    const g = Math.round(start.g + (end.g - start.g) * p);
    const b = Math.round(start.b + (end.b - start.b) * p);
    return `rgb(${r}, ${g}, ${b})`;
  }

  /** Haptic pulse interval and duration from intensity */
  function hapticAt(t, lastPulseMs, nowMs) {
    if (t <= 0 || !global.navigator?.vibrate) return false;
    const interval = 80 + (1 - t) * 120;
    if (nowMs - lastPulseMs < interval) return false;
    const duration = Math.round(t * 180 + 30);
    try {
      global.navigator.vibrate(duration);
    } catch {
      /* iOS */
    }
    return true;
  }

  global.SurgeCurve = {
    DURATION_MS,
    intensityAt,
    colorAt,
    hapticAt,
  };
})(typeof window !== 'undefined' ? window : globalThis);

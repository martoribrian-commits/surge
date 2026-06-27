/**
 * Single somatic decay curve — 90 seconds from peak chaos to grounded heartbeat.
 * All engine channels (visual, audio, haptic) derive from this state.
 */
(function (global) {
  const DURATION_MS = 90 * 1000;
  const HEARTBEAT_HZ = 1;
  const STROBE_HZ = 2.5;
  const SUB_BASS_HZ = 55;

  function clamp01(value) {
    return value < 0 ? 0 : value > 1 ? 1 : value;
  }

  function smoothstep(edge0, edge1, x) {
    const t = clamp01((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function curveAtProgress(progress) {
    const p = clamp01(progress);
    const chaos = 1 - smoothstep(0, 0.32, p);
    const heartbeat = smoothstep(0.12, 0.7, p);
    return { progress: p, value: 1 - p, chaos, heartbeat };
  }

  /** @param {number} elapsedMs */
  function curveAt(elapsedMs) {
    return curveAtProgress(elapsedMs / DURATION_MS);
  }

  /** Legacy scalar intensity (1 → 0). */
  function intensityAt(elapsedMs) {
    return curveAt(elapsedMs).value;
  }

  global.SurgeCurve = {
    DURATION_MS,
    HEARTBEAT_HZ,
    STROBE_HZ,
    SUB_BASS_HZ,
    clamp01,
    lerp,
    smoothstep,
    curveAt,
    curveAtProgress,
    intensityAt,
  };
})(typeof window !== 'undefined' ? window : globalThis);

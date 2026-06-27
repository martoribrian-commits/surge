/**
 * Single somatic decay curve — 90 seconds from peak chaos to grounded heartbeat.
 * All engine channels (visual, audio, haptic) derive from this state.
 */
(function (global) {
  const DURATION_MS = 90 * 1000;
  const HEARTBEAT_HZ = 1;
  const STROBE_HZ = 2.5;
  const SUB_BASS_HZ = 55;
  /** ~5 breaths/min — parasympathetic respiration target in tail phase. */
  const BREATH_HZ = 5 / 60;

  var PHASES = {
    chaos: {
      id: 'chaos',
      label: 'Sympathetic peak',
      science: 'Multi-channel entrainment',
    },
    mid: {
      id: 'mid',
      label: 'Coherence window',
      science: 'Noise carve-down · 60 BPM emerging',
    },
    heartbeat: {
      id: 'heartbeat',
      label: 'Vagal restitution',
      science: '5 breaths/min · sub-bass lock',
    },
  };

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

  function phaseAt(state) {
    if (state.chaos > 0.55) return PHASES.chaos;
    if (state.heartbeat > 0.35 || state.progress > 0.52) return PHASES.heartbeat;
    return PHASES.mid;
  }

  function timeRemainingMs(elapsedMs) {
    return Math.max(0, DURATION_MS - elapsedMs);
  }

  function formatClock(ms) {
    var total = Math.ceil(ms / 1000);
    var m = Math.floor(total / 60);
    var s = total % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  /** In / Hold / Out from 5 BPM sine. */
  function breathLabel(t) {
    var s = Math.sin(2 * Math.PI * BREATH_HZ * t);
    if (s > 0.2) return 'In';
    if (s < -0.2) return 'Out';
    return 'Hold';
  }

  function breathAmount(t) {
    return 0.5 + 0.5 * Math.sin(2 * Math.PI * BREATH_HZ * t);
  }

  /** Visual/audio focal point — shifts up on narrow viewports for thumb reach. */
  function focalPoint(width, height) {
    var isMobile = width < 768 || height > width;
    var offsetY = isMobile ? height * -0.07 : height * -0.03;
    return { x: width / 2, y: height / 2 + offsetY };
  }

  global.SurgeCurve = {
    DURATION_MS,
    HEARTBEAT_HZ,
    STROBE_HZ,
    SUB_BASS_HZ,
    BREATH_HZ,
    PHASES,
    clamp01,
    lerp,
    smoothstep,
    curveAt,
    curveAtProgress,
    intensityAt,
    phaseAt,
    focalPoint,
    timeRemainingMs,
    formatClock,
    breathLabel,
    breathAmount,
  };
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * Classic Surge somatic decay curve — 90s chaos → heartbeat (static engine parity).
 */

function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export const VAGAL_DURATION_MS = 90 * 1000;
export const SUB_BASS_HZ = 55;
export const HEARTBEAT_HZ = 1;
export const STROBE_HZ = 2.5;
/** ~5 breaths/min */
export const BREATH_HZ = 5 / 60;

export const VAGAL_PHASES = {
  chaos: {
    id: 'chaos',
    label: 'Peak intensity',
    hint: 'Hold through the peak.',
    science: 'Full sensory field engaged',
  },
  mid: {
    id: 'mid',
    label: 'Dropping',
    hint: 'Intensity is dropping.',
    science: 'Noise carving down',
  },
  heartbeat: {
    id: 'heartbeat',
    label: 'Grounded pulse',
    hint: 'One pulse at a time.',
    science: 'Slow breath · sub-bass lock',
  },
};

/** @param {number} progress 0–1 elapsed */
export function curveAtProgress(progress) {
  const p = clamp01(progress);
  const chaos = 1 - smoothstep(0, 0.32, p);
  const heartbeat = smoothstep(0.12, 0.7, p);
  return { progress: p, value: 1 - p, chaos, heartbeat };
}

/** @param {number} elapsedSeconds */
export function curveAtElapsed(elapsedSeconds) {
  return curveAtProgress(elapsedSeconds / 90);
}

/** @param {{ chaos: number, heartbeat: number, progress: number }} state */
export function phaseAt(state) {
  if (state.chaos > 0.55) return VAGAL_PHASES.chaos;
  if (state.heartbeat > 0.35 || state.progress > 0.52) return VAGAL_PHASES.heartbeat;
  return VAGAL_PHASES.mid;
}

/** Visual/audio focal point — shifts up on narrow viewports. */
export function focalPoint(width, height) {
  const isMobile = width < 768 || height > width;
  const offsetY = isMobile ? height * -0.07 : height * -0.03;
  return { x: width / 2, y: height / 2 + offsetY };
}

/** In / Hold / Out from 5 BPM sine. */
export function breathAmount(t) {
  return 0.5 + 0.5 * Math.sin(2 * Math.PI * BREATH_HZ * t);
}

export function breathLabel(t) {
  const s = Math.sin(2 * Math.PI * BREATH_HZ * t);
  if (s > 0.2) return 'In';
  if (s < -0.2) return 'Out';
  return 'Hold';
}

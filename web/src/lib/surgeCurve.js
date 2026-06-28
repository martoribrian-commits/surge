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

export const VAGAL_DURATION_MS = 90 * 1000;

export const VAGAL_PHASES = {
  chaos: {
    id: 'chaos',
    label: 'Sympathetic peak',
    hint: 'Hold through the peak.',
    science: 'Multi-channel entrainment',
  },
  mid: {
    id: 'mid',
    label: 'Coherence window',
    hint: 'Intensity is dropping.',
    science: 'Noise carve-down, 60 BPM emerging',
  },
  heartbeat: {
    id: 'heartbeat',
    label: 'Vagal restitution',
    hint: 'One pulse at a time.',
    science: '5 breaths/min · sub-bass lock',
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

/** Default somatic cycle length (seconds). */
export const SURGE_DURATION_S = 90;

export const SPIN_UP_MS = 500;
export const SPIN_DOWN_MS = 1800;

const MIN_PULSE_HZ = 0.5;
const MAX_PULSE_HZ = 1.0;

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Master decay curve — maps session progress (0→1 over 90s) to intensity (1.0→0.0).
 * All sensory channels derive from the returned intensity.
 */
export function intensityAtProgress(progress) {
  const p = Math.max(0, Math.min(1, progress));
  if (p <= 0.15) return 1.0;
  return Math.pow((1.0 - p) / 0.85, 2);
}

/**
 * Map wall-clock elapsed time in the decay phase to master intensity.
 */
export function intensityAtElapsed(elapsedMs, durationS = SURGE_DURATION_S) {
  const progress = Math.min(elapsedMs / (durationS * 1000), 1);
  return intensityAtProgress(progress);
}

/**
 * Single derivation point for visual alpha, audio mix, haptic timing, and pulse phase.
 * @param {number} t - Master intensity 1.0→0.0
 * @param {number} elapsedMs - Wall-clock ms since decay phase began (for pulse sync)
 */
export function deriveSurgeOutputs(t, elapsedMs = 0) {
  const clamped = Math.max(0, Math.min(1, t));

  const pulseHz = MIN_PULSE_HZ + clamped * (MAX_PULSE_HZ - MIN_PULSE_HZ);
  const pulsePhase = ((elapsedMs / 1000) * pulseHz) % 1;
  const pulseWave = 0.5 + 0.5 * Math.sin(pulsePhase * Math.PI * 2);

  const alpha = clamped;
  const copyOpacity = Math.min(1, clamped / 0.5);

  const fogBlur = 8 + clamped * 28;
  const innerGlowBase = 0.06 + clamped * 0.28;
  const outerAmberBase = 0.04 + clamped * 0.18;
  const deepCoreBase = 0.02 + clamped * 0.12;

  const innerGlow = innerGlowBase * (0.55 + pulseWave * 0.45);
  const outerAmber = outerAmberBase * (0.35 + pulseWave * 0.65);
  const deepCore = deepCoreBase * (0.5 + pulseWave * 0.5);
  const fogOpacity = deepCoreBase + (innerGlowBase - deepCoreBase) * pulseWave;
  const beaconScale = 0.88 + pulseWave * 0.18;
  const beaconBlur = 4 + clamped * 12;
  const outerBleedOpacity = 0.3 + pulseWave * 0.4;

  const chaosVol = Math.max(0, Math.min(1, (clamped - 0.15) / 0.85)) * 0.85;
  const heartbeatVol = Math.max(0, Math.min(0.9, (0.75 - clamped) / 0.75));
  const filterFreq = 120 + clamped * 9000;

  const vibrateDuration =
    clamped > 0.15 ? Math.round(clamped * 180 + 30) : 120;
  const vibrateInterval =
    clamped > 0.15 ? 80 + (1 - clamped) * 120 : 1000;
  const vibratePattern = clamped > 0.15 ? vibrateDuration : [120, 80];

  return {
    t: clamped,
    alpha,
    copyOpacity,
    pulseHz,
    pulseWave,
    fogBlur,
    innerGlow,
    outerAmber,
    deepCore,
    fogOpacity,
    beaconScale,
    beaconBlur,
    outerBleedOpacity,
    chaosVol,
    heartbeatVol,
    filterFreq,
    vibrateDuration,
    vibrateInterval,
    vibratePattern,
  };
}

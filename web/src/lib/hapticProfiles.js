/**
 * Production haptic profile definitions for Release 1.33 sequences.
 * Consumed by useSequenceHaptics — native bridge executes; web shims vibrate.
 *
 * @typedef {Object} HapticTransientSpec
 * @property {'transient'} type
 * @property {number} intensity 0–1 peak
 * @property {number} [sharpness] 0–1
 * @property {number[]} [pattern] web vibrate fallback ms pattern
 * @property {number} [delayMs] offset from profile start
 *
 * @typedef {Object} HapticContinuousSpec
 * @property {'continuous'} type
 * @property {number} intensity 0–1 start intensity
 * @property {number} durationMs
 * @property {'linear' | 'exponential' | 'none'} [decay]
 * @property {string} [id]
 * @property {number} [delayMs]
 *
 * @typedef {Object} HapticRhythmSpec
 * @property {'rhythm'} type
 * @property {number} bpm
 * @property {number} intensity 0–1 per beat
 * @property {'alternating-pan'} [panMode]
 * @property {number} [durationMs] total rhythm window; omit for open-ended
 *
 * @typedef {Object} HapticBreathSpec
 * @property {'breath'} type
 * @property {number} swellMs inhale / swell duration
 * @property {number} ebbMs exhale / ebb duration
 * @property {number} [minIntensity]
 * @property {number} [maxIntensity]
 * @property {string} [id]
 *
 * @typedef {HapticTransientSpec | HapticContinuousSpec | HapticRhythmSpec | HapticBreathSpec} HapticPhaseSpec
 */

/** @type {Record<string, { id: string, label: string, audioCueId?: string, phases: HapticPhaseSpec[] }>} */
export const HapticProfiles = {
  /**
   * 30s Instant Reset
   * Immediate sharp double-pulse (transient, peak) then 20s linear-decay continuous vibration.
   */
  'instant-reset': {
    id: 'instant-reset',
    label: 'Instant Reset — physiological sigh',
    audioCueId: 'instant-reset-sigh',
    phases: [
      {
        type: 'transient',
        intensity: 1,
        sharpness: 1,
        pattern: [45, 55, 45],
        delayMs: 0,
      },
      {
        type: 'transient',
        intensity: 1,
        sharpness: 0.95,
        pattern: [45, 55, 45],
        delayMs: 120,
      },
      {
        type: 'continuous',
        id: 'instant-reset-decay',
        intensity: 0.85,
        durationMs: 20_000,
        decay: 'linear',
        delayMs: 280,
      },
    ],
  },

  /**
   * 60s Orienting Anchor
   * Rhythm-linked alternating gentle thuds panning left-to-right for bilateral grounding.
   */
  'orienting-anchor': {
    id: 'orienting-anchor',
    label: 'Orienting Anchor — bilateral grounding',
    audioCueId: 'orienting-bilateral-tick',
    phases: [
      {
        type: 'rhythm',
        bpm: 60,
        intensity: 0.35,
        panMode: 'alternating-pan',
        durationMs: 60_000,
      },
    ],
  },

  /**
   * 90s Coherence Ripple
   * Continuous sine-like breathing haptic: 4s swell, 6s ebb, looping.
   */
  'coherence-ripple': {
    id: 'coherence-ripple',
    label: 'Coherence Ripple — resonant breath',
    audioCueId: 'coherence-breath-bed',
    phases: [
      {
        type: 'breath',
        id: 'coherence-breath',
        swellMs: 4_000,
        ebbMs: 6_000,
        minIntensity: 0.12,
        maxIntensity: 0.72,
      },
    ],
  },

  /**
   * 90s Vagal Downshift — original decay curve: engage pulse + 90s linear haptic decay.
   */
  'vagal-downshift': {
    id: 'vagal-downshift',
    label: 'Vagal Downshift — classic decay curve',
    audioCueId: 'vagal-decay-bed',
    phases: [
      {
        type: 'transient',
        intensity: 0.55,
        sharpness: 0.65,
        pattern: [40, 80, 35],
        delayMs: 0,
      },
      {
        type: 'continuous',
        id: 'vagal-decay',
        intensity: 0.88,
        durationMs: 90_000,
        decay: 'linear',
        delayMs: 220,
      },
    ],
  },
};

/** @param {string} variantId */
export function getHapticProfile(variantId) {
  return HapticProfiles[variantId] ?? HapticProfiles['coherence-ripple'];
}

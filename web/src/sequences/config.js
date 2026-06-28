/**
 * Release 1.33 — Somatic Circuit Breaker sequence definitions.
 * Modular configs consumed by SurgeSequence / SequenceEngine.
 */

export const InteractionMode = {
  AUTO: 'auto',
  BILATERAL: 'bilateral',
  HOLD: 'hold',
};

/** @typedef {'instant-reset' | 'orienting-anchor' | 'coherence-ripple' | 'vagal-downshift'} SequenceVariantId */

/**
 * @typedef {Object} SequencePalette
 * @property {string} background
 * @property {string} [backgroundEnd]
 * @property {string} accent
 * @property {string} [accentCalm]
 * @property {string} muted
 * @property {string} copy
 */

/**
 * @typedef {Object} SequenceVariant
 * @property {SequenceVariantId} id
 * @property {string} name
 * @property {string} tagline
 * @property {string} science
 * @property {number} durationSeconds
 * @property {keyof typeof InteractionMode} interactionMode
 * @property {SequencePalette} palette
 * @property {number} [transitionAtSeconds]
 * @property {{ inhale: number, exhale: number }} [breathCycle]
 * @property {string} [tabLabel] short label for picker tabs when durations collide
 * @property {number} [bilateralBpm]
 */

/** @type {Record<SequenceVariantId, SequenceVariant>} */
export const SEQUENCE_VARIANTS = {
  'instant-reset': {
    id: 'instant-reset',
    name: 'Instant Reset',
    tagline: 'Physiological sigh',
    tabLabel: '30',
    science: 'Double inhale and extended exhale to offload CO2 and trigger parasympathetic activation.',
    durationSeconds: 30,
    interactionMode: InteractionMode.AUTO,
    transitionAtSeconds: 10,
    palette: {
      background: '#120600',
      backgroundEnd: '#0a0e24',
      accent: '#ff6b1a',
      accentCalm: '#5b6cff',
      muted: 'rgba(255,255,255,0.45)',
      copy: '#f4f0eb',
    },
  },
  'orienting-anchor': {
    id: 'orienting-anchor',
    name: 'Orienting Anchor',
    tagline: 'Bilateral grounding',
    tabLabel: '60',
    science: 'Rhythmic bilateral stimulation and sensory tracking to integrate hemispheres and exit cognitive loops.',
    durationSeconds: 60,
    interactionMode: InteractionMode.BILATERAL,
    bilateralBpm: 60,
    palette: {
      background: '#2a1810',
      backgroundEnd: '#1e3228',
      accent: '#d4845c',
      accentCalm: '#8fb596',
      muted: 'rgba(244,240,235,0.5)',
      copy: '#f4f0eb',
    },
  },
  'coherence-ripple': {
    id: 'coherence-ripple',
    name: 'Coherence Ripple',
    tagline: 'Resonant breath hold',
    tabLabel: '90 · breath',
    science: 'Resonant breathing with continuous tactile anchor to settle the nervous system over ninety seconds.',
    durationSeconds: 90,
    interactionMode: InteractionMode.HOLD,
    breathCycle: { inhale: 4, exhale: 6 },
    palette: {
      background: '#041008',
      backgroundEnd: '#061828',
      accent: '#4a9a6a',
      accentCalm: '#4a88b8',
      muted: 'rgba(244,240,235,0.45)',
      copy: '#f4f0eb',
    },
  },
  'vagal-downshift': {
    id: 'vagal-downshift',
    name: 'Vagal Downshift',
    tagline: 'Classic decay curve',
    tabLabel: '90 · decay',
    science:
      'Press-and-hold dead man\'s switch. Visual, haptic, and audio intensity decay on a fixed curve from peak chaos to grounded heartbeat over ninety seconds.',
    durationSeconds: 90,
    interactionMode: InteractionMode.HOLD,
    palette: {
      background: '#120600',
      backgroundEnd: '#0a0e24',
      accent: '#B6502E',
      accentCalm: '#C45A32',
      muted: 'rgba(244,240,235,0.45)',
      copy: '#f4f0eb',
    },
  },
};

export const DEFAULT_VARIANT_ID = 'coherence-ripple';

/** @param {string | undefined | null} id */
export function resolveVariantId(id) {
  if (id && SEQUENCE_VARIANTS[id]) return id;
  return DEFAULT_VARIANT_ID;
}

/** @param {SequenceVariantId} id */
export function getVariant(id) {
  return SEQUENCE_VARIANTS[resolveVariantId(id)];
}

export const VARIANT_LIST = Object.values(SEQUENCE_VARIANTS);

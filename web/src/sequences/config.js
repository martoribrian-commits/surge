/**
 * Release 1.33 — Somatic Circuit Breaker sequence definitions.
 * Modular configs consumed by SurgeSequence / SequenceEngine.
 */

export const InteractionMode = {
  AUTO: 'auto',
  BILATERAL: 'bilateral',
  HOLD: 'hold',
};

/** @typedef {'instant-reset' | 'orienting-anchor' | 'coherence-ripple' | 'vagal-downshift' | 'static-field'} SequenceVariantId */

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
 * @property {string} feelsLike — body state in plain language
 * @property {string} whatItDoes — what the sequence does for your body
 * @property {string} whenToUse — when to pick this one
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
    tagline: 'When you need to breathe out the panic fast',
    tabLabel: '30',
    feelsLike:
      'Chest tight, breathing shallow, heart racing — like your body hit the gas and forgot how to stop.',
    whatItDoes:
      'Guides you through two quick inhales and one long exhale. That long exhale tells your nervous system the threat is over and slows your heart within about thirty seconds.',
    whenToUse:
      'Panic spike, before a hard conversation, or any moment you need the fastest possible downshift.',
    science: 'Physiological sigh — double inhale plus extended exhale to offload CO₂ and activate the calming branch of your nervous system.',
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
    tagline: 'When your thoughts are stuck on repeat',
    tabLabel: '60',
    feelsLike:
      'Mind racing in circles, replaying the same scene, unable to land in the present — like you are watching yourself from outside your body.',
    whatItDoes:
      'Rhythmic left-right tapping with sound and visuals pulls attention back into your body and out of the mental loop. Sixty seconds of alternating touch gives your brain something concrete to follow.',
    whenToUse:
      'Intrusive thoughts, dissociation, rumination, or when you feel mentally "stuck" and need to get back into the room.',
    science: 'Bilateral stimulation — alternating left/right sensory input to integrate brain hemispheres and interrupt cognitive loops.',
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
    tagline: 'When you need to slow down and breathe with something',
    tabLabel: '90 · breath',
    feelsLike:
      'Wired but exhausted, breathing fast and uneven, body buzzing — not full panic, but nowhere near calm.',
    whatItDoes:
      'A steady four-second inhale and six-second exhale, synced to sound and a gentle pulse you hold on screen. Ninety seconds of paced breathing trains your heart rate to settle into a smoother rhythm.',
    whenToUse:
      'Anxiety that will not peak but will not quit, pre-sleep wind-down, or when you want the gentlest full-length reset.',
    science: 'Resonant breathing near ~6 breaths per minute with continuous tactile anchor to increase heart-rate variability.',
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
    tagline: 'When everything feels too loud inside',
    tabLabel: '90 · decay',
    feelsLike:
      'Overwhelmed, flooded, body on high alert — like static in your nerves with no volume knob.',
    whatItDoes:
      'Press and hold while sound, visuals, and vibration start intense and slowly fade to a steady heartbeat. You control the pace by holding; the system walks your arousal down a fixed curve over ninety seconds.',
    whenToUse:
      'Full-body overwhelm, anger flooding up, or when you need something strong that visibly gets quieter as you stay with it.',
    science: 'Sustained somatic anchor with deterministic intensity decay — visual, haptic, and audio channels phase-lock to one downshift curve.',
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
  'static-field': {
    id: 'static-field',
    name: 'Static Field',
    tagline: 'When you need sound to carry you down',
    tabLabel: '90 · static',
    feelsLike:
      'Restless, agitated, unable to sit still — your body wants noise and release, not silence.',
    whatItDoes:
      'Procedural static and deep bass that start chaotic and carve down to a slow heartbeat while you hold. Sound does the heavy lifting; your job is to stay with it.',
    whenToUse:
      'Agitation, sensory overload, or when you respond better to audio than breath cues. Headphones strongly recommended.',
    science: 'Procedural pink-noise carve-down with sub-bass heartbeat entrainment — chaotic field at peak decaying to grounded pulse.',
    durationSeconds: 90,
    interactionMode: InteractionMode.HOLD,
    palette: {
      background: '#0A0A0A',
      backgroundEnd: '#121212',
      accent: '#F4F0EB',
      accentCalm: '#B6502E',
      muted: 'rgba(244,240,235,0.4)',
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

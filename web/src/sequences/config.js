/**
 * Release 1.33 — Somatic Circuit Breaker sequence definitions.
 * Modular configs consumed by SurgeSequence / SequenceEngine.
 */

export const InteractionMode = {
  AUTO: 'auto',
  BILATERAL: 'bilateral',
  HOLD: 'hold',
};

/** @typedef {'instant-reset' | 'flash-freeze' | 'orienting-anchor' | 'nova-gate' | 'still-thaw' | 'coherence-ripple' | 'heavy-tide' | 'vagal-downshift' | 'static-field' | 'dead-mans-switch' | 'deep-anchor'} SequenceVariantId */

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
 * @property {string} modality — clinical protocol label for providers
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
    modality: 'Physiological sigh intercept',
    tagline: 'When you need to breathe out the panic fast',
    tabLabel: '30 · sigh',
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
  'flash-freeze': {
    id: 'flash-freeze',
    name: 'Flash Freeze',
    modality: 'Thermal time-stop intercept',
    tagline: 'When heat needs to halt mid-air',
    tabLabel: '30 · freeze',
    feelsLike:
      'White-hot overwhelm — anger, adrenaline, or a spike so fast your body feels like it is burning through something.',
    whatItDoes:
      'Press and hold to stop time on a field of embers. Chaos slows, color inverts, particles crystallize into ice. Thirty seconds of visible thermal downshift — hold to freeze, release to pause.',
    whenToUse:
      'Anger spike, hot flush, adrenaline surge, or when you need to see intensity physically stop instead of breathe through it.',
    science: 'Interoceptive downshift via sustained tactile anchor paired with visual time-deceleration — thermal metaphor for sympathetic offload.',
    durationSeconds: 30,
    interactionMode: InteractionMode.HOLD,
    palette: {
      background: '#0a0200',
      backgroundEnd: '#020818',
      accent: '#FF4D00',
      accentCalm: '#67E8F9',
      muted: 'rgba(255,255,255,0.4)',
      copy: '#F0F9FF',
    },
  },
  'orienting-anchor': {
    id: 'orienting-anchor',
    name: 'Orienting Anchor',
    modality: 'Bilateral sensory orienting',
    tagline: 'When your thoughts are stuck on repeat',
    tabLabel: '60 · tap',
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
  'nova-gate': {
    id: 'nova-gate',
    name: 'Nova Gate',
    modality: 'Hyperspace entrainment tunnel',
    tagline: 'When you need to ride through and come out still',
    tabLabel: '60 · gate',
    feelsLike:
      'Disoriented, untethered, spinning — like your mind is scattered across too many places at once and cannot find a center.',
    whatItDoes:
      'A cosmic gate opens and pulls you through a starfield tunnel that accelerates, peaks, then decelerates to a single still point. Sixty seconds of pure visual transit — no taps, no hold. Just watch the warp settle.',
    whenToUse:
      'Dissociation, scattered attention, post-stress disorientation, or when bilateral tapping feels too manual and you want cinematic immersion.',
    science: 'Visuospatial entrainment — accelerating then decelerating optic flow recruits orienting networks and resolves into a fixed focal anchor.',
    durationSeconds: 60,
    interactionMode: InteractionMode.AUTO,
    palette: {
      background: '#030108',
      backgroundEnd: '#120828',
      accent: '#FFB347',
      accentCalm: '#9D4EDD',
      muted: 'rgba(255,220,180,0.45)',
      copy: '#FFF8F0',
    },
  },
  'still-thaw': {
    id: 'still-thaw',
    name: 'Still Thaw',
    modality: 'Progressive somatic re-awakening',
    tagline: 'When you feel frozen shut — not fired up',
    tabLabel: '60 · thaw',
    feelsLike:
      'Numb, heavy limbs, blank mind, disconnected from your body — the alarm is quiet but you are stuck, shut down, or floating outside yourself.',
    whatItDoes:
      'A cold field slowly warms from the edges inward. Frost crystals melt, color returns, and a gentle pulse rebuilds at your center. Sixty seconds of passive thawing — no taps, no hold. Just let sensation return.',
    whenToUse:
      'Freeze response, shutdown, emotional numbness, post-crisis collapse, or when every other sequence feels like too much to engage with.',
    science: 'Progressive interoceptive warming — gradual sensory re-entry from dorsal vagal shutdown without demanding active regulation.',
    durationSeconds: 60,
    interactionMode: InteractionMode.AUTO,
    transitionAtSeconds: 20,
    palette: {
      background: '#040810',
      backgroundEnd: '#1a1420',
      accent: '#7eb8d8',
      accentCalm: '#e8a86b',
      muted: 'rgba(180,210,230,0.4)',
      copy: '#eef4f8',
    },
  },
  'coherence-ripple': {
    id: 'coherence-ripple',
    name: 'Coherence Ripple',
    modality: 'Resonant breath entrainment',
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
  'heavy-tide': {
    id: 'heavy-tide',
    name: 'Heavy Tide',
    modality: 'Pendular emotional release entrainment',
    tagline: 'When sadness sits heavy and needs to move through',
    tabLabel: '90 · tide',
    feelsLike:
      'Chest ache, throat tight, tears behind the eyes, slow heaviness — not racing, not angry, just a weight that will not lift on its own.',
    whatItDoes:
      'Slow vertical tides rise and fall with a five-second inhale and seven-second exhale. Deep indigo waves carry the weight instead of fighting it. Hold to breathe with the tide. Ninety seconds of permission to feel without fixing.',
    whenToUse:
      'Grief, sadness, loneliness, post-cry heaviness, or when you need to move emotion through instead of downshift intensity away from it.',
    science: 'Pendular breath entrainment at ~5 breaths per minute — slower exhale bias supports parasympathetic engagement without emotional suppression.',
    durationSeconds: 90,
    interactionMode: InteractionMode.HOLD,
    breathCycle: { inhale: 5, exhale: 7 },
    palette: {
      background: '#080818',
      backgroundEnd: '#140828',
      accent: '#7a6aad',
      accentCalm: '#c4869a',
      muted: 'rgba(196,134,154,0.45)',
      copy: '#f0e8f4',
    },
  },
  'vagal-downshift': {
    id: 'vagal-downshift',
    name: 'Vagal Downshift',
    modality: 'Visual decay protocol',
    tagline: 'When overwhelm needs to visibly settle — not static',
    tabLabel: '90 · decay',
    feelsLike:
      'Flooded and overwhelmed — your nervous system needs to see intensity drop, layer by layer, not noise.',
    whatItDoes:
      'A clinical visual decay system: cool fog strata descend while a breath diaphragm guides you down a fixed arousal curve. Warm sub-bass audio, no harsh static. You watch the system settle over ninety seconds.',
    whenToUse:
      'Emotional flooding, anger, or overwhelm when you need a visible, structured downshift — distinct from the sonic Static Field.',
    science: 'Deterministic multi-channel decay curve — visual fog descent, breath diaphragm, and warm sub-bass phase-locked to one downshift timeline.',
    durationSeconds: 90,
    interactionMode: InteractionMode.HOLD,
    palette: {
      background: '#020610',
      backgroundEnd: '#061420',
      accent: '#6B9AAA',
      accentCalm: '#8FB596',
      muted: 'rgba(143,181,150,0.45)',
      copy: '#E8F0EC',
    },
  },
  'static-field': {
    id: 'static-field',
    name: 'Static Field',
    modality: 'Sonic entrainment field',
    tagline: 'Maximum impact — the original Surge sonic engine',
    tabLabel: '90 · static',
    feelsLike:
      'Restless, agitated, unable to sit still — your body wants noise and release, not silence.',
    whatItDoes:
      'The original Surge sonic engine at full intensity: live TV static, pink-noise carve, sub-bass heartbeat lock, and stereo wander. Warm chaotic canvas with maximum sensory impact. Headphones required.',
    whenToUse:
      'Agitation, sensory overload, or when you need the hardest-hitting acoustic downshift. Not the same as Vagal — this is sound-first chaos-to-pulse.',
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
  'dead-mans-switch': {
    id: 'dead-mans-switch',
    name: "Dead-Man's Switch",
    modality: 'Physical anchoring · chaos-to-baseline curve',
    tagline: 'Hold to run the curve — release pauses, nothing lost',
    tabLabel: '90 · switch',
    feelsLike:
      'Your body will not settle without touch — restless, overloaded, or stuck in sympathetic noise until something physically anchors you.',
    whatItDoes:
      'Press and hold your thumb on the screen. A single normalized curve drives every sensory channel from chaotic peak down to baseline. Release anytime — progress pauses and the field gently pulses, waiting for you to return. Ninety seconds when held through. No streaks, badges, or congratulations — the reward is physical relief.',
    whenToUse:
      'When you need the classic Surge dead-man switch: maximum somatic impact with mandatory physical anchoring before Crane recovery.',
    science:
      'Dead-man switch entrainment — sustained tactile anchor with phase-locked visual strobe (≤2.5 Hz), white-noise-to-sub-bass decay, and haptic chaos-to-heartbeat curve.',
    durationSeconds: 90,
    interactionMode: InteractionMode.HOLD,
    palette: {
      background: '#0A0A0A',
      backgroundEnd: '#121212',
      accent: '#FFF8E8',
      accentCalm: '#FFB347',
      muted: 'rgba(244,240,235,0.4)',
      copy: '#f4f0eb',
    },
  },
  'deep-anchor': {
    id: 'deep-anchor',
    name: 'Deep Anchor',
    modality: 'Extended bilateral somatic integration',
    tagline: 'When the loop will not quit — go deeper',
    tabLabel: '120 · anchor',
    feelsLike:
      'Shame spiral, self-criticism on repeat, intrusive "why did I" loops — the kind of mental pattern that keeps running after sixty seconds is not enough.',
    whatItDoes:
      'Two full minutes of slow left-right tapping at forty-eight beats per minute. Hemispheres integrate layer by layer until the loop loosens. The longest bilateral protocol — for when Orienting Anchor was close but not quite enough.',
    whenToUse:
      'Shame, guilt, self-attack, intractable rumination, or post-conflict mental replay that needs extended bilateral grounding.',
    science: 'Extended alternating sensory stimulation — slower bilateral cadence over two minutes supports cognitive-emotional integration beyond brief orienting windows.',
    durationSeconds: 120,
    interactionMode: InteractionMode.BILATERAL,
    bilateralBpm: 48,
    palette: {
      background: '#1a0e08',
      backgroundEnd: '#0a1814',
      accent: '#c49a6c',
      accentCalm: '#6a9a8a',
      muted: 'rgba(244,240,235,0.45)',
      copy: '#f4f0eb',
    },
  },
};

export const DEFAULT_VARIANT_ID = 'dead-mans-switch';

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

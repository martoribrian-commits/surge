import { InteractionMode } from './config';
import { BRAND } from '../brand/tokens';

export const CUSTOM_VARIANT_PREFIX = 'custom-';

export const VISUAL_TYPES = ['pulse', 'ripple', 'fog', 'ember', 'gate', 'field', 'thaw'];

export const PALETTE_MOODS = {
  warm: {
    background: '#1a0e08',
    backgroundEnd: '#120a06',
    accent: '#c49a6c',
    accentCalm: '#8a6a4a',
    muted: 'rgba(244,240,235,0.45)',
    copy: BRAND.bone,
  },
  cool: {
    background: '#0a1218',
    backgroundEnd: '#060c10',
    accent: '#6a9ab8',
    accentCalm: '#4a7a98',
    muted: 'rgba(244,240,235,0.4)',
    copy: BRAND.bone,
  },
  neutral: {
    background: '#12100e',
    backgroundEnd: '#0a0908',
    accent: BRAND.clay,
    accentCalm: '#8a5040',
    muted: 'rgba(244,240,235,0.45)',
    copy: BRAND.bone,
  },
  clay: {
    background: '#140c0a',
    backgroundEnd: '#0c0806',
    accent: '#B6502E',
    accentCalm: '#8a4020',
    muted: 'rgba(244,240,235,0.45)',
    copy: BRAND.bone,
  },
  void: {
    background: BRAND.void,
    backgroundEnd: '#050505',
    accent: '#888880',
    accentCalm: '#666660',
    muted: 'rgba(244,240,235,0.35)',
    copy: BRAND.bone,
  },
};

const DURATIONS = [30, 60, 90, 120];
const MODES = [InteractionMode.AUTO, InteractionMode.HOLD, InteractionMode.BILATERAL];

/** @param {string | null | undefined} id */
export function isCustomVariantId(id) {
  return typeof id === 'string' && id.startsWith(CUSTOM_VARIANT_PREFIX);
}

/**
 * @param {unknown} spec
 * @returns {import('./config').SequenceVariant & { isCustom: true, customSpec: object }}
 */
export function buildCustomVariant(spec) {
  const normalized = normalizeCustomSpec(spec);
  const id = normalized.id ?? `${CUSTOM_VARIANT_PREFIX}${crypto.randomUUID().slice(0, 8)}`;

  return {
    id,
    name: normalized.name,
    tagline: normalized.tagline,
    science: normalized.science ?? 'Procedural sequence attuned to your reported body state.',
    feelsLike: normalized.feelsLike,
    whatItDoes: normalized.whatItDoes,
    whenToUse: normalized.whenToUse,
    modality: normalized.modality ?? 'Custom · Crane attuned',
    durationSeconds: normalized.durationSeconds,
    interactionMode: normalized.interactionMode,
    palette: normalized.palette,
    breathCycle: normalized.breathCycle,
    bilateralBpm: normalized.bilateralBpm,
    transitionAtSeconds: normalized.transitionAtSeconds,
    visualType: normalized.visualType,
    audioProfile: normalized.audioProfile,
    phases: normalized.phases,
    isCustom: true,
    customSpec: normalized,
  };
}

/**
 * @param {unknown} raw
 */
export function normalizeCustomSpec(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};

  const durationSeconds = DURATIONS.includes(input.durationSeconds)
    ? input.durationSeconds
    : 60;

  const interactionMode = MODES.includes(input.interactionMode)
    ? input.interactionMode
    : InteractionMode.AUTO;

  const visualType = VISUAL_TYPES.includes(input.visualType) ? input.visualType : 'pulse';

  const paletteMood = PALETTE_MOODS[input.paletteMood] ? input.paletteMood : 'neutral';
  const palette = { ...PALETTE_MOODS[paletteMood] };

  const breathCycle =
    input.breathCycle &&
    typeof input.breathCycle.inhale === 'number' &&
    typeof input.breathCycle.exhale === 'number'
      ? {
          inhale: clamp(input.breathCycle.inhale, 2, 8),
          exhale: clamp(input.breathCycle.exhale, 3, 12),
        }
      : interactionMode === InteractionMode.HOLD
        ? { inhale: 4, exhale: 6 }
        : undefined;

  const phases = normalizePhases(input.phases, durationSeconds);

  const audioProfile = {
    baseFreq: clamp(Number(input.audioProfile?.baseFreq ?? 110), 40, 220),
    toneType: input.audioProfile?.toneType === 'triangle' ? 'triangle' : 'sine',
    noiseLevel: clamp(Number(input.audioProfile?.noiseLevel ?? 0.35), 0.05, 0.85),
    tempo: ['slow', 'medium', 'fast'].includes(input.audioProfile?.tempo)
      ? input.audioProfile.tempo
      : 'medium',
    warmth: ['cool', 'neutral', 'warm'].includes(input.audioProfile?.warmth)
      ? input.audioProfile.warmth
      : 'neutral',
  };

  return {
    id: typeof input.id === 'string' ? input.id : null,
    name: String(input.name ?? 'Your Sequence').slice(0, 48).trim() || 'Your Sequence',
    tagline: String(input.tagline ?? 'Attuned to you right now').slice(0, 120),
    feelsLike: String(input.feelsLike ?? 'A field shaped around what you described.').slice(0, 280),
    whatItDoes: String(
      input.whatItDoes ?? 'Procedural sound and motion to help your nervous system find a new rhythm.',
    ).slice(0, 280),
    whenToUse: String(input.whenToUse ?? 'When the preset sequences do not match what your body needs.').slice(
      0,
      280,
    ),
    modality: String(input.modality ?? 'Custom · Crane attuned').slice(0, 80),
    science: String(input.science ?? '').slice(0, 200) || undefined,
    reportedState: String(input.reportedState ?? '').slice(0, 400),
    rationale: String(input.rationale ?? '').slice(0, 400),
    durationSeconds,
    interactionMode,
    visualType,
    paletteMood,
    palette,
    breathCycle,
    bilateralBpm: clamp(Number(input.bilateralBpm ?? 54), 36, 72),
    transitionAtSeconds: clamp(
      Number(input.transitionAtSeconds ?? Math.round(durationSeconds * 0.35)),
      5,
      durationSeconds - 5,
    ),
    audioProfile,
    phases,
  };
}

function normalizePhases(phases, durationSeconds) {
  if (!Array.isArray(phases) || phases.length === 0) {
    const third = Math.round(durationSeconds / 3);
    return [
      { atSeconds: 0, label: 'Arrive', hint: 'Notice what is here' },
      { atSeconds: third, label: 'Settle', hint: 'Let the field carry you' },
      { atSeconds: third * 2, label: 'Release', hint: 'Nothing to fix' },
    ];
  }

  return phases
    .slice(0, 5)
    .map((phase, index) => ({
      atSeconds: clamp(Number(phase.atSeconds ?? index * 15), 0, durationSeconds - 1),
      label: String(phase.label ?? `Phase ${index + 1}`).slice(0, 40),
      hint: phase.hint ? String(phase.hint).slice(0, 60) : undefined,
    }))
    .sort((a, b) => a.atSeconds - b.atSeconds);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const SESSION_STORAGE_KEY = 'surge-custom-sequence-v1';

/** @param {ReturnType<typeof buildCustomVariant>} variant */
export function persistCustomVariant(variant) {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(variant.customSpec ?? variant));
  } catch {
    /* quota / private mode */
  }
}

/** @returns {ReturnType<typeof buildCustomVariant> | null} */
export function loadPersistedCustomVariant() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return buildCustomVariant(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearPersistedCustomVariant() {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Offline rule-based custom sequence when Crane API is unavailable.
 * @param {string} userMessage
 */
export function buildFallbackCustomSequence(userMessage) {
  const q = userMessage.toLowerCase().trim();

  let interactionMode = InteractionMode.AUTO;
  let visualType = 'pulse';
  let durationSeconds = 60;
  let paletteMood = 'neutral';
  let name = 'Soft Reset';
  let feelsLike = 'A gentle field that meets you where you are.';
  let audioProfile = { baseFreq: 110, noiseLevel: 0.3, tempo: 'medium', warmth: 'neutral', toneType: 'sine' };

  if (/numb|shut|frozen|empty|flat|dissoci/.test(q)) {
    name = 'Warm Return';
    feelsLike = 'Slow warmth moving back into a shut-down system.';
    visualType = 'thaw';
    paletteMood = 'warm';
    interactionMode = InteractionMode.AUTO;
    audioProfile = { baseFreq: 88, noiseLevel: 0.25, tempo: 'slow', warmth: 'warm', toneType: 'sine' };
  } else if (/grief|sad|heavy|loss|ache/.test(q)) {
    name = 'Tide Hold';
    feelsLike = 'Weight acknowledged, then slowly released.';
    visualType = 'ripple';
    paletteMood = 'cool';
    durationSeconds = 90;
    interactionMode = InteractionMode.HOLD;
    audioProfile = { baseFreq: 72, noiseLevel: 0.4, tempo: 'slow', warmth: 'cool', toneType: 'sine' };
  } else if (/shame|stuck|loop|intrusive|replay/.test(q)) {
    name = 'Anchor Pulse';
    feelsLike = 'Left-right grounding when thoughts will not stop.';
    visualType = 'field';
    durationSeconds = 90;
    interactionMode = InteractionMode.BILATERAL;
    audioProfile = { baseFreq: 98, noiseLevel: 0.35, tempo: 'medium', warmth: 'neutral', toneType: 'triangle' };
  } else if (/anger|rage|hot|furious/.test(q)) {
    name = 'Cool Ember';
    feelsLike = 'Heat contained, then dissolving.';
    visualType = 'ember';
    durationSeconds = 30;
    paletteMood = 'clay';
    interactionMode = InteractionMode.HOLD;
    audioProfile = { baseFreq: 65, noiseLevel: 0.5, tempo: 'fast', warmth: 'cool', toneType: 'triangle' };
  } else if (/scatter|disorient|spinning|untether/.test(q)) {
    name = 'Still Gate';
    feelsLike = 'A tunnel that pulls scattered attention inward.';
    visualType = 'gate';
    durationSeconds = 60;
    interactionMode = InteractionMode.AUTO;
    audioProfile = { baseFreq: 130, noiseLevel: 0.45, tempo: 'medium', warmth: 'cool', toneType: 'sine' };
  } else if (/panic|racing|heart|breathe/.test(q)) {
    name = 'Breath Field';
    feelsLike = 'Quick downshift for an alarmed system.';
    visualType = 'pulse';
    durationSeconds = 30;
    interactionMode = InteractionMode.AUTO;
    audioProfile = { baseFreq: 120, noiseLevel: 0.55, tempo: 'fast', warmth: 'neutral', toneType: 'sine' };
  } else if (/overwhelm|flood|too much/.test(q)) {
    name = 'Fog Downshift';
    feelsLike = 'Visual and sonic fog to soften flooding.';
    visualType = 'fog';
    durationSeconds = 90;
    interactionMode = InteractionMode.HOLD;
    audioProfile = { baseFreq: 55, noiseLevel: 0.6, tempo: 'slow', warmth: 'cool', toneType: 'sine' };
  }

  return buildCustomVariant({
    name,
    tagline: 'Built for what you described',
    feelsLike,
    whatItDoes: 'Procedural sound, motion, and pacing tuned to your words.',
    whenToUse: 'When none of the preset sequences feel right.',
    reportedState: userMessage.slice(0, 400),
    rationale: 'Offline fallback attuned to keywords in your description.',
    durationSeconds,
    interactionMode,
    visualType,
    paletteMood,
    audioProfile,
    phases: normalizePhases(null, durationSeconds),
  });
}

/** @param {ReturnType<typeof buildCustomVariant>} variant @param {number} elapsedSeconds */
export function phaseAtElapsed(variant, elapsedSeconds) {
  const phases = variant.phases ?? [];
  let active = phases[0] ?? { label: 'Begin', hint: undefined };
  for (const phase of phases) {
    if (elapsedSeconds >= phase.atSeconds) active = phase;
  }
  return active;
}

import { VARIANT_LIST } from '../sequences';

/**
 * Plain-language sequence catalog for Crane guide mode and offline fallbacks.
 */
export function buildSequenceGuideCatalog() {
  return VARIANT_LIST.map((v) => ({
    id: v.id,
    name: v.name,
    durationSeconds: v.durationSeconds,
    tagline: v.tagline,
    modality: v.modality,
    feelsLike: v.feelsLike,
    whatItDoes: v.whatItDoes,
    whenToUse: v.whenToUse,
    interaction:
      v.interactionMode === 'auto'
        ? 'Starts on its own once you tap Begin'
        : v.interactionMode === 'bilateral'
          ? 'Tap left, then right, in rhythm'
          : 'Press and hold anywhere below the header. Release to pause.',
  }));
}

export const CRANE_GUIDE_OPENER =
  'I am your clinical somatic guide for Surge. I can explain what each sequence does for your body, recommend the right protocol, and start one for you when you are ready. What does your body feel like right now?';

export const CRANE_POST_SESSION_OPENER =
  'The sequence is behind you. I am here if something surfaced or you want to talk through what happened.';

/**
 * Static fallback when inference is unavailable — keyword-matched from catalog.
 */
export function matchGuideFallback(userMessage) {
  const q = userMessage.toLowerCase().trim();
  if (!q) return null;

  if (/which|pick|choose|help me|what should|recommend/.test(q)) {
    return (
      'Quick guide:\n\n' +
      '• Instant Reset (30s) — panic spike, racing heart, need speed.\n' +
      '• Flash Freeze (30s) — hot anger, adrenaline, need to stop intensity.\n' +
      '• Orienting Anchor (60s) — stuck thoughts, replaying, not present.\n' +
      '• Nova Gate (60s) — scattered, disoriented, need cinematic transit.\n' +
      '• Still Thaw (60s) — numb, shut down, frozen, cannot engage.\n' +
      '• Coherence Ripple (90s) — wired-but-tired, uneven breathing.\n' +
      '• Heavy Tide (90s) — grief, sadness, heaviness in the chest.\n' +
      '• Vagal Downshift (90s) — flooded, overwhelmed, too loud inside.\n' +
      '• Static Field (90s) — restless, agitated, sound helps you settle.\n' +
      '• Deep Anchor (120s) — shame loop, self-attack, intractable rumination.\n\n' +
      'Tell me what your body feels like right now and I will narrow it down.'
    );
  }

  for (const v of VARIANT_LIST) {
    const tokens = [
      v.id.replace(/-/g, ' '),
      v.name.toLowerCase(),
      ...v.name.toLowerCase().split(' '),
    ];
    if (tokens.some((t) => t.length > 3 && q.includes(t))) {
      return `${v.name} (${v.durationSeconds}s)\n\nFeels like: ${v.feelsLike}\n\nWhat it does: ${v.whatItDoes}\n\nPick this when: ${v.whenToUse}`;
    }
  }

  if (/bilateral|left.*right|tap/.test(q)) {
    return 'Bilateral means alternating left and right. In Orienting Anchor you tap one side of the screen, then the other, in rhythm. It gives a racing mind something physical to follow so you land back in your body instead of stuck in your head.';
  }

  if (/hold|press/.test(q)) {
    return 'Hold sequences (Coherence Ripple, Heavy Tide, Vagal Downshift, Static Field): press anywhere below the top bar and keep holding. Sound and visuals advance while you hold. Let go to pause. Exit is always in the header.';
  }

  if (/breath|sigh|inhale|exhale/.test(q)) {
    const ir = VARIANT_LIST.find((v) => v.id === 'instant-reset');
    const cr = VARIANT_LIST.find((v) => v.id === 'coherence-ripple');
    return `Instant Reset uses a physiological sigh — two quick inhales, one long exhale — to slow a racing heart fast (${ir.durationSeconds}s).\n\nCoherence Ripple paces a slower 4-in / 6-out breath for ninety seconds when you need a gentler full reset.`;
  }

  if (/anger|rage|hot|furious|adrenaline/.test(q)) {
    return 'Sounds like Flash Freeze — thirty seconds, press and hold. Ember chaos slows and crystallizes. For when intensity needs to visibly stop.';
  }

  if (/scatter|disorient|untether|spinning|floating/.test(q)) {
    return 'Sounds like Nova Gate — sixty seconds, fully automatic. A warp tunnel accelerates then settles to a still point. For scattered or disoriented states.';
  }

  if (/numb|shutdown|frozen|shut down|can't feel|cant feel|blank|collapse/.test(q)) {
    return 'Sounds like Still Thaw — sixty seconds, fully automatic. A cold field slowly warms from the edges inward. For freeze response, emotional numbness, or when you have no energy to tap or hold.';
  }

  if (/grief|sad|sorrow|cry|tears|heavy|lonely|loneliness|ache/.test(q)) {
    return 'Sounds like Heavy Tide — ninety seconds, press and hold. Slow vertical tides rise and fall with a five-in / seven-out breath. For sadness, grief, or heaviness that needs to move through instead of away.';
  }

  if (/panic|racing|heart|can't breathe|cant breathe/.test(q)) {
    return 'Sounds like Instant Reset — thirty seconds, runs on its own. Two quick inhales, one long exhale. That long exhale is what tells your body the alarm can stand down.';
  }

  if (/stuck|loop|replay|dissoci|intrusive/.test(q)) {
    return 'Two bilateral protocols:\n\n• **Orienting Anchor** (60s) — left-right tapping at sixty beats per minute. For intrusive thoughts and getting back in the room.\n\n• **Deep Anchor** (120s) — extended bilateral at forty-eight BPM for two full minutes. For shame spirals, self-attack, or loops that need more time to release.';
  }

  if (/shame|guilt|self-attack|self attack|hate myself|worthless/.test(q)) {
    return 'Sounds like Deep Anchor — two full minutes of slow left-right tapping. Extended bilateral integration for shame spirals and self-criticism on repeat.';
  }

  if (/overwhelm|flood|too much|static|agitat|restless/.test(q)) {
    return 'Two distinct 90-second protocols:\n\n• **Vagal Downshift** — visual decay. Cool fog layers descend; you watch arousal drop on a clinical curve. Warm audio, no harsh static. For emotional flooding.\n\n• **Static Field** — sonic entrainment. Live TV static + pink noise at full intensity. Headphones required. For agitation and sensory overload.';
  }

  return (
    'Surge has ten sequences — 30, 60, 90, or 120 seconds — each built for a different body state. ' +
    'Tell me what you feel right now (racing heart, stuck thoughts, numb, sad, shame loop, overwhelmed, restless) and I will point you to the right one.'
  );
}

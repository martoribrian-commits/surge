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
  'I can explain what each Surge sequence does for your body — in plain language, no jargon. Ask which one to pick, what a sequence feels like, or what "bilateral" actually means for you.';

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
      '• Orienting Anchor (60s) — stuck thoughts, replaying, not present.\n' +
      '• Coherence Ripple (90s) — wired-but-tired, uneven breathing.\n' +
      '• Vagal Downshift (90s) — flooded, overwhelmed, too loud inside.\n' +
      '• Static Field (90s) — restless, agitated, sound helps you settle.\n\n' +
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
    return 'Hold sequences (Coherence Ripple, Vagal Downshift, Static Field): press anywhere below the top bar and keep holding. Sound and visuals advance while you hold. Let go to pause. Exit is always in the header.';
  }

  if (/breath|sigh|inhale|exhale/.test(q)) {
    const ir = VARIANT_LIST.find((v) => v.id === 'instant-reset');
    const cr = VARIANT_LIST.find((v) => v.id === 'coherence-ripple');
    return `Instant Reset uses a physiological sigh — two quick inhales, one long exhale — to slow a racing heart fast (${ir.durationSeconds}s).\n\nCoherence Ripple paces a slower 4-in / 6-out breath for ninety seconds when you need a gentler full reset.`;
  }

  if (/panic|racing|heart|can't breathe|cant breathe/.test(q)) {
    return 'Sounds like Instant Reset — thirty seconds, runs on its own. Two quick inhales, one long exhale. That long exhale is what tells your body the alarm can stand down.';
  }

  if (/stuck|loop|replay|dissoci|intrusive/.test(q)) {
    return 'Sounds like Orienting Anchor — sixty seconds of left-right tapping. It interrupts the mental loop by giving your brain a simple physical rhythm to follow.';
  }

  if (/overwhelm|flood|too much|static|agitat|restless/.test(q)) {
    return 'Two options: Vagal Downshift walks intensity down from loud to quiet while you hold. Static Field uses sound — chaotic static fading to a slow heartbeat. Both are ninety seconds; headphones help for Static Field.';
  }

  return (
    'Surge has five sequences — 30, 60, or 90 seconds — each built for a different body state. ' +
    'Tell me what you feel right now (racing heart, stuck thoughts, overwhelmed, restless) and I will point you to the right one.'
  );
}

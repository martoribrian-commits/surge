/** Variant-specific integration copy shown after sequence completion. */

export const AFTERMATH_INTEGRATION = {
  'instant-reset': 'Your exhale just told your nervous system the spike can end. Notice if your chest is even slightly softer before you rush on.',
  'flash-freeze': 'You stopped the heat mid-air. The freeze was not suppression — it was a pause. Let the stillness settle before you re-engage.',
  'orienting-anchor': 'Bilateral rhythm pulled you back into the room. If thoughts return, your body still knows the pattern it just followed.',
  'nova-gate': 'You rode the tunnel through and landed. Disorientation often eases in the minute after a visual transit — give yourself that minute.',
  'still-thaw': 'Thawing is gradual. You do not have to feel warm yet. Notice any small return of sensation in hands, jaw, or breath.',
  'coherence-ripple': 'Resonant breathing shifts autonomic balance over time. One cycle plants the pattern — repetition strengthens it.',
  'heavy-tide': 'The pendulum moved grief and activation together. Heaviness after release is normal. You do not have to make meaning of it yet.',
  'vagal-downshift': 'Extended hold gave your vagus nerve time to respond. Softening may arrive quietly — watch for it in the next few minutes.',
  'static-field': 'Sonic entrainment works best with repetition. If your mind wandered, your body still heard the downshift curve.',
  'dead-mans-switch':
    'You held the curve through. No badge, no streak — notice if your body feels even slightly quieter before you move on.',
  'deep-anchor': 'Two minutes of bilateral integration is a longer landing. Stay with whatever surfaced — integration is the point.',
};

export function integrationCopyForVariant(variantId, variantName) {
  if (variantId?.startsWith('custom-')) {
    return `You built ${variantName ?? 'this sequence'} for what you felt. Take a moment before you decide what comes next.`;
  }
  return AFTERMATH_INTEGRATION[variantId] ?? 'You gave your nervous system a fixed path down. Take a moment before you decide what comes next.';
}

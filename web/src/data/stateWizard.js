import { VARIANT_LIST } from '../sequences';

/** Three-step body-state wizard → recommended variant. */

export const WIZARD_ACTIVATION = [
  { id: 'surge', label: 'Racing / fired up', hint: 'Heart, heat, adrenaline' },
  { id: 'flood', label: 'Flooded / overwhelmed', hint: 'Too much at once' },
  { id: 'stuck', label: 'Stuck in my head', hint: 'Loops, rumination' },
  { id: 'scattered', label: 'Scattered / untethered', hint: 'Disoriented, far away' },
  { id: 'shutdown', label: 'Shut down / numb', hint: 'Frozen, flat, heavy' },
  { id: 'wired', label: 'Wired but exhausted', hint: 'Tired and activated' },
];

export const WIZARD_DURATION = [
  { id: 30, label: '30 seconds', hint: 'Fastest interrupt' },
  { id: 60, label: '60 seconds', hint: 'Standard reset' },
  { id: 90, label: '90 seconds', hint: 'Deeper downshift' },
  { id: 120, label: '2 minutes', hint: 'Extended integration' },
];

const RECOMMENDATIONS = {
  surge: { 30: 'instant-reset', 60: 'orienting-anchor', 90: 'dead-mans-switch', 120: 'deep-anchor' },
  flood: { 30: 'flash-freeze', 60: 'nova-gate', 90: 'vagal-downshift', 120: 'deep-anchor' },
  stuck: { 30: 'instant-reset', 60: 'orienting-anchor', 90: 'coherence-ripple', 120: 'deep-anchor' },
  scattered: { 30: 'flash-freeze', 60: 'nova-gate', 90: 'static-field', 120: 'deep-anchor' },
  shutdown: { 30: 'instant-reset', 60: 'still-thaw', 90: 'heavy-tide', 120: 'deep-anchor' },
  wired: { 30: 'instant-reset', 60: 'orienting-anchor', 90: 'coherence-ripple', 120: 'deep-anchor' },
};

export function recommendVariant(activationId, durationSeconds) {
  const map = RECOMMENDATIONS[activationId];
  if (!map) return VARIANT_LIST[0]?.id ?? 'instant-reset';

  const exact = map[durationSeconds];
  if (exact) return exact;

  const durations = [30, 60, 90, 120];
  const nearest = durations.reduce((best, d) =>
    Math.abs(d - durationSeconds) < Math.abs(best - durationSeconds) ? d : best,
  durations[0]);
  return map[nearest] ?? 'instant-reset';
}

export function variantMeta(variantId) {
  return VARIANT_LIST.find((v) => v.id === variantId) ?? null;
}

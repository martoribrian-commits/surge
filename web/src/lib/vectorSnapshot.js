const VALID_VARIANTS = new Set([
  'instant-reset',
  'orienting-anchor',
  'coherence-ripple',
  'vagal-downshift',
  'static-field',
]);

/**
 * Build a privacy-safe somatic summary for crane_vector_snapshots.
 * Never includes raw user messages — only structured clinical read/debrief.
 */
export function buildVectorSnapshotPayload(inference, { sessionId, variantId } = {}) {
  if (!sessionId) return null;

  const { bodyInsight, carePlan } = inference ?? {};
  let summary = null;

  if (bodyInsight?.type === 'post-session-debrief' && bodyInsight.debriefSummary) {
    summary = bodyInsight.debriefSummary;
  } else if (bodyInsight?.autonomicRead) {
    summary = bodyInsight.autonomicRead;
  } else if (carePlan?.clinicalNote) {
    summary = carePlan.clinicalNote;
  }

  if (!summary?.trim()) return null;

  const resolvedVariant =
    variantId ??
    bodyInsight?.completedVariantId ??
    carePlan?.completedVariantId ??
    inference?.variantId ??
    null;

  const metadata = {
    type: bodyInsight?.type ?? (carePlan ? 'care-plan' : 'unknown'),
    variantId: VALID_VARIANTS.has(resolvedVariant) ? resolvedVariant : null,
    stepCount: carePlan?.steps?.length ?? 0,
    matchConfidence: bodyInsight?.matchConfidence ?? null,
  };

  return {
    sessionId,
    summary: summary.trim().slice(0, 600),
    metadata,
  };
}

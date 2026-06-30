import { buildVectorSnapshotPayload } from './vectorSnapshot';
import { submitVectorSnapshot } from './craneClient';

/** Auto-launch countdown durations (mirrors server — ms). */
export const CRANE_COUNTDOWN_MS = {
  immediate: 3000,
  confirmed: 4500,
  standard: 4000,
};

const CARE_PLAN_PREFIX = 'surge.crane.careplan.';
const BODY_INSIGHT_PREFIX = 'surge.crane.bodyinsight.';

/** Shared variant labels for care plan UI (mirrors server catalog). */
export const VARIANT_LABELS = {
  'instant-reset': 'Instant Reset',
  'flash-freeze': 'Flash Freeze',
  'orienting-anchor': 'Orienting Anchor',
  'nova-gate': 'Nova Gate',
  'still-thaw': 'Still Thaw',
  'coherence-ripple': 'Coherence Ripple',
  'heavy-tide': 'Heavy Tide',
  'vagal-downshift': 'Vagal Downshift',
  'static-field': 'Static Field',
  'deep-anchor': 'Deep Anchor',
};

export function carePlanStorageKey(sessionId) {
  return sessionId ? `${CARE_PLAN_PREFIX}${sessionId}` : null;
}

export function bodyInsightStorageKey(sessionId) {
  return sessionId ? `${BODY_INSIGHT_PREFIX}${sessionId}` : null;
}

export function saveCarePlan(sessionId, carePlan) {
  const key = carePlanStorageKey(sessionId);
  if (!key || !carePlan) return;
  try {
    const existing = loadCarePlan(sessionId);
    const completedSteps = carePlan.completedSteps ?? existing?.completedSteps ?? [];
    localStorage.setItem(
      key,
      JSON.stringify({ ...carePlan, completedSteps, savedAt: Date.now() }),
    );
  } catch {
    /* quota or private mode */
  }
}

export function loadCarePlan(sessionId) {
  const key = carePlanStorageKey(sessionId);
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      completedSteps: Array.isArray(parsed.completedSteps) ? parsed.completedSteps : [],
    };
  } catch {
    return null;
  }
}

export function toggleCarePlanStep(sessionId, stepOrder) {
  const plan = loadCarePlan(sessionId);
  if (!plan) return null;
  const completed = new Set(plan.completedSteps ?? []);
  if (completed.has(stepOrder)) {
    completed.delete(stepOrder);
  } else {
    completed.add(stepOrder);
  }
  const updated = { ...plan, completedSteps: [...completed].sort((a, b) => a - b) };
  saveCarePlan(sessionId, updated);
  return updated;
}

export function isCarePlanComplete(carePlan) {
  if (!carePlan?.steps?.length) return false;
  const done = new Set(carePlan.completedSteps ?? []);
  return carePlan.steps.every((s) => done.has(s.order));
}

export function nextIncompleteStep(carePlan) {
  if (!carePlan?.steps?.length) return null;
  const done = new Set(carePlan.completedSteps ?? []);
  return carePlan.steps.find((s) => !done.has(s.order)) ?? null;
}

export function saveBodyInsight(sessionId, bodyInsight) {
  const key = bodyInsightStorageKey(sessionId);
  if (!key || !bodyInsight) return;
  try {
    localStorage.setItem(key, JSON.stringify({ ...bodyInsight, savedAt: Date.now() }));
  } catch {
    /* ignore */
  }
}

export function loadBodyInsight(sessionId) {
  const key = bodyInsightStorageKey(sessionId);
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCarePlan(sessionId) {
  const key = carePlanStorageKey(sessionId);
  if (key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Apply inference side effects: session meta, care plan, body insight, auto-launch, vector snapshot.
 */
export function processCraneInferenceResult(
  inference,
  { sessionId, variantId, scheduleAutoLaunch, recordMeta, writeVector = true },
) {
  recordMeta?.(inference);

  if (inference?.carePlan && sessionId) {
    const existing = loadCarePlan(sessionId);
    saveCarePlan(sessionId, {
      ...inference.carePlan,
      completedSteps: existing?.completedSteps ?? [],
    });
  }

  if (inference?.bodyInsight && sessionId) {
    saveBodyInsight(sessionId, inference.bodyInsight);
  }

  if (inference?.autoLaunch) {
    scheduleAutoLaunch?.(inference.autoLaunch);
  }

  if (writeVector && sessionId) {
    const snapshot = buildVectorSnapshotPayload(inference, { sessionId, variantId });
    if (snapshot) {
      submitVectorSnapshot(snapshot);
    }
  }

  return inference;
}

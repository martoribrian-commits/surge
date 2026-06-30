/** Shared variant labels for care plan UI (mirrors server catalog). */
export const VARIANT_LABELS = {
  'instant-reset': 'Instant Reset',
  'orienting-anchor': 'Orienting Anchor',
  'coherence-ripple': 'Coherence Ripple',
  'vagal-downshift': 'Vagal Downshift',
  'static-field': 'Static Field',
};

const CARE_PLAN_PREFIX = 'surge.crane.careplan.';

export function carePlanStorageKey(sessionId) {
  return sessionId ? `${CARE_PLAN_PREFIX}${sessionId}` : null;
}

export function saveCarePlan(sessionId, carePlan) {
  const key = carePlanStorageKey(sessionId);
  if (!key || !carePlan) return;
  try {
    localStorage.setItem(key, JSON.stringify({ ...carePlan, savedAt: Date.now() }));
  } catch {
    /* quota or private mode */
  }
}

export function loadCarePlan(sessionId) {
  const key = carePlanStorageKey(sessionId);
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
 * Apply inference side effects: session meta, care plan persistence, auto-launch scheduling.
 */
export function processCraneInferenceResult(inference, { sessionId, scheduleAutoLaunch, recordMeta }) {
  recordMeta?.(inference);

  if (inference?.carePlan && sessionId) {
    saveCarePlan(sessionId, inference.carePlan);
  }

  if (inference?.autoLaunch) {
    scheduleAutoLaunch?.(inference.autoLaunch);
  }

  return inference;
}

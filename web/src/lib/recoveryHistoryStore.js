/**
 * Local index of completed sequence sessions for cross-session recovery history.
 */

import { VARIANT_LABELS } from './craneCarePlanUtils';
import { loadCarePlan } from './craneCarePlanUtils';
import { isCustomVariantId } from '../sequences';

const INDEX_KEY = 'surge.recovery.history';
const MAX_ENTRIES = 40;

function readIndex() {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(entries) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    /* quota or private mode */
  }
}

function labelForVariant(variantId, customTitle) {
  if (customTitle) return customTitle;
  if (isCustomVariantId(variantId)) return 'Custom sequence';
  return VARIANT_LABELS[variantId] ?? variantId ?? 'Sequence';
}

/**
 * @param {{
 *   sessionId: string,
 *   variantId?: string | null,
 *   variantLabel?: string | null,
 *   durationSeconds: number,
 *   completionState?: 'complete' | 'interrupted',
 *   hadClinicalToken?: boolean,
 * }} entry
 */
export function recordRecoveryHistory(entry) {
  if (!entry?.sessionId) return;

  const completedAt = Date.now();
  const carePlan = loadCarePlan(entry.sessionId);

  const record = {
    sessionId: entry.sessionId,
    variantId: entry.variantId ?? null,
    variantLabel: labelForVariant(entry.variantId, entry.variantLabel),
    durationSeconds: Math.max(0, Math.round(entry.durationSeconds ?? 0)),
    completionState: entry.completionState ?? 'complete',
    completedAt,
    hadClinicalToken: Boolean(entry.hadClinicalToken),
    carePlanSteps: carePlan?.steps?.length ?? 0,
    carePlanCompleted: Array.isArray(carePlan?.completedSteps)
      ? carePlan.completedSteps.filter(Boolean).length
      : 0,
  };

  const next = [record, ...readIndex().filter((row) => row.sessionId !== entry.sessionId)];
  writeIndex(next);
  return record;
}

export function listRecoveryHistory(limit = 10) {
  return readIndex()
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
    .slice(0, limit);
}

export function clearRecoveryHistory() {
  try {
    localStorage.removeItem(INDEX_KEY);
  } catch {
    /* ignore */
  }
}

export function recoveryHistoryCount() {
  return readIndex().length;
}

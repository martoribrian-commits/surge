import { describe, expect, it, beforeEach } from 'vitest';
import {
  recordRecoveryHistory,
  listRecoveryHistory,
  clearRecoveryHistory,
  recoveryHistoryCount,
  refreshRecoveryHistoryForSession,
} from './recoveryHistoryStore';
import { saveCarePlan } from './craneCarePlanUtils';

describe('recoveryHistoryStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('records and lists sessions newest first', () => {
    recordRecoveryHistory({
      sessionId: 'aaa',
      variantId: 'flash-freeze',
      durationSeconds: 60,
      completionState: 'complete',
    });
    recordRecoveryHistory({
      sessionId: 'bbb',
      variantId: 'deep-anchor',
      durationSeconds: 90,
      completionState: 'complete',
    });

    const rows = listRecoveryHistory();
    expect(rows).toHaveLength(2);
    expect(rows[0].sessionId).toBe('bbb');
    expect(rows[0].variantLabel).toBe('Deep Anchor');
    expect(recoveryHistoryCount()).toBe(2);
  });

  it('dedupes by session id', () => {
    recordRecoveryHistory({ sessionId: 'same', variantId: 'nova-gate', durationSeconds: 30 });
    recordRecoveryHistory({ sessionId: 'same', variantId: 'nova-gate', durationSeconds: 45 });

    expect(listRecoveryHistory()).toHaveLength(1);
    expect(listRecoveryHistory()[0].durationSeconds).toBe(45);
  });

  it('labels custom sequences', () => {
    recordRecoveryHistory({
      sessionId: 'custom-1',
      variantId: 'custom-abc123',
      variantLabel: 'Evening wind-down',
      durationSeconds: 120,
    });

    expect(listRecoveryHistory()[0].variantLabel).toBe('Evening wind-down');
  });

  it('clears history', () => {
    recordRecoveryHistory({ sessionId: 'x', durationSeconds: 10 });
    clearRecoveryHistory();
    expect(recoveryHistoryCount()).toBe(0);
  });

  it('refreshes care plan counts on existing row', () => {
    recordRecoveryHistory({ sessionId: 'plan-session', variantId: 'nova-gate', durationSeconds: 60 });
    expect(listRecoveryHistory()[0].carePlanSteps).toBe(0);

    saveCarePlan('plan-session', {
      steps: [{ order: 1, text: 'A' }, { order: 2, text: 'B' }],
      completedSteps: [1],
    });
    refreshRecoveryHistoryForSession('plan-session');

    const row = listRecoveryHistory()[0];
    expect(row.carePlanSteps).toBe(2);
    expect(row.carePlanCompleted).toBe(1);
  });
});

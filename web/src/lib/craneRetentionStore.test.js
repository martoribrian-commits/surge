import { describe, expect, it } from 'vitest';
import { createCraneMessage } from './craneRetentionStore';

describe('createCraneMessage', () => {
  it('stores rich inference fields on crane messages', () => {
    const msg = createCraneMessage('crane', 'Hello', {
      actions: [{ type: 'navigate', path: '/engine/instant-reset', label: 'Go' }],
      bodyInsight: { type: 'somatic-read', autonomicRead: 'elevated' },
      carePlan: { steps: [{ order: 1, label: 'Ground' }] },
    });

    expect(msg.role).toBe('crane');
    expect(msg.actions).toHaveLength(1);
    expect(msg.bodyInsight.autonomicRead).toBe('elevated');
    expect(msg.carePlan.steps).toHaveLength(1);
  });

  it('omits empty extras', () => {
    const msg = createCraneMessage('user', 'Hi');
    expect(msg.actions).toBeUndefined();
    expect(msg.bodyInsight).toBeUndefined();
  });
});

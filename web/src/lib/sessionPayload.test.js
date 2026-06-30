import { describe, expect, it } from 'vitest';
import { buildSessionPayload } from './sessionPayload';

describe('buildSessionPayload', () => {
  it('includes variantId when provided', () => {
    const payload = buildSessionPayload(90, true, '00000000-0000-4000-8000-000000000001', 'static-field');
    expect(payload.variantId).toBe('static-field');
    expect(payload.durationInSeconds).toBe(90);
  });

  it('omits variantId when not provided', () => {
    const payload = buildSessionPayload(30, false);
    expect(payload.variantId).toBeUndefined();
  });
});

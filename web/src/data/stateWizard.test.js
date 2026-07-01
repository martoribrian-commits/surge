import { describe, expect, it } from 'vitest';
import { recommendVariant, variantMeta } from './stateWizard';

describe('stateWizard', () => {
  it('recommends instant reset for racing 30s', () => {
    expect(recommendVariant('surge', 30)).toBe('instant-reset');
  });

  it('recommends still thaw for shutdown 60s', () => {
    expect(recommendVariant('shutdown', 60)).toBe('still-thaw');
  });

  it('returns variant metadata', () => {
    const meta = variantMeta('deep-anchor');
    expect(meta?.name).toBe('Deep Anchor');
  });
});

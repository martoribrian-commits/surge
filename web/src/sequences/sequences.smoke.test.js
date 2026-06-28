/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { shellGradient, previewGradient, coherenceAuroraGradient } from '../components/sequence/shared/groundStyles';
import { SEQUENCE_VARIANTS } from '../sequences/config';

describe('sequence ground styles', () => {
  it('every variant produces a non-empty static background', () => {
    for (const variant of Object.values(SEQUENCE_VARIANTS)) {
      expect(shellGradient(variant.palette)).toMatch(/linear-gradient/);
      expect(previewGradient(variant.palette)).toMatch(/linear-gradient/);
      expect(coherenceAuroraGradient(variant.palette, 0)).toMatch(/radial-gradient/);
    }
  });
});

describe('sequence variant registry', () => {
  it('includes all five release sequences', () => {
    expect(Object.keys(SEQUENCE_VARIANTS).sort()).toEqual([
      'coherence-ripple',
      'instant-reset',
      'orienting-anchor',
      'static-field',
      'vagal-downshift',
    ]);
  });
});

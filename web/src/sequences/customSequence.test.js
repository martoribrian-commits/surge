/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import {
  buildCustomVariant,
  buildFallbackCustomSequence,
  isCustomVariantId,
  normalizeCustomSpec,
  persistCustomVariant,
  loadPersistedCustomVariant,
  clearPersistedCustomVariant,
  CUSTOM_SEQUENCE_TTL_MS,
} from './customSequence';
import { InteractionMode } from './config';

describe('customSequence', () => {
  it('identifies custom variant ids', () => {
    expect(isCustomVariantId('custom-abc123')).toBe(true);
    expect(isCustomVariantId('instant-reset')).toBe(false);
  });

  it('normalizes AI spec into a playable variant', () => {
    const variant = buildCustomVariant({
      name: 'Warm Return',
      feelsLike: 'Thaw moving through numbness',
      whatItDoes: 'Procedural warmth and low-frequency tone',
      durationSeconds: 60,
      interactionMode: 'auto',
      visualType: 'thaw',
      paletteMood: 'warm',
      audioProfile: { baseFreq: 88, noiseLevel: 0.3, tempo: 'slow', warmth: 'warm' },
      phases: [{ atSeconds: 0, label: 'Arrive' }],
    });

    expect(variant.isCustom).toBe(true);
    expect(variant.id.startsWith('custom-')).toBe(true);
    expect(variant.durationSeconds).toBe(60);
    expect(variant.interactionMode).toBe(InteractionMode.AUTO);
    expect(variant.audioProfile.baseFreq).toBe(88);
    expect(variant.phases.length).toBeGreaterThan(0);
  });

  it('builds offline fallback from grief keywords', () => {
    const variant = buildFallbackCustomSequence('I feel heavy grief and sadness');
    expect(variant.isCustom).toBe(true);
    expect(variant.interactionMode).toBe(InteractionMode.HOLD);
    expect(variant.durationSeconds).toBe(90);
    expect(variant.visualType).toBe('ripple');
  });

  it('clamps invalid audio values', () => {
    const spec = normalizeCustomSpec({
      name: 'Test',
      durationSeconds: 999,
      audioProfile: { baseFreq: 999, noiseLevel: 2 },
    });
    expect(spec.durationSeconds).toBe(60);
    expect(spec.audioProfile.baseFreq).toBe(220);
    expect(spec.audioProfile.noiseLevel).toBe(0.85);
  });

  it('persists custom variant in localStorage with TTL', () => {
    const variant = buildCustomVariant({
      name: 'Persist Test',
      durationSeconds: 30,
      interactionMode: 'auto',
      visualType: 'pulse',
      paletteMood: 'neutral',
    });
    persistCustomVariant(variant);
    const loaded = loadPersistedCustomVariant();
    expect(loaded?.name).toBe('Persist Test');
    expect(loaded?.durationSeconds).toBe(30);

    const raw = JSON.parse(localStorage.getItem('surge-custom-sequence-v1'));
    expect(raw.expiresAt).toBeGreaterThan(Date.now());
    expect(raw.expiresAt - raw.savedAt).toBe(CUSTOM_SEQUENCE_TTL_MS);

    clearPersistedCustomVariant();
    expect(loadPersistedCustomVariant()).toBeNull();
  });
});

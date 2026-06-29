import { describe, expect, it } from 'vitest';
import {
  buildCraneClientTools,
  executeCraneTool,
  buildAdvisorTool,
} from '../../../netlify/functions/lib/craneTools.js';
import { buildSystemPrompt, VALID_VARIANT_IDS } from '../../../netlify/functions/lib/cranePrompts.js';

describe('craneTools', () => {
  it('defines three client tools plus valid variant enums', () => {
    const tools = buildCraneClientTools();
    expect(tools).toHaveLength(3);
    expect(tools.map((t) => t.name)).toEqual([
      'recommend_sequence',
      'start_sequence_for_user',
      'suggest_regulation_plan',
    ]);
    for (const tool of tools) {
      const variantProp =
        tool.input_schema.properties.variantId ??
        tool.input_schema.properties.steps?.items?.properties?.variantId;
      if (variantProp?.enum) {
        expect(variantProp.enum).toEqual(VALID_VARIANT_IDS);
      }
    }
  });

  it('executeCraneTool recommend_sequence returns navigate action', () => {
    const { result, action } = executeCraneTool('recommend_sequence', {
      variantId: 'instant-reset',
      rationale: 'Racing heart maps to physiological sigh intercept.',
      bodyStateSummary: 'Heart pounding',
    });
    expect(result.ok).toBe(true);
    expect(result.variantId).toBe('instant-reset');
    expect(action).toMatchObject({
      type: 'navigate',
      path: '/engine/instant-reset',
      variantId: 'instant-reset',
      primary: true,
    });
  });

  it('executeCraneTool rejects invalid variantId', () => {
    const { result, action } = executeCraneTool('recommend_sequence', {
      variantId: 'not-real',
      rationale: 'test',
    });
    expect(result.ok).toBe(false);
    expect(action).toBeNull();
  });

  it('executeCraneTool suggest_regulation_plan returns multiple actions', () => {
    const { result, actions } = executeCraneTool('suggest_regulation_plan', {
      steps: [
        { order: 1, action: 'Downshift first', variantId: 'instant-reset' },
        { order: 2, action: 'Then orient', variantId: 'orienting-anchor' },
      ],
      clinicalNote: 'Acute spike then cognitive loop.',
    });
    expect(result.ok).toBe(true);
    expect(result.steps).toHaveLength(2);
    expect(actions).toHaveLength(2);
    expect(actions[0].path).toBe('/engine/instant-reset');
  });

  it('buildAdvisorTool uses advisor_20260301 type', () => {
    const advisor = buildAdvisorTool({ model: 'claude-opus-4-8' });
    expect(advisor).toMatchObject({
      type: 'advisor_20260301',
      name: 'advisor',
      model: 'claude-opus-4-8',
    });
    expect(advisor.max_tokens).toBe(2048);
  });
});

describe('cranePrompts', () => {
  it('buildSystemPrompt includes catalog and advisor guidance', () => {
    const prompt = buildSystemPrompt({
      mode: 'guide',
      sequenceCatalog: [
        {
          id: 'instant-reset',
          name: 'Instant Reset',
          durationSeconds: 30,
          modality: 'Physiological sigh intercept',
          feelsLike: 'Chest tight',
          whatItDoes: 'Sigh breath',
          whenToUse: 'Panic',
          interaction: 'Auto',
        },
      ],
    });
    expect(prompt).toContain('clinical somatic guide');
    expect(prompt).toContain('advisor');
    expect(prompt).toContain('instant-reset');
    expect(prompt).toContain('recommend_sequence');
  });

  it('buildSystemPrompt post-session includes telemetry context', () => {
    const prompt = buildSystemPrompt({
      mode: 'post-session',
      supabaseContext: {
        variantId: 'vagal-downshift',
        telemetry: { completed_full_cycle: true, duration_in_seconds: 90 },
      },
      sequenceCatalog: [],
    });
    expect(prompt).toContain('vagal-downshift');
    expect(prompt).toContain('completed a full regulation cycle');
  });
});

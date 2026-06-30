import { describe, expect, it } from 'vitest';
import {
  buildCraneClientTools,
  executeCraneTool,
  buildAdvisorTool,
} from '../../../netlify/functions/lib/craneTools.js';
import {
  buildSystemPrompt,
  VALID_VARIANT_IDS,
} from '../../../netlify/functions/lib/cranePrompts.js';
import {
  classifyUserIntent,
  resolveAdvisorPolicy,
  buildProactiveCarePlanPrompt,
} from '../../../netlify/functions/lib/craneAdvisorPolicy.js';

describe('craneTools', () => {
  it('defines base tools for guide mode', () => {
    const tools = buildCraneClientTools('guide');
    expect(tools).toHaveLength(3);
    expect(tools.map((t) => t.name)).toEqual([
      'recommend_sequence',
      'start_sequence_for_user',
      'suggest_regulation_plan',
    ]);
  });

  it('adds post-session care plan tool in post-session mode', () => {
    const tools = buildCraneClientTools('post-session');
    expect(tools).toHaveLength(4);
    expect(tools.some((t) => t.name === 'build_post_session_care_plan')).toBe(true);
  });

  it('executeCraneTool recommend_sequence does not auto-launch', () => {
    const { action } = executeCraneTool('recommend_sequence', {
      variantId: 'instant-reset',
      rationale: 'Racing heart',
    });
    expect(action.autoLaunch).toBe(false);
  });

  it('executeCraneTool start_sequence_for_user auto-launches', () => {
    const { result, action } = executeCraneTool('start_sequence_for_user', {
      variantId: 'instant-reset',
      urgency: 'immediate',
    });
    expect(result.autoLaunch).toBe(true);
    expect(action.autoLaunch).toBe(true);
    expect(action.countdownMs).toBe(2000);
    expect(action.urgency).toBe('immediate');
  });

  it('executeCraneTool build_post_session_care_plan returns carePlan', () => {
    const { result, carePlan } = executeCraneTool('build_post_session_care_plan', {
      completedVariantId: 'vagal-downshift',
      clinicalNote: 'Nervous system likely still integrating.',
      steps: [
        { order: 1, action: 'Sit quietly for two minutes', category: 'rest' },
        { order: 2, action: 'Sip water slowly', category: 'hydration' },
      ],
    });
    expect(result.ok).toBe(true);
    expect(result.planType).toBe('post-session');
    expect(carePlan.planType).toBe('post-session');
    expect(carePlan.steps).toHaveLength(2);
  });

  it('buildAdvisorTool respects maxUses and caching', () => {
    const advisor = buildAdvisorTool({ model: 'claude-opus-4-8', maxUses: 1, enableCaching: true });
    expect(advisor.max_uses).toBe(1);
    expect(advisor.caching).toEqual({ type: 'ephemeral', ttl: '5m' });
  });
});

describe('craneAdvisorPolicy', () => {
  it('skips advisor for lookup intents', () => {
    const policy = resolveAdvisorPolicy({
      mode: 'guide',
      userMessage: 'Explain bilateral stimulation',
      sessionMeta: { advisorCallsTotal: 0 },
    });
    expect(policy.includeAdvisor).toBe(false);
    expect(policy.intent).toBe('lookup');
  });

  it('limits urgent guide turns to one advisor call', () => {
    const policy = resolveAdvisorPolicy({
      mode: 'guide',
      userMessage: 'My heart is racing help now',
      sessionMeta: { advisorCallsTotal: 0 },
    });
    expect(policy.includeAdvisor).toBe(true);
    expect(policy.maxUsesThisRequest).toBe(1);
    expect(policy.intent).toBe('urgent');
  });

  it('exhausts conversation budget', () => {
    const policy = resolveAdvisorPolicy({
      mode: 'guide',
      userMessage: 'pick a sequence',
      sessionMeta: { advisorCallsTotal: 5 },
    });
    expect(policy.includeAdvisor).toBe(false);
    expect(policy.reason).toBe('conversation_budget_exhausted');
  });

  it('classifies short acknowledgments', () => {
    expect(classifyUserIntent('thanks', 'post-session')).toBe('ack');
  });

  it('buildProactiveCarePlanPrompt references completed variant', () => {
    const prompt = buildProactiveCarePlanPrompt({
      variantId: 'static-field',
      telemetry: { completed_full_cycle: true, duration_in_seconds: 90 },
    });
    expect(prompt).toContain('static-field');
    expect(prompt).toContain('build_post_session_care_plan');
  });
});

describe('cranePrompts', () => {
  it('buildSystemPrompt includes mode-specific advisor guidance', () => {
    const guide = buildSystemPrompt({ mode: 'guide', sequenceCatalog: [] });
    const post = buildSystemPrompt({ mode: 'post-session', sequenceCatalog: [] });
    expect(guide).toContain('Skip advisor for simple factual lookups');
    expect(post).toContain('build_post_session_care_plan');
  });
});

describe('variant ids', () => {
  it('matches five sequences', () => {
    expect(VALID_VARIANT_IDS).toHaveLength(5);
  });
});

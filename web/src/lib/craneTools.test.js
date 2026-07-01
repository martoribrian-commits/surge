import { describe, expect, it } from 'vitest';
import {
  buildCraneClientTools,
  executeCraneTool,
  buildAdvisorTool,
  URGENCY_COUNTDOWN_MS,
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
import {
  toggleCarePlanStep,
  isCarePlanComplete,
  nextIncompleteStep,
  saveCarePlan,
  loadCarePlan,
  clearCarePlan,
} from './craneCarePlanUtils.js';

describe('craneTools', () => {
  it('defines guide tools including interpret_body_state', () => {
    const tools = buildCraneClientTools('guide');
    expect(tools.some((t) => t.name === 'interpret_body_state')).toBe(true);
    expect(tools.some((t) => t.name === 'generate_custom_sequence')).toBe(true);
    expect(tools.length).toBeGreaterThanOrEqual(5);
  });

  it('creator mode exposes only generate_custom_sequence', () => {
    const tools = buildCraneClientTools('creator');
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('generate_custom_sequence');
  });

  it('generate_custom_sequence returns custom action', () => {
    const { result, action } = executeCraneTool('generate_custom_sequence', {
      reportedState: 'numb and shut down',
      rationale: 'Shutdown needs gentle auto thaw',
      name: 'Warm Return',
      feelsLike: 'Slow warmth',
      whatItDoes: 'Procedural thaw field',
      durationSeconds: 60,
      interactionMode: 'auto',
      visualType: 'thaw',
      audioProfile: { baseFreq: 88, noiseLevel: 0.3, tempo: 'slow', warmth: 'warm' },
    });
    expect(result.ok).toBe(true);
    expect(action.type).toBe('custom_sequence');
    expect(action.customSpec.name).toBe('Warm Return');
  });

  it('post-session adds care plan and body debrief tools', () => {
    const tools = buildCraneClientTools('post-session');
    expect(tools.some((t) => t.name === 'build_post_session_care_plan')).toBe(true);
    expect(tools.some((t) => t.name === 'deliver_body_debrief')).toBe(true);
  });

  it('tuned countdown durations', () => {
    expect(URGENCY_COUNTDOWN_MS.immediate).toBe(3000);
    expect(URGENCY_COUNTDOWN_MS.confirmed).toBe(4500);
    expect(URGENCY_COUNTDOWN_MS.standard).toBe(4000);
  });

  it('start_sequence_for_user uses tuned immediate countdown', () => {
    const { action } = executeCraneTool('start_sequence_for_user', {
      variantId: 'instant-reset',
      urgency: 'immediate',
    });
    expect(action.countdownMs).toBe(3000);
  });

  it('interpret_body_state returns bodyInsight', () => {
    const { bodyInsight } = executeCraneTool('interpret_body_state', {
      reportedState: 'Heart pounding',
      autonomicRead: 'Sympathetic activation — alarm tone is up.',
      primaryProtocol: 'instant-reset',
      matchConfidence: 'high',
      whyThisProtocol: 'Physiological sigh intercepts acute arousal fast.',
    });
    expect(bodyInsight.type).toBe('somatic-read');
    expect(bodyInsight.primaryProtocolName).toBe('Instant Reset');
  });

  it('deliver_body_debrief returns post-session insight', () => {
    const { bodyInsight } = executeCraneTool('deliver_body_debrief', {
      completedVariantId: 'vagal-downshift',
      debriefSummary: 'Your alarm tone likely dropped as the fog descended.',
      autonomicShift: 'High arousal toward calmer baseline',
      expectedSensations: ['Heaviness in limbs', 'Slower thoughts'],
    });
    expect(bodyInsight.type).toBe('post-session-debrief');
    expect(bodyInsight.completedVariantName).toBe('Vagal Downshift');
  });

  it('care plan includes completedSteps array', () => {
    const { carePlan } = executeCraneTool('build_post_session_care_plan', {
      clinicalNote: 'Integrating.',
      steps: [{ order: 1, action: 'Rest', category: 'rest' }],
    });
    expect(carePlan.completedSteps).toEqual([]);
  });
});

describe('craneCarePlanUtils', () => {
  it('toggleCarePlanStep persists completion', () => {
    const sessionId = 'test-session-' + Date.now();
    const plan = {
      planType: 'post-session',
      steps: [
        { order: 1, action: 'Rest' },
        { order: 2, action: 'Water' },
      ],
      completedSteps: [],
    };
    saveCarePlan(sessionId, plan);
    const toggled = toggleCarePlanStep(sessionId, 1);
    expect(toggled.completedSteps).toContain(1);
    expect(isCarePlanComplete(toggled)).toBe(false);
    expect(nextIncompleteStep(toggled)?.order).toBe(2);
    toggleCarePlanStep(sessionId, 2);
    const done = loadCarePlan(sessionId);
    expect(isCarePlanComplete(done)).toBe(true);
    clearCarePlan(sessionId);
  });
});

describe('craneAdvisorPolicy', () => {
  it('proactive prompt requests debrief and care plan', () => {
    const prompt = buildProactiveCarePlanPrompt({
      variantId: 'coherence-ripple',
      telemetry: { completed_full_cycle: true },
    });
    expect(prompt).toContain('deliver_body_debrief');
    expect(prompt).toContain('build_post_session_care_plan');
  });
});

describe('cranePrompts', () => {
  it('includes vector history in system prompt', () => {
    const prompt = buildSystemPrompt({
      mode: 'post-session',
      supabaseContext: {
        vectorHistory: [{ summary: 'Prior session: racing heart, used Instant Reset.' }],
      },
      sequenceCatalog: [],
    });
    expect(prompt).toContain('Prior session summaries');
    expect(prompt).toContain('Instant Reset');
  });
});

describe('variant ids', () => {
  it('matches ten sequences', () => {
    expect(VALID_VARIANT_IDS).toHaveLength(10);
  });
});

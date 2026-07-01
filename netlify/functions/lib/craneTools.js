import { VALID_VARIANT_IDS } from './cranePrompts.js';

const VARIANT_LABELS = {
  'instant-reset': 'Instant Reset',
  'flash-freeze': 'Flash Freeze',
  'orienting-anchor': 'Orienting Anchor',
  'nova-gate': 'Nova Gate',
  'still-thaw': 'Still Thaw',
  'coherence-ripple': 'Coherence Ripple',
  'heavy-tide': 'Heavy Tide',
  'vagal-downshift': 'Vagal Downshift',
  'static-field': 'Static Field',
  'deep-anchor': 'Deep Anchor',
};

const VARIANT_PREP = {
  'instant-reset': 'Find a quiet spot. The sequence runs on its own for 30 seconds.',
  'flash-freeze': 'Press and hold to freeze the ember field. Release to pause.',
  'orienting-anchor': 'Tap left, then right, in rhythm. Follow the visuals for 60 seconds.',
  'nova-gate': 'Sit back and watch. The gate opens automatically for 60 seconds.',
  'still-thaw': 'Sit back and let thaw happen. The sequence runs on its own for 60 seconds.',
  'coherence-ripple': 'Press and hold anywhere below the header. Release to pause.',
  'heavy-tide': 'Press and hold. Follow the slow tide of breath.',
  'vagal-downshift': 'Press and hold. Watch the fog descend — headphones help.',
  'static-field': 'Use headphones. Press and hold. The static field is intentionally intense.',
  'deep-anchor': 'Tap left, then right, slowly. Two minutes of bilateral grounding.',
};

/** Tuned for cancelability — acute still fast, standard gives time to read prep note. */
const URGENCY_COUNTDOWN_MS = {
  immediate: 3000,
  confirmed: 4500,
  standard: 4000,
};

const variantEnum = [...VALID_VARIANT_IDS];

const STEP_SCHEMA = {
  type: 'object',
  properties: {
    order: { type: 'number' },
    action: { type: 'string', description: 'Plain-language step for the user' },
    variantId: {
      type: 'string',
      enum: variantEnum,
      description: 'Optional Surge sequence for this step',
    },
    category: {
      type: 'string',
      enum: ['rest', 'grounding', 'sequence', 'hydration', 'environment'],
      description: 'Step type for care plan display',
    },
  },
  required: ['order', 'action'],
};

const PHASE_SCHEMA = {
  type: 'object',
  properties: {
    atSeconds: { type: 'number' },
    label: { type: 'string' },
    hint: { type: 'string' },
  },
  required: ['atSeconds', 'label'],
};

const GENERATE_CUSTOM_SEQUENCE_TOOL = {
  name: 'generate_custom_sequence',
  description:
    'Generate a personalized procedural Surge sequence when no preset fits the user. Creates custom duration, interaction mode, visuals, procedural audio profile, and phase labels attuned to their reported body state. Use when they say nothing fits, presets feel wrong, or matchConfidence is low after interpret_body_state.',
  input_schema: {
    type: 'object',
    properties: {
      reportedState: { type: 'string', description: 'What they said they feel' },
      rationale: { type: 'string', description: 'Why this custom design fits their state' },
      name: { type: 'string', description: 'Short evocative name, e.g. Warm Return' },
      tagline: { type: 'string' },
      feelsLike: { type: 'string' },
      whatItDoes: { type: 'string' },
      whenToUse: { type: 'string' },
      durationSeconds: { type: 'number', enum: [30, 60, 90, 120] },
      interactionMode: { type: 'string', enum: ['auto', 'hold', 'bilateral'] },
      visualType: {
        type: 'string',
        enum: ['pulse', 'ripple', 'fog', 'ember', 'gate', 'field', 'thaw'],
      },
      paletteMood: { type: 'string', enum: ['warm', 'cool', 'neutral', 'clay', 'void'] },
      breathCycle: {
        type: 'object',
        properties: {
          inhale: { type: 'number' },
          exhale: { type: 'number' },
        },
      },
      bilateralBpm: { type: 'number' },
      transitionAtSeconds: { type: 'number' },
      audioProfile: {
        type: 'object',
        properties: {
          baseFreq: { type: 'number', description: '40-220 Hz root tone' },
          toneType: { type: 'string', enum: ['sine', 'triangle'] },
          noiseLevel: { type: 'number', description: '0.05-0.85 pink noise bed' },
          tempo: { type: 'string', enum: ['slow', 'medium', 'fast'] },
          warmth: { type: 'string', enum: ['cool', 'neutral', 'warm'] },
        },
      },
      phases: { type: 'array', maxItems: 5, items: PHASE_SCHEMA },
    },
    required: [
      'reportedState',
      'rationale',
      'name',
      'feelsLike',
      'whatItDoes',
      'durationSeconds',
      'interactionMode',
      'visualType',
      'audioProfile',
    ],
  },
};

const BASE_TOOLS = [
  {
    name: 'recommend_sequence',
    description:
      'Recommend a Surge sequence and surface a Start button. Never auto-launches. Use when they may want to choose first.',
    input_schema: {
      type: 'object',
      properties: {
        variantId: { type: 'string', enum: variantEnum },
        rationale: { type: 'string' },
        bodyStateSummary: { type: 'string' },
      },
      required: ['variantId', 'rationale'],
    },
  },
  {
    name: 'start_sequence_for_user',
    description:
      'Launch a sequence for the user with auto-start after a brief countdown. Use for acute need or after they confirm.',
    input_schema: {
      type: 'object',
      properties: {
        variantId: { type: 'string', enum: variantEnum },
        prepNote: { type: 'string' },
        urgency: {
          type: 'string',
          enum: ['immediate', 'confirmed', 'standard'],
          description: 'immediate = panic/acute (3s countdown), confirmed = they said yes (4.5s), standard = 4s',
        },
      },
      required: ['variantId'],
    },
  },
  {
    name: 'interpret_body_state',
    description:
      'Clinical somatic read of what the user reported feeling. Call BEFORE recommending a sequence when they describe body state. Surfaces structured insight to the user.',
    input_schema: {
      type: 'object',
      properties: {
        reportedState: { type: 'string', description: 'What they said they feel' },
        autonomicRead: {
          type: 'string',
          description: 'Plain-language autonomic nervous system read (no jargon without translation)',
        },
        primaryProtocol: { type: 'string', enum: variantEnum },
        matchConfidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        alternativeProtocol: { type: 'string', enum: variantEnum },
        whyThisProtocol: { type: 'string', description: 'One sentence why primary protocol fits' },
      },
      required: ['reportedState', 'autonomicRead', 'primaryProtocol', 'matchConfidence', 'whyThisProtocol'],
    },
  },
  {
    name: 'suggest_regulation_plan',
    description: 'Acute multi-step somatic plan (max 3 steps). Not for post-session recovery — use build_post_session_care_plan instead.',
    input_schema: {
      type: 'object',
      properties: {
        steps: { type: 'array', maxItems: 3, items: STEP_SCHEMA },
        clinicalNote: { type: 'string' },
      },
      required: ['steps'],
    },
  },
];

const POST_SESSION_CARE_PLAN_TOOL = {
  name: 'build_post_session_care_plan',
  description:
    'Build a 2-3 step post-session recovery care plan after sequence completion. Mix rest, grounding, environment, and optional follow-up sequences. Not a diagnosis.',
  input_schema: {
    type: 'object',
    properties: {
      steps: {
        type: 'array',
        maxItems: 3,
        items: STEP_SCHEMA,
      },
      clinicalNote: {
        type: 'string',
        description: 'Brief somatic framing of what their nervous system likely needs now',
      },
      completedVariantId: {
        type: 'string',
        enum: variantEnum,
        description: 'The sequence they just finished',
      },
      launchFirstSequenceStep: {
        type: 'boolean',
        description: 'If a step includes a sequence, auto-launch the first one',
      },
    },
    required: ['steps', 'clinicalNote'],
  },
};

const DELIVER_BODY_DEBRIEF_TOOL = {
  name: 'deliver_body_debrief',
  description:
    'Personalized plain-language explanation of what the completed sequence likely did in their nervous system. POST-SESSION ONLY. Call alongside build_post_session_care_plan.',
  input_schema: {
    type: 'object',
    properties: {
      completedVariantId: { type: 'string', enum: variantEnum },
      debriefSummary: {
        type: 'string',
        description: '2-3 sentences for the user — what likely shifted in their body',
      },
      autonomicShift: {
        type: 'string',
        description: 'Plain-language shift (e.g. alarm tone down, breath slower)',
      },
      expectedSensations: {
        type: 'array',
        items: { type: 'string' },
        maxItems: 4,
        description: 'What they may still feel — normal post-protocol sensations',
      },
      watchFor: {
        type: 'string',
        description: 'One sentence on what to monitor or do if arousal returns',
      },
    },
    required: ['completedVariantId', 'debriefSummary', 'autonomicShift'],
  },
};

export function buildCraneClientTools(mode = 'guide') {
  if (mode === 'creator') {
    return [GENERATE_CUSTOM_SEQUENCE_TOOL];
  }
  if (mode === 'post-session') {
    return [...BASE_TOOLS, POST_SESSION_CARE_PLAN_TOOL, DELIVER_BODY_DEBRIEF_TOOL, GENERATE_CUSTOM_SEQUENCE_TOOL];
  }
  return [...BASE_TOOLS, GENERATE_CUSTOM_SEQUENCE_TOOL];
}

function normalizeVariantId(variantId) {
  const id = String(variantId ?? '').trim();
  return VALID_VARIANT_IDS.includes(id) ? id : null;
}

function buildNavigateAction(
  variantId,
  { label, rationale, prepNote, primary = false, autoLaunch = false, urgency = 'standard' } = {},
) {
  const name = VARIANT_LABELS[variantId] ?? variantId;
  return {
    type: 'navigate',
    path: `/engine/${variantId}`,
    label: label ?? `Start ${name}`,
    variantId,
    rationale: rationale ?? null,
    prepNote: prepNote ?? VARIANT_PREP[variantId] ?? null,
    primary: Boolean(primary),
    autoLaunch: Boolean(autoLaunch),
    countdownMs: autoLaunch ? (URGENCY_COUNTDOWN_MS[urgency] ?? URGENCY_COUNTDOWN_MS.standard) : null,
    urgency,
  };
}

function normalizeCarePlanSteps(steps) {
  return (Array.isArray(steps) ? steps.slice(0, 3) : [])
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((step, index) => ({
      order: step.order ?? index + 1,
      action: String(step.action ?? '').trim(),
      variantId: normalizeVariantId(step.variantId),
      category: step.category ?? (step.variantId ? 'sequence' : 'grounding'),
    }));
}

function buildCarePlanFromSteps(steps, { clinicalNote, completedVariantId, planType = 'regulation' }) {
  const normalizedSteps = normalizeCarePlanSteps(steps);
  const actions = [];
  let firstSequenceIndex = -1;

  normalizedSteps.forEach((step, index) => {
    if (step.variantId) {
      if (firstSequenceIndex === -1) firstSequenceIndex = index;
      actions.push(
        buildNavigateAction(step.variantId, {
          label: `Step ${step.order}: ${VARIANT_LABELS[step.variantId]}`,
          primary: index === firstSequenceIndex,
        }),
      );
    }
  });

  const carePlan = {
    planType,
    completedVariantId: normalizeVariantId(completedVariantId),
    steps: normalizedSteps,
    clinicalNote: String(clinicalNote ?? '').trim() || null,
    completedSteps: [],
    generatedAt: Date.now(),
  };

  return { carePlan, actions, normalizedSteps };
}

function normalizeServerCustomSpec(args) {
  const input = args && typeof args === 'object' ? args : {};
  const durations = [30, 60, 90, 120];
  const modes = ['auto', 'hold', 'bilateral'];
  const visuals = ['pulse', 'ripple', 'fog', 'ember', 'gate', 'field', 'thaw'];
  const moods = ['warm', 'cool', 'neutral', 'clay', 'void'];

  const durationSeconds = durations.includes(input.durationSeconds) ? input.durationSeconds : 60;
  const interactionMode = modes.includes(input.interactionMode) ? input.interactionMode : 'auto';
  const visualType = visuals.includes(input.visualType) ? input.visualType : 'pulse';
  const paletteMood = moods.includes(input.paletteMood) ? input.paletteMood : 'neutral';

  const audio = input.audioProfile && typeof input.audioProfile === 'object' ? input.audioProfile : {};

  return {
    reportedState: String(input.reportedState ?? '').trim(),
    rationale: String(input.rationale ?? '').trim(),
    name: String(input.name ?? 'Your Sequence').slice(0, 48),
    tagline: String(input.tagline ?? 'Attuned to you right now').slice(0, 120),
    feelsLike: String(input.feelsLike ?? '').slice(0, 280),
    whatItDoes: String(
      input.whatItDoes ?? 'Procedural sound and motion tuned to your nervous system.',
    ).slice(0, 280),
    whenToUse: String(input.whenToUse ?? 'When preset sequences do not match.').slice(0, 280),
    durationSeconds,
    interactionMode,
    visualType,
    paletteMood,
    breathCycle:
      input.breathCycle &&
      typeof input.breathCycle.inhale === 'number' &&
      typeof input.breathCycle.exhale === 'number'
        ? { inhale: input.breathCycle.inhale, exhale: input.breathCycle.exhale }
        : interactionMode === 'hold'
          ? { inhale: 4, exhale: 6 }
          : undefined,
    bilateralBpm: typeof input.bilateralBpm === 'number' ? input.bilateralBpm : 54,
    transitionAtSeconds:
      typeof input.transitionAtSeconds === 'number'
        ? input.transitionAtSeconds
        : Math.round(durationSeconds * 0.35),
    audioProfile: {
      baseFreq: Math.min(220, Math.max(40, Number(audio.baseFreq ?? 110))),
      toneType: audio.toneType === 'triangle' ? 'triangle' : 'sine',
      noiseLevel: Math.min(0.85, Math.max(0.05, Number(audio.noiseLevel ?? 0.35))),
      tempo: ['slow', 'medium', 'fast'].includes(audio.tempo) ? audio.tempo : 'medium',
      warmth: ['cool', 'neutral', 'warm'].includes(audio.warmth) ? audio.warmth : 'neutral',
    },
    phases: Array.isArray(input.phases)
      ? input.phases.slice(0, 5).map((phase, index) => ({
          atSeconds: Number(phase.atSeconds ?? index * 15),
          label: String(phase.label ?? `Phase ${index + 1}`).slice(0, 40),
          hint: phase.hint ? String(phase.hint).slice(0, 60) : undefined,
        }))
      : [],
  };
}

/**
 * Execute a Crane client tool server-side.
 */
export function executeCraneTool(name, input) {
  const args = input && typeof input === 'object' ? input : {};

  switch (name) {
    case 'recommend_sequence': {
      const variantId = normalizeVariantId(args.variantId);
      if (!variantId) {
        return { result: { ok: false, error: 'Invalid variantId' }, action: null };
      }
      const rationale = String(args.rationale ?? '').trim();
      const action = buildNavigateAction(variantId, {
        rationale,
        prepNote: VARIANT_PREP[variantId],
        primary: true,
        autoLaunch: false,
      });
      return {
        result: {
          ok: true,
          variantId,
          name: VARIANT_LABELS[variantId],
          rationale,
          actionPrepared: true,
        },
        action,
      };
    }

    case 'start_sequence_for_user': {
      const variantId = normalizeVariantId(args.variantId);
      if (!variantId) {
        return { result: { ok: false, error: 'Invalid variantId' }, action: null };
      }
      const urgency = ['immediate', 'confirmed', 'standard'].includes(args.urgency)
        ? args.urgency
        : 'standard';
      const prepNote = String(args.prepNote ?? VARIANT_PREP[variantId] ?? '').trim();
      const action = buildNavigateAction(variantId, {
        label: `Begin ${VARIANT_LABELS[variantId]}`,
        prepNote,
        primary: true,
        autoLaunch: true,
        urgency,
      });
      return {
        result: { ok: true, variantId, launching: true, autoLaunch: true, urgency, prepNote },
        action,
      };
    }

    case 'interpret_body_state': {
      const primaryProtocol = normalizeVariantId(args.primaryProtocol);
      const alternativeProtocol = normalizeVariantId(args.alternativeProtocol);
      const bodyInsight = {
        type: 'somatic-read',
        reportedState: String(args.reportedState ?? '').trim(),
        autonomicRead: String(args.autonomicRead ?? '').trim(),
        primaryProtocol,
        primaryProtocolName: primaryProtocol ? VARIANT_LABELS[primaryProtocol] : null,
        matchConfidence: ['high', 'medium', 'low'].includes(args.matchConfidence)
          ? args.matchConfidence
          : 'medium',
        alternativeProtocol,
        whyThisProtocol: String(args.whyThisProtocol ?? '').trim(),
      };
      return { result: { ok: true, bodyInsight }, bodyInsight };
    }

    case 'suggest_regulation_plan': {
      const clinicalNote = String(args.clinicalNote ?? '').trim();
      const { carePlan, actions, normalizedSteps } = buildCarePlanFromSteps(args.steps, {
        clinicalNote,
        planType: 'acute',
      });
      return {
        result: { ok: true, steps: normalizedSteps, clinicalNote: clinicalNote || null },
        actions,
        carePlan,
      };
    }

    case 'deliver_body_debrief': {
      const completedVariantId = normalizeVariantId(args.completedVariantId);
      const expectedSensations = Array.isArray(args.expectedSensations)
        ? args.expectedSensations.slice(0, 4).map((s) => String(s).trim())
        : [];
      const bodyInsight = {
        type: 'post-session-debrief',
        completedVariantId,
        completedVariantName: completedVariantId ? VARIANT_LABELS[completedVariantId] : null,
        debriefSummary: String(args.debriefSummary ?? '').trim(),
        autonomicShift: String(args.autonomicShift ?? '').trim(),
        expectedSensations,
        watchFor: String(args.watchFor ?? '').trim() || null,
      };
      return { result: { ok: true, bodyInsight }, bodyInsight };
    }

    case 'build_post_session_care_plan': {
      const clinicalNote = String(args.clinicalNote ?? '').trim();
      const completedVariantId = normalizeVariantId(args.completedVariantId);
      const launchFirst = Boolean(args.launchFirstSequenceStep);
      const { carePlan, actions, normalizedSteps } = buildCarePlanFromSteps(args.steps, {
        clinicalNote,
        completedVariantId,
        planType: 'post-session',
      });

      if (launchFirst && actions.length > 0) {
        actions[0] = {
          ...actions[0],
          autoLaunch: true,
          urgency: 'standard',
          countdownMs: URGENCY_COUNTDOWN_MS.standard,
          primary: true,
        };
      }

      return {
        result: {
          ok: true,
          planType: 'post-session',
          steps: normalizedSteps,
          clinicalNote: clinicalNote || null,
          completedVariantId,
        },
        actions,
        carePlan,
      };
    }

    case 'generate_custom_sequence': {
      const customSpec = normalizeServerCustomSpec(args);
      const action = {
        type: 'custom_sequence',
        label: `Begin ${customSpec.name}`,
        customSpec,
        primary: true,
        prepNote: 'Headphones help. Procedural audio runs for the full sequence.',
      };
      return {
        result: {
          ok: true,
          customSpec,
          name: customSpec.name,
          durationSeconds: customSpec.durationSeconds,
          interactionMode: customSpec.interactionMode,
          actionPrepared: true,
        },
        action,
        customSequence: customSpec,
      };
    }

    default:
      return { result: { ok: false, error: `Unknown tool: ${name}` }, action: null };
  }
}

export function buildAdvisorTool({
  model = 'claude-opus-4-8',
  maxUses = 2,
  maxTokens = 2048,
  enableCaching = false,
} = {}) {
  const tool = {
    type: 'advisor_20260301',
    name: 'advisor',
    model,
    max_uses: maxUses,
    max_tokens: maxTokens,
  };
  if (enableCaching) {
    tool.caching = { type: 'ephemeral', ttl: '5m' };
  }
  return tool;
}

export { VARIANT_LABELS, VARIANT_PREP, URGENCY_COUNTDOWN_MS };

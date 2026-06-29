import { VALID_VARIANT_IDS } from './cranePrompts.js';

const VARIANT_LABELS = {
  'instant-reset': 'Instant Reset',
  'orienting-anchor': 'Orienting Anchor',
  'coherence-ripple': 'Coherence Ripple',
  'vagal-downshift': 'Vagal Downshift',
  'static-field': 'Static Field',
};

const VARIANT_PREP = {
  'instant-reset': 'Find a quiet spot. The sequence runs on its own for 30 seconds.',
  'orienting-anchor': 'Tap left, then right, in rhythm. Follow the visuals for 60 seconds.',
  'coherence-ripple': 'Press and hold anywhere below the header. Release to pause.',
  'vagal-downshift': 'Press and hold. Watch the fog descend — no headphones required.',
  'static-field': 'Use headphones. Press and hold. The static field is intentionally intense.',
};

export function buildCraneClientTools() {
  const variantEnum = [...VALID_VARIANT_IDS];

  return [
    {
      name: 'recommend_sequence',
      description:
        'Recommend a Surge sequence for the user and surface a Start button. Call when you have enough body-state signal to pick one protocol.',
      input_schema: {
        type: 'object',
        properties: {
          variantId: {
            type: 'string',
            enum: variantEnum,
            description: 'Sequence variant ID from the catalog',
          },
          rationale: {
            type: 'string',
            description: 'Plain-language why this sequence fits their body state (1-2 sentences)',
          },
          bodyStateSummary: {
            type: 'string',
            description: 'Brief recap of what they reported feeling',
          },
        },
        required: ['variantId', 'rationale'],
      },
    },
    {
      name: 'start_sequence_for_user',
      description:
        'Launch a sequence for the user immediately. Use when urgency is clear or they confirmed they want to start.',
      input_schema: {
        type: 'object',
        properties: {
          variantId: {
            type: 'string',
            enum: variantEnum,
          },
          prepNote: {
            type: 'string',
            description: 'One sentence prep (headphones, hold vs tap, etc.)',
          },
        },
        required: ['variantId'],
      },
    },
    {
      name: 'suggest_regulation_plan',
      description:
        'Suggest a short multi-step somatic regulation plan (not a diagnosis). Max 3 steps. Use when they need a sequence of actions, not just one protocol.',
      input_schema: {
        type: 'object',
        properties: {
          steps: {
            type: 'array',
            maxItems: 3,
            items: {
              type: 'object',
              properties: {
                order: { type: 'number' },
                action: { type: 'string', description: 'Plain-language step for the user' },
                variantId: {
                  type: 'string',
                  enum: variantEnum,
                  description: 'Optional sequence for this step',
                },
              },
              required: ['order', 'action'],
            },
          },
          clinicalNote: {
            type: 'string',
            description: 'Brief somatic framing without diagnosing',
          },
        },
        required: ['steps'],
      },
    },
  ];
}

function normalizeVariantId(variantId) {
  const id = String(variantId ?? '').trim();
  return VALID_VARIANT_IDS.includes(id) ? id : null;
}

function buildNavigateAction(variantId, { label, rationale, prepNote, primary = false } = {}) {
  const name = VARIANT_LABELS[variantId] ?? variantId;
  return {
    type: 'navigate',
    path: `/engine/${variantId}`,
    label: label ?? `Start ${name}`,
    variantId,
    rationale: rationale ?? null,
    prepNote: prepNote ?? VARIANT_PREP[variantId] ?? null,
    primary: Boolean(primary),
  };
}

/**
 * Execute a Crane client tool server-side. Returns tool result for the model and optional UI action.
 */
export function executeCraneTool(name, input) {
  const args = input && typeof input === 'object' ? input : {};

  switch (name) {
    case 'recommend_sequence': {
      const variantId = normalizeVariantId(args.variantId);
      if (!variantId) {
        return {
          result: { ok: false, error: 'Invalid variantId' },
          action: null,
        };
      }
      const rationale = String(args.rationale ?? '').trim();
      const bodyStateSummary = String(args.bodyStateSummary ?? '').trim();
      const action = buildNavigateAction(variantId, {
        rationale,
        prepNote: VARIANT_PREP[variantId],
        primary: true,
      });
      return {
        result: {
          ok: true,
          variantId,
          name: VARIANT_LABELS[variantId],
          rationale,
          bodyStateSummary: bodyStateSummary || null,
          actionPrepared: true,
        },
        action,
      };
    }

    case 'start_sequence_for_user': {
      const variantId = normalizeVariantId(args.variantId);
      if (!variantId) {
        return {
          result: { ok: false, error: 'Invalid variantId' },
          action: null,
        };
      }
      const prepNote = String(args.prepNote ?? VARIANT_PREP[variantId] ?? '').trim();
      const action = buildNavigateAction(variantId, {
        label: `Begin ${VARIANT_LABELS[variantId]}`,
        prepNote,
        primary: true,
      });
      return {
        result: {
          ok: true,
          variantId,
          launching: true,
          prepNote,
        },
        action,
      };
    }

    case 'suggest_regulation_plan': {
      const steps = Array.isArray(args.steps) ? args.steps.slice(0, 3) : [];
      const clinicalNote = String(args.clinicalNote ?? '').trim();
      const actions = [];
      const normalizedSteps = steps
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((step, index) => {
          const variantId = normalizeVariantId(step.variantId);
          const entry = {
            order: step.order ?? index + 1,
            action: String(step.action ?? '').trim(),
            variantId,
          };
          if (variantId) {
            actions.push(
              buildNavigateAction(variantId, {
                label: `Step ${entry.order}: ${VARIANT_LABELS[variantId]}`,
                primary: index === 0,
              }),
            );
          }
          return entry;
        });

      return {
        result: {
          ok: true,
          steps: normalizedSteps,
          clinicalNote: clinicalNote || null,
        },
        actions,
      };
    }

    default:
      return {
        result: { ok: false, error: `Unknown tool: ${name}` },
        action: null,
      };
  }
}

export function buildAdvisorTool({ model = 'claude-opus-4-8', maxUses = 3, maxTokens = 2048 } = {}) {
  return {
    type: 'advisor_20260301',
    name: 'advisor',
    model,
    max_uses: maxUses,
    max_tokens: maxTokens,
  };
}

export { VARIANT_LABELS, VARIANT_PREP };

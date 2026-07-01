/**
 * Advisor call frequency policy — mode budgets, intent classification, conversation caps.
 */

export const ADVISOR_BUDGETS = {
  guide: {
    perRequestMax: 2,
    conversationMax: 5,
  },
  'post-session': {
    perRequestMax: 1,
    conversationMax: 3,
  },
};

const LOOKUP_PATTERN =
  /^(what is|what's|whats|explain|how does|how do|tell me about|define|describe|meaning of|difference between)/i;

const URGENT_PATTERN =
  /panic|racing heart|can't breathe|cant breathe|help now|start now|launch|do it now|right now|need this now/i;

const PLANNING_PATTERN =
  /care plan|next step|what should i do|what now|plan for|after this|recovery plan|what do i do/i;

const SHORT_ACK_PATTERN = /^(ok|okay|thanks|thank you|yes|no|yeah|yep|nope|sure|got it|k)\.?$/i;

/**
 * @typedef {'lookup' | 'urgent' | 'planning' | 'post-session' | 'ack' | 'standard'} CraneIntent
 */

/**
 * @param {string} userMessage
 * @param {'guide' | 'post-session'} mode
 * @returns {CraneIntent}
 */
export function classifyUserIntent(userMessage, mode) {
  const q = String(userMessage ?? '').trim();
  const lower = q.toLowerCase();

  if (!q) return 'standard';
  if (SHORT_ACK_PATTERN.test(q)) return 'ack';
  if (LOOKUP_PATTERN.test(lower)) return 'lookup';
  if (URGENT_PATTERN.test(lower)) return 'urgent';
  if (PLANNING_PATTERN.test(lower)) return 'planning';
  if (mode === 'post-session') return 'post-session';
  return 'standard';
}

/**
 * @typedef {Object} AdvisorPolicy
 * @property {boolean} includeAdvisor
 * @property {number} maxUsesThisRequest
 * @property {boolean} enableCaching
 * @property {CraneIntent} intent
 * @property {string} [promptAddendum]
 * @property {string} [reason]
 */

/**
 * @param {Object} params
 * @param {'guide' | 'post-session'} params.mode
 * @param {{ advisorCallsTotal?: number, turnCount?: number }} [params.sessionMeta]
 * @param {string} params.userMessage
 * @param {boolean} [params.proactiveCarePlan]
 * @param {boolean} [params.forceAdvisor]
 */
export function resolveAdvisorPolicy({
  mode,
  sessionMeta = {},
  userMessage,
  proactiveCarePlan = false,
  forceAdvisor = false,
}) {
  const budget = ADVISOR_BUDGETS[mode] ?? ADVISOR_BUDGETS.guide;
  const callsSoFar = Number(sessionMeta.advisorCallsTotal ?? 0);
  const remainingConversation = Math.max(0, budget.conversationMax - callsSoFar);
  const intent = proactiveCarePlan ? 'planning' : classifyUserIntent(userMessage, mode);

  if (remainingConversation === 0 && !forceAdvisor) {
    return {
      includeAdvisor: false,
      maxUsesThisRequest: 0,
      enableCaching: false,
      intent,
      reason: 'conversation_budget_exhausted',
    };
  }

  if (intent === 'lookup' && !proactiveCarePlan && !forceAdvisor) {
    return {
      includeAdvisor: false,
      maxUsesThisRequest: 0,
      enableCaching: false,
      intent,
      reason: 'lookup_skip',
    };
  }

  if (intent === 'ack' && !proactiveCarePlan) {
    return {
      includeAdvisor: false,
      maxUsesThisRequest: 0,
      enableCaching: false,
      intent,
      reason: 'short_ack',
    };
  }

  const maxUses = Math.min(budget.perRequestMax, remainingConversation);

  if (mode === 'creator') {
    return {
      includeAdvisor: false,
      maxUsesThisRequest: 0,
      enableCaching: false,
      intent,
      promptAddendum:
        'Creator mode: call generate_custom_sequence immediately with a complete spec. Procedural audio required.',
      reason: 'creator',
    };
  }

  if (mode === 'post-session') {
    return {
      includeAdvisor: maxUses > 0 || forceAdvisor,
      maxUsesThisRequest: forceAdvisor ? Math.min(1, remainingConversation || 1) : maxUses,
      enableCaching: callsSoFar >= 2,
      intent,
      promptAddendum: proactiveCarePlan
        ? 'Generate a post-session care plan now using build_post_session_care_plan. One advisor consult, then execute the tool.'
        : 'Post-session mode: one advisor consult per turn max. Prefer build_post_session_care_plan when they need next steps.',
      reason: proactiveCarePlan ? 'proactive_care_plan' : 'post_session',
    };
  }

  if (intent === 'urgent') {
    return {
      includeAdvisor: remainingConversation > 0,
      maxUsesThisRequest: Math.min(1, remainingConversation),
      enableCaching: false,
      intent,
      promptAddendum:
        'User needs speed. One advisor consult maximum, then call start_sequence_for_user with urgency immediate.',
      reason: 'urgent',
    };
  }

  if (intent === 'planning') {
    return {
      includeAdvisor: maxUses > 0,
      maxUsesThisRequest: maxUses,
      enableCaching: callsSoFar >= 2,
      intent,
      promptAddendum:
        'Planning turn: consult advisor once, then use suggest_regulation_plan or build_post_session_care_plan.',
      reason: 'planning',
    };
  }

  return {
    includeAdvisor: maxUses > 0,
    maxUsesThisRequest: maxUses,
    enableCaching: callsSoFar >= 2,
    intent,
    reason: 'standard',
  };
}

export function buildProactiveCarePlanPrompt(supabaseContext) {
  const variantId = supabaseContext?.variantId ?? 'unknown sequence';
  const completed = supabaseContext?.telemetry?.completed_full_cycle
    ? 'completed the full cycle'
    : 'partial hold';
  const duration = supabaseContext?.telemetry?.duration_in_seconds;

  return (
    `[Clinical session debrief] The user just finished ${variantId} (${completed}` +
    `${typeof duration === 'number' ? `, ${duration}s` : ''}). ` +
    'Call deliver_body_debrief with a personalized nervous-system explanation, then build_post_session_care_plan with 2-3 recovery steps. ' +
    'Use completedVariantId from session context. Do not ask clarifying questions.'
  );
}

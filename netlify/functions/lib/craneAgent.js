import { resolveAdvisorPolicy } from './craneAdvisorPolicy.js';
import { buildCraneClientTools, buildAdvisorTool, executeCraneTool } from './craneTools.js';

const EXECUTOR_MODEL = 'claude-sonnet-4-6';
const ADVISOR_BETA = 'advisor-tool-2026-03-01';
const MAX_AGENT_TURNS = 10;

function extractText(content) {
  if (!Array.isArray(content)) return '';
  return content
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('\n')
    .trim();
}

function advisorWasCalled(content) {
  return (
    Array.isArray(content) &&
    content.some((block) => block.type === 'server_tool_use' && block.name === 'advisor')
  );
}

function collectClientToolUses(content) {
  if (!Array.isArray(content)) return [];
  return content.filter((block) => block.type === 'tool_use');
}

async function callAnthropic({ apiKey, system, messages, tools }) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': ADVISOR_BETA,
    },
    body: JSON.stringify({
      model: EXECUTOR_MODEL,
      max_tokens: 2048,
      system,
      messages,
      tools,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errText}`);
  }

  return response.json();
}

function buildToolsList({ mode, advisorPolicy, advisorModel }) {
  const clientTools = buildCraneClientTools(mode);
  if (!advisorPolicy.includeAdvisor || advisorPolicy.maxUsesThisRequest <= 0) {
    return clientTools;
  }
  return [
    ...clientTools,
    buildAdvisorTool({
      model: advisorModel,
      maxUses: advisorPolicy.maxUsesThisRequest,
      enableCaching: advisorPolicy.enableCaching,
    }),
  ];
}

/**
 * Run Crane agent loop with tuned advisor frequency and executable tools.
 */
export async function runCraneAgent({
  apiKey,
  systemPrompt,
  messages,
  mode = 'guide',
  sessionMeta = {},
  userMessage = '',
  proactiveCarePlan = false,
  advisorModel = 'claude-opus-4-8',
  maxTurns = MAX_AGENT_TURNS,
}) {
  const advisorPolicy = resolveAdvisorPolicy({
    mode,
    sessionMeta,
    userMessage,
    proactiveCarePlan,
  });

  const tools = buildToolsList({ mode, advisorPolicy, advisorModel });
  const anthropicMessages = [...messages];
  let advisorUsed = false;
  let advisorCallsThisRequest = 0;
  const actions = [];
  let carePlan = null;
  let bodyInsight = null;
  let finalText = '';
  let lastResponse = null;

  for (let turn = 0; turn < maxTurns; turn += 1) {
    const response = await callAnthropic({
      apiKey,
      system: systemPrompt,
      messages: anthropicMessages,
      tools,
    });

    lastResponse = response;

    if (advisorWasCalled(response.content)) {
      advisorUsed = true;
      advisorCallsThisRequest += 1;
    }

    if (response.stop_reason === 'end_turn') {
      finalText = extractText(response.content);
      break;
    }

    anthropicMessages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'pause_turn') {
      continue;
    }

    if (response.stop_reason === 'tool_use') {
      const toolUses = collectClientToolUses(response.content);
      const toolResults = [];

      for (const block of toolUses) {
        const { result, action, actions: planActions, carePlan: plan, bodyInsight: insight } =
          executeCraneTool(block.name, block.input);

        if (action) actions.push(action);
        if (Array.isArray(planActions)) actions.push(...planActions);
        if (plan) carePlan = plan;
        if (insight) bodyInsight = insight;

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }

      if (toolResults.length > 0) {
        anthropicMessages.push({ role: 'user', content: toolResults });
      } else {
        break;
      }
      continue;
    }

    finalText = extractText(response.content);
    break;
  }

  if (!finalText && lastResponse) {
    finalText = extractText(lastResponse.content);
  }

  const dedupedActions = dedupeActions(actions);
  const autoLaunch = pickAutoLaunchAction(dedupedActions);

  return {
    text: finalText,
    actions: dedupedActions,
    autoLaunch,
    carePlan,
    bodyInsight,
    advisorUsed,
    advisorCallsThisRequest,
    advisorPolicy: {
      intent: advisorPolicy.intent,
      reason: advisorPolicy.reason,
      maxUsesThisRequest: advisorPolicy.maxUsesThisRequest,
    },
    model: EXECUTOR_MODEL,
    advisorModel,
    usage: lastResponse?.usage ?? null,
  };
}

function pickAutoLaunchAction(actions) {
  const candidate = actions.find((a) => a.autoLaunch && a.path);
  if (!candidate) return null;
  return {
    path: candidate.path,
    variantId: candidate.variantId,
    label: candidate.label,
    prepNote: candidate.prepNote,
    countdownMs: candidate.countdownMs ?? 2500,
    urgency: candidate.urgency ?? 'standard',
  };
}

function dedupeActions(actions) {
  const seen = new Set();
  const out = [];
  for (const action of actions) {
    const key = `${action.type}:${action.path ?? action.label}:${action.variantId ?? ''}:${action.autoLaunch ?? false}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(action);
  }
  return out;
}

export { EXECUTOR_MODEL, ADVISOR_BETA };

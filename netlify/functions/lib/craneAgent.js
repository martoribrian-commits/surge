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

/**
 * Run Crane agent loop: Sonnet executor + Opus advisor + client tool execution.
 */
export async function runCraneAgent({
  apiKey,
  systemPrompt,
  messages,
  advisorModel = 'claude-opus-4-8',
  maxTurns = MAX_AGENT_TURNS,
}) {
  const tools = [...buildCraneClientTools(), buildAdvisorTool({ model: advisorModel })];
  const anthropicMessages = [...messages];
  let advisorUsed = false;
  const actions = [];
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
    advisorUsed = advisorUsed || advisorWasCalled(response.content);

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
        const { result, action, actions: planActions } = executeCraneTool(
          block.name,
          block.input,
        );

        if (action) {
          actions.push(action);
        }
        if (Array.isArray(planActions)) {
          actions.push(...planActions);
        }

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

  return {
    text: finalText,
    actions: dedupedActions,
    advisorUsed,
    model: EXECUTOR_MODEL,
    advisorModel,
    usage: lastResponse?.usage ?? null,
  };
}

function dedupeActions(actions) {
  const seen = new Set();
  const out = [];
  for (const action of actions) {
    const key = `${action.type}:${action.path ?? action.label}:${action.variantId ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(action);
  }
  return out;
}

export { EXECUTOR_MODEL, ADVISOR_BETA };

import { buildSystemPrompt, buildProactiveCarePlanPrompt } from './lib/cranePrompts.js';
import { runCraneAgent } from './lib/craneAgent.js';
import { resolveAdvisorPolicy } from './lib/craneAdvisorPolicy.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function mapConversationHistory(conversationHistory) {
  return conversationHistory.slice(-8).map((m) => ({
    role: m.role === 'crane' ? 'assistant' : 'user',
    content: String(m.content ?? ''),
  }));
}

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const proactiveCarePlan = Boolean(body?.proactiveCarePlan);
  const mode =
    body?.mode === 'guide' || (!body?.supabaseContext && !proactiveCarePlan)
      ? 'guide'
      : 'post-session';

  let userMessage = String(body?.userMessage ?? '').trim();
  if (!userMessage && !proactiveCarePlan) {
    return json({ error: 'userMessage required' }, 400);
  }

  if (proactiveCarePlan && mode === 'post-session') {
    userMessage = buildProactiveCarePlanPrompt(body?.supabaseContext);
  }

  const sequenceCatalog = body?.sequenceCatalog ?? [];
  const conversationHistory = Array.isArray(body?.conversationHistory) ? body.conversationHistory : [];
  const sessionMeta = body?.sessionMeta ?? {};

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json({ error: 'API not configured' }, 500);
  }

  const advisorPolicy = resolveAdvisorPolicy({
    mode,
    sessionMeta,
    userMessage,
    proactiveCarePlan,
  });

  const systemPrompt = buildSystemPrompt({
    mode,
    supabaseContext: body?.supabaseContext,
    sequenceCatalog,
    promptAddendum: advisorPolicy.promptAddendum,
  });

  const anthropicMessages = proactiveCarePlan
    ? [{ role: 'user', content: userMessage }]
    : [...mapConversationHistory(conversationHistory), { role: 'user', content: userMessage }];

  try {
    const result = await runCraneAgent({
      apiKey,
      systemPrompt,
      messages: anthropicMessages,
      mode,
      sessionMeta,
      userMessage,
      proactiveCarePlan,
      advisorModel: process.env.CRANE_ADVISOR_MODEL ?? 'claude-opus-4-8',
    });

    const advisorCallsTotal =
      Number(sessionMeta.advisorCallsTotal ?? 0) + (result.advisorCallsThisRequest ?? 0);

    return json({
      text: result.text,
      actions: result.actions ?? [],
      autoLaunch: result.autoLaunch ?? null,
      carePlan: result.carePlan ?? null,
      advisorUsed: result.advisorUsed ?? false,
      advisorCallsThisRequest: result.advisorCallsThisRequest ?? 0,
      advisorCallsTotal,
      advisorPolicy: result.advisorPolicy ?? null,
      model: result.model,
      advisorModel: result.advisorModel,
      mode,
      proactiveCarePlan,
    });
  } catch (err) {
    console.error('[crane-inference]', err);
    return json({ error: 'Inference failed' }, 500);
  }
};

import { buildSystemPrompt } from './lib/cranePrompts.js';
import { runCraneAgent } from './lib/craneAgent.js';

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

  const userMessage = String(body?.userMessage ?? '').trim();
  if (!userMessage) {
    return json({ error: 'userMessage required' }, 400);
  }

  const mode = body?.mode === 'guide' || !body?.supabaseContext ? 'guide' : 'post-session';
  const sequenceCatalog = body?.sequenceCatalog ?? [];
  const conversationHistory = Array.isArray(body?.conversationHistory) ? body.conversationHistory : [];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json({ error: 'API not configured' }, 500);
  }

  const systemPrompt = buildSystemPrompt({
    mode,
    supabaseContext: body?.supabaseContext,
    sequenceCatalog,
  });

  const anthropicMessages = [
    ...mapConversationHistory(conversationHistory),
    { role: 'user', content: userMessage },
  ];

  try {
    const result = await runCraneAgent({
      apiKey,
      systemPrompt,
      messages: anthropicMessages,
      advisorModel: process.env.CRANE_ADVISOR_MODEL ?? 'claude-opus-4-8',
    });

    return json({
      text: result.text,
      actions: result.actions ?? [],
      advisorUsed: result.advisorUsed ?? false,
      model: result.model,
      advisorModel: result.advisorModel,
      mode,
    });
  } catch (err) {
    console.error('[crane-inference]', err);
    return json({ error: 'Inference failed' }, 500);
  }
};

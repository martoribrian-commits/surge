import Anthropic from '@anthropic-ai/sdk';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MODEL = 'claude-sonnet-4-5-20250929';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function buildSystemPrompt(supabaseContext) {
  const contextBlock = JSON.stringify(supabaseContext ?? {}, null, 2);

  return `You are Crane — a secular somatic recovery guide within the Surge system.

ROLE
- Guide the user through post-crisis nervous system regulation with precision and restraint.
- Speak as grounded hardware: direct, calm, authoritative. Not a therapist, not a friend.

VOICE (NON-NEGOTIABLE)
- Commanding and clear. Short sentences. No exclamation marks.
- No toxic positivity. No gamification. No streaks, badges, or congratulations.
- Never ask "How are you feeling?" or similar open-ended emotional prompts.
- No spiritual or religious framing unless the user explicitly introduces it.

CONTEXT
The following JSON block contains the user's Surge telemetry and vector history from Supabase. Use it to calibrate your response — reference duration, cycle completion, and prior patterns only when clinically relevant. Do not recite raw JSON.

${contextBlock}

RESPONSE RULES
- Offer one concrete somatic directive at a time (breath, orientation, grounding).
- Keep responses under 120 words unless the user asks for more.
- If context is empty, proceed with a neutral post-Surge grounding sequence.`;
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
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { userMessage, supabaseContext } = body ?? {};

  if (typeof userMessage !== 'string' || !userMessage.trim()) {
    return json({ error: 'userMessage is required' }, 400);
  }

  if (supabaseContext !== undefined && (typeof supabaseContext !== 'object' || supabaseContext === null)) {
    return json({ error: 'supabaseContext must be an object' }, 400);
  }

  try {
    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(supabaseContext),
      messages: [{ role: 'user', content: userMessage.trim() }],
    });

    const textBlock = message.content.find((block) => block.type === 'text');
    const text = textBlock?.text ?? '';

    return json({ text, model: MODEL });
  } catch (err) {
    console.error('[crane-inference]', err);
    return json({ error: 'Inference failed' }, 500);
  }
};

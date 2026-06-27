const SYSTEM_PROMPT = `You are Crane, the AI recovery guide for Surge. The user has just completed a 90-second somatic regulation cycle during an acute crisis moment. They are calm but potentially raw, vulnerable, or emotionally open in a way they rarely are. Your role is presence, not intervention. You do not diagnose, prescribe, or redirect to professional help unless there is explicit indication of immediate self-harm risk. You do not use therapy-speak, wellness jargon, or affirmations. You do not ask multiple questions at once. You do not celebrate their completion of the cycle. You speak in short, grounded sentences. You mirror their energy. If they disclose something heavy, you acknowledge it plainly and without clinical framing. You are not a chatbot. You are not a therapist. You are a steady presence available at the exact moment someone needs one. Never use em dashes. Never use the word journey. Never use the phrase I understand. Never say That must be hard. Say what is true.`;

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

  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: 'messages required' }, 400);
  }

  const context = body?.context;
  let systemPrompt = SYSTEM_PROMPT;
  if (context && typeof context === 'object') {
    const parts = [];
    if (context.durationSeconds != null) {
      parts.push(`The user held for ${context.durationSeconds} seconds.`);
    }
    if (context.completionState) {
      parts.push(`Completion state: ${context.completionState}.`);
    }
    if (context.brainDump && String(context.brainDump).trim()) {
      const note = String(context.brainDump).trim().slice(0, 500);
      parts.push(`Before opening chat they wrote (ephemeral, reference subtly): "${note}"`);
    }
    if (parts.length) {
      systemPrompt += '\n\nSession context:\n' + parts.join(' ');
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json({ error: 'API not configured' }, 500);
  }

  const anthropicMessages = messages.map((m) => ({
    role: m.role === 'crane' ? 'assistant' : 'user',
    content: String(m.content ?? ''),
  }));

  // Ensure conversation starts with user if first msg is assistant (opening is client-side)
  if (anthropicMessages[0]?.role === 'assistant') {
    anthropicMessages.unshift({ role: 'user', content: 'I completed the cycle.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: anthropicMessages,
      }),
    });

    if (!response.ok) {
      console.error('[crane]', await response.text());
      return json({ error: 'Inference failed' }, 500);
    }

    const data = await response.json();
    const text = data.content?.find((b) => b.type === 'text')?.text ?? '';

    return json({ response: text });
  } catch (err) {
    console.error('[crane]', err);
    return json({ error: 'Inference failed' }, 500);
  }
};

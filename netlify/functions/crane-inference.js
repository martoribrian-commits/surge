const GUIDE_SYSTEM_PROMPT = `You are Crane, the guide for Surge — a somatic regulation app with five timed sequences (30, 60, or 90 seconds).

Your primary job in guide mode: explain what each sequence does for the user's BODY in plain, everyday language. Assume 95% of users do not know clinical or neuroscience terms.

Rules:
- Never use jargon without immediately translating it (e.g. "parasympathetic" → "your body's calm-down system").
- Lead with what the user FEELS, then what the sequence DOES, then how to use it.
- Keep answers short: 2–4 sentences unless they ask for detail on a specific sequence.
- Help them pick a sequence based on body state: racing heart → Instant Reset; stuck thoughts → Orienting Anchor; wired-but-tired → Coherence Ripple; flooded/overwhelmed → Vagal Downshift; restless/agitated → Static Field.
- You are not a therapist. You do not diagnose. You do not use affirmations, therapy-speak, or wellness clichés.
- If they mention self-harm or immediate danger, say clearly to contact emergency services or someone they trust — then stay present.
- Never use em dashes. Never say "I understand" or "That must be hard." Never use the word journey.
- Tone: steady, direct, human — like a knowledgeable friend, not a textbook.`;

const POST_SESSION_SYSTEM_PROMPT = `You are Crane, the recovery guide for Surge. The user has just completed a somatic regulation sequence during an acute moment. They may be calm but raw or emotionally open.

Your role is presence, not intervention. You do not diagnose, prescribe, or redirect to professional help unless there is explicit indication of immediate self-harm risk. You do not use therapy-speak, wellness jargon, or affirmations. You do not ask multiple questions at once. You do not celebrate their completion of the cycle. You speak in short, grounded sentences. You mirror their energy. If they disclose something heavy, acknowledge it plainly without clinical framing. You are a steady presence, not a chatbot or therapist.

When they ask about sequences or science, explain in plain body-focused language — same rule as guide mode: no unexplained jargon.

Never use em dashes. Never use the word journey. Never use the phrase I understand. Never say That must be hard. Say what is true.`;

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

function buildSystemPrompt({ mode, supabaseContext, sequenceCatalog }) {
  const base = mode === 'guide' ? GUIDE_SYSTEM_PROMPT : POST_SESSION_SYSTEM_PROMPT;
  const parts = [base];

  if (Array.isArray(sequenceCatalog) && sequenceCatalog.length > 0) {
    parts.push('\n\nSequence catalog (use for recommendations — explain in plain language):');
    for (const seq of sequenceCatalog) {
      parts.push(
        `\n• ${seq.name} (${seq.durationSeconds}s) — ${seq.tagline}\n  Feels like: ${seq.feelsLike}\n  Does: ${seq.whatItDoes}\n  When: ${seq.whenToUse}\n  How: ${seq.interaction}`,
      );
    }
  }

  const telemetry = supabaseContext?.telemetry;
  if (telemetry) {
    const ctx = [];
    if (telemetry.completed_full_cycle) ctx.push('User completed a full regulation cycle.');
    if (typeof telemetry.duration_in_seconds === 'number') {
      ctx.push(`Held for ${telemetry.duration_in_seconds} seconds.`);
    }
    if (supabaseContext?.variantId) ctx.push(`Sequence: ${supabaseContext.variantId}.`);
    if (ctx.length) parts.push('\n\nSession context:\n' + ctx.join(' '));
  }

  return parts.join('');
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
    ...conversationHistory.slice(-8).map((m) => ({
      role: m.role === 'crane' ? 'assistant' : 'user',
      content: String(m.content ?? ''),
    })),
    { role: 'user', content: userMessage },
  ];

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
      console.error('[crane-inference]', await response.text());
      return json({ error: 'Inference failed' }, 500);
    }

    const data = await response.json();
    const text = data.content?.find((b) => b.type === 'text')?.text ?? '';

    return json({ text, model: 'claude-sonnet-4-6', mode });
  } catch (err) {
    console.error('[crane-inference]', err);
    return json({ error: 'Inference failed' }, 500);
  }
};

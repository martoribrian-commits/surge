const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `You generate a somatic anchor for Surge, a 90-second press-and-hold nervous system regulation tool.

Given one word the user typed (their current state, sensation, or need), return JSON only:
{"anchor":"...","breathCue":"..."}

Rules:
- anchor: 3 to 6 words max. Grounded, physical, secular. No therapy-speak, no affirmations, no em dashes.
- breathCue: 3 to 5 words. References slow breathing or body release. Science-aligned (e.g. longer exhale, five breaths per minute).
- Never diagnose. Never say journey, safe space, or I understand.
- If the word is empty or unclear, return a neutral anchor like "Feet on the floor."`;

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

  const word = String(body?.word ?? '').trim().slice(0, 32);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json({ error: 'API not configured' }, 500);
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
        max_tokens: 120,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: word ? `Word: ${word}` : 'Word: (none — use neutral anchor)',
          },
        ],
      }),
    });

    if (!response.ok) {
      return json({ error: 'Upstream error' }, 502);
    }

    const data = await response.json();
    const text = data.content?.find((c) => c.type === 'text')?.text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return json({ error: 'Invalid model response' }, 502);
    }

    const parsed = JSON.parse(match[0]);
    return json({
      anchor: String(parsed.anchor ?? '').slice(0, 80),
      breathCue: String(parsed.breathCue ?? '').slice(0, 60),
    });
  } catch {
    return json({ error: 'Generation failed' }, 500);
  }
};

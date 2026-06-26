import { supabase } from './supabaseClient';
import { getCachedSessionPayload } from './sessionPayload';

const TELEMETRY_FUNCTION = 'process-surge-telemetry';

const HERON_INFERENCE_URL =
  import.meta.env.VITE_HERON_INFERENCE_URL ?? '/.netlify/functions/heron-inference';

/** Default opening directive after Surge completion — not a feeling prompt. */
export const HERON_INITIAL_MESSAGE =
  'Surge cycle complete. Initiate post-regulation guidance.';

/**
 * Step A — Fetch compiled Supabase context (telemetry + vector history).
 */
export async function fetchHeronContext(sessionId) {
  if (!supabase) {
    throw new Error('Supabase client unavailable');
  }

  const { data, error } = await supabase.functions.invoke(TELEMETRY_FUNCTION, {
    body: { action: 'fetchContext', sessionId },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data.supabaseContext;
}

/**
 * Step B — Run Heron inference via Netlify Function + AI Gateway.
 */
export async function requestHeronInference({ userMessage, supabaseContext }) {
  const response = await fetch(HERON_INFERENCE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userMessage, supabaseContext }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? 'Heron inference failed');
  }

  return data;
}

/**
 * Two-step Heron contact flow: context fetch → inference.
 */
export async function initiateHeronContact(userMessage = HERON_INITIAL_MESSAGE) {
  const session = getCachedSessionPayload();
  const sessionId = session?.sessionId;

  if (!sessionId) {
    throw new Error('No Surge session found');
  }

  const supabaseContext = await fetchHeronContext(sessionId);
  const inference = await requestHeronInference({ userMessage, supabaseContext });

  return {
    supabaseContext,
    reply: inference.text,
    model: inference.model,
  };
}

import { supabase } from './supabaseClient';
import { getCachedSessionPayload } from './sessionPayload';

const TELEMETRY_FUNCTION = 'process-surge-telemetry';

const EGRET_INFERENCE_URL =
  import.meta.env.VITE_EGRET_INFERENCE_URL ?? '/.netlify/functions/egret-inference';

const VALIDATE_TOKEN_URL =
  import.meta.env.VITE_VALIDATE_TOKEN_URL ?? '/api/validate-token';

/** Default opening directive after Surge completion — not a feeling prompt. */
export const EGRET_INITIAL_MESSAGE =
  'Surge cycle complete. Initiate post-regulation guidance.';

/**
 * Builds Egret's telemetry-aware opener from Supabase context.
 */
export function buildEgretTelemetryOpener(supabaseContext) {
  const telemetry = supabaseContext?.telemetry;

  if (telemetry?.completed_full_cycle) {
    return "The system registered a full reset. You held on. Let's process the trigger when you're ready.";
  }

  const duration = telemetry?.duration_in_seconds;
  if (typeof duration === 'number' && duration > 0) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const held = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    return `The system logged ${held} of containment. Cycle incomplete. We can work from here when you're ready.`;
  }

  return 'Contact established. The Surge phase is behind you. Speak when ready.';
}

/**
 * Validate clinical token via Netlify Function — no PII returned.
 */
export async function validateClinicalToken(token) {
  const response = await fetch(VALIDATE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  const data = await response.json();
  return { valid: Boolean(data?.valid), tier: data?.tier ?? null };
}

/**
 * Step A — Fetch compiled Supabase context (telemetry + vector history).
 */
export async function fetchEgretContext(sessionId) {
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
 * Step B — Run Egret inference via Netlify Function + AI Gateway.
 */
export async function requestEgretInference({ userMessage, supabaseContext }) {
  const response = await fetch(EGRET_INFERENCE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userMessage, supabaseContext }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? 'Egret inference failed');
  }

  return data;
}

/**
 * Two-step Egret contact flow: context fetch → inference.
 */
export async function initiateEgretContact(userMessage = EGRET_INITIAL_MESSAGE) {
  const session = getCachedSessionPayload();
  const sessionId = session?.sessionId;

  if (!sessionId) {
    throw new Error('No Surge session found');
  }

  const supabaseContext = await fetchEgretContext(sessionId);
  const inference = await requestEgretInference({ userMessage, supabaseContext });

  return {
    supabaseContext,
    reply: inference.text,
    model: inference.model,
  };
}

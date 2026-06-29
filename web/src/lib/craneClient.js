import { supabase } from './supabaseClient';
import { getCachedSessionPayload } from './sessionPayload';
import {
  buildSequenceGuideCatalog,
  CRANE_GUIDE_OPENER,
  CRANE_POST_SESSION_OPENER,
  matchGuideFallback,
} from './craneGuideCatalog';

const TELEMETRY_FUNCTION = 'process-surge-telemetry';

const CRANE_INFERENCE_URL =
  import.meta.env.VITE_CRANE_INFERENCE_URL ?? '/.netlify/functions/crane-inference';

const VALIDATE_TOKEN_URL =
  import.meta.env.VITE_VALIDATE_TOKEN_URL ?? '/api/validate-token';

/** Default opening directive after Surge completion — not a feeling prompt. */
export const CRANE_INITIAL_MESSAGE =
  'Surge cycle complete. Initiate post-regulation guidance.';

export const SEQUENCE_GUIDE_CATALOG = buildSequenceGuideCatalog();

/**
 * Builds Crane's telemetry-aware opener from Supabase context.
 */
export function buildCraneTelemetryOpener(supabaseContext) {
  const telemetry = supabaseContext?.telemetry;

  if (telemetry?.completed_full_cycle) {
    return "The sequence finished. You stayed with it. If something came up, you can say it here — or ask me to explain what just happened in your body.";
  }

  const duration = telemetry?.duration_in_seconds;
  if (typeof duration === 'number' && duration > 0) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const held = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    return `You held for ${held}. The cycle was not complete, and that is fine. I am here if you want to talk through what came up — or pick a different sequence.`;
  }

  return CRANE_POST_SESSION_OPENER;
}

export function buildCraneGuideOpener() {
  return CRANE_GUIDE_OPENER;
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
export async function fetchCraneContext(sessionId) {
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
 * Crane inference — guide mode (no session) or post-session mode.
 */
export async function requestCraneInference({
  userMessage,
  supabaseContext = null,
  conversationHistory = [],
  mode = null,
}) {
  const resolvedMode =
    mode ?? (supabaseContext?.telemetry ? 'post-session' : 'guide');

  const response = await fetch(CRANE_INFERENCE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userMessage,
      supabaseContext,
      conversationHistory,
      sequenceCatalog: SEQUENCE_GUIDE_CATALOG,
      mode: resolvedMode,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? 'Crane inference failed');
  }

  return data;
}

/**
 * Guide-mode inference with static fallback when API unavailable.
 */
export async function requestCraneGuideInference({
  userMessage,
  conversationHistory = [],
}) {
  try {
    return await requestCraneInference({
      userMessage,
      conversationHistory,
      mode: 'guide',
    });
  } catch {
    const fallback = matchGuideFallback(userMessage);
    return {
      text: fallback ?? 'I can help you pick a sequence. Tell me what your body feels like right now.',
      model: 'fallback',
      mode: 'guide',
    };
  }
}

/**
 * Two-step Crane contact flow: context fetch → inference.
 */
export async function initiateCraneContact(userMessage = CRANE_INITIAL_MESSAGE) {
  const session = getCachedSessionPayload();
  const sessionId = session?.sessionId;

  if (!sessionId) {
    throw new Error('No Surge session found');
  }

  const supabaseContext = await fetchCraneContext(sessionId);
  const inference = await requestCraneInference({ userMessage, supabaseContext });

  return {
    supabaseContext,
    reply: inference.text,
    model: inference.model,
  };
}

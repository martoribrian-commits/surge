import { supabase } from './supabaseClient';

const STORAGE_KEY = 'surge.sessionPayload';
const PENDING_KEY = 'surge.pendingTelemetry';
const TELEMETRY_FUNCTION = 'process-surge-telemetry';
const MAX_PENDING = 20;

/**
 * Builds a session payload for Heron / Marrow ingestion.
 */
export function buildSessionPayload(durationInSeconds, completedFullCycle) {
  return {
    sessionId: crypto.randomUUID(),
    durationInSeconds: Math.round(durationInSeconds),
    completedFullCycle: Boolean(completedFullCycle),
  };
}

/**
 * Persists session payload to localStorage via native JSON serialization.
 */
export function cacheSessionPayload(payload) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Private browsing — in-memory only
  }
}

export function getCachedSessionPayload() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getPendingQueue() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function enqueuePending(payload) {
  try {
    const queue = getPendingQueue().filter((p) => p.sessionId !== payload.sessionId);
    queue.push({ ...payload, queuedAt: Date.now() });
    localStorage.setItem(PENDING_KEY, JSON.stringify(queue.slice(-MAX_PENDING)));
  } catch {
    // Non-fatal
  }
}

function removeFromPendingQueue(sessionId) {
  try {
    const queue = getPendingQueue().filter((p) => p.sessionId !== sessionId);
    localStorage.setItem(PENDING_KEY, JSON.stringify(queue));
  } catch {
    // Non-fatal
  }
}

/**
 * Submits session telemetry to Supabase Edge Function.
 * Never throws — failures queue offline for later flush.
 */
export async function submitSessionTelemetry(payload) {
  if (!payload?.sessionId) {
    return { ok: false, offline: true };
  }

  if (!supabase) {
    enqueuePending(payload);
    return { ok: false, offline: true };
  }

  try {
    const { data, error } = await supabase.functions.invoke(TELEMETRY_FUNCTION, {
      body: payload,
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    removeFromPendingQueue(payload.sessionId);
    return { ok: true, data };
  } catch {
    enqueuePending(payload);
    return { ok: false, offline: true };
  }
}

/**
 * Flushes queued telemetry after reconnect — fire-and-forget.
 */
export async function flushPendingTelemetry() {
  const pending = getPendingQueue();
  if (!pending.length) return;

  await Promise.allSettled(pending.map((item) => submitSessionTelemetry(item)));
}

/**
 * Routes to Marrow — ensures telemetry is submitted (or queued) first.
 */
export async function routeToMarrow() {
  const payload = getCachedSessionPayload();

  if (payload) {
    await submitSessionTelemetry(payload);
  }

  const marrowUrl = import.meta.env.VITE_MARROW_URL;
  if (marrowUrl) {
    window.location.href = marrowUrl;
  }
}

/**
 * Sovereignty guard — prevents Crane conversation payloads from leaking
 * to external log aggregators (Sentry, Datadog, etc.).
 *
 * Crane text never leaves the device except via explicit user-initiated inference.
 */

const CRANE_STORAGE_PREFIXES = ['surge.crane.ephemeral.', 'surge.crane.saved.', 'surge.crane.pref.'];

/** @type {Set<(payload: string) => void>} */
const externalSinks = new Set();

/**
 * Register an external telemetry sink for sovereignty auditing (tests only in practice).
 * @param {(payload: string) => void} sink
 * @returns {() => void} unsubscribe
 */
export function registerExternalSink(sink) {
  if (typeof sink !== 'function') return () => {};
  externalSinks.add(sink);
  return () => externalSinks.delete(sink);
}

/** @returns {boolean} true if string resembles Crane conversation content */
export function looksLikeCranePayload(value) {
  if (value == null) return false;
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  if (!text || text.length < 8) return false;

  for (const prefix of CRANE_STORAGE_PREFIXES) {
    if (text.includes(prefix)) return true;
  }

  if (text.includes('"role":"user"') || text.includes('"role":"crane"')) return true;
  if (text.includes('"role": "user"') || text.includes('"role": "crane"')) return true;

  return false;
}

/**
 * Assert no Crane payload is emitted to registered external sinks.
 * @param {unknown} payload
 * @throws {Error} when a sovereignty violation is detected
 */
export function assertNoCranePayloadLeak(payload) {
  if (!looksLikeCranePayload(payload)) return;

  const message = '[Sovereignty] Blocked Crane payload from external sink';
  if (import.meta.env?.DEV) {
    console.warn(message);
  }
  throw new Error(message);
}

/**
 * Safe emit for diagnostic hooks — strips Crane content before forwarding.
 * @param {unknown} payload
 */
export function emitDiagnosticSafe(payload) {
  if (looksLikeCranePayload(payload)) return;
  for (const sink of externalSinks) {
    try {
      sink(typeof payload === 'string' ? payload : JSON.stringify(payload ?? ''));
    } catch {
      /* swallow — sinks must never break UX */
    }
  }
}

/**
 * Wrap Sentry-like API to enforce sovereignty at the boundary.
 * @param {{ captureMessage?: Function, captureException?: Function }} sentry
 */
export function wrapSentryForSovereignty(sentry) {
  if (!sentry) return sentry;

  const wrap = (fn) => (arg, ...rest) => {
    assertNoCranePayloadLeak(arg);
    if (typeof arg === 'object' && arg != null) {
      assertNoCranePayloadLeak(JSON.stringify(arg));
    }
    return fn?.call(sentry, arg, ...rest);
  };

  return {
    ...sentry,
    captureMessage: wrap(sentry.captureMessage),
    captureException: wrap(sentry.captureException),
  };
}

/** Clear all registered sinks — test helper */
export function resetExternalSinks() {
  externalSinks.clear();
}

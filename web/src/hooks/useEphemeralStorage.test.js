import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DEFAULT_EPHEMERAL_TTL_MS,
  evaluateEphemeralLifecycle,
  hardPurgeStorageKey,
} from '../hooks/useEphemeralStorage';
import { saveCraneThread, loadCraneThread, CRANE_TTL_MS } from '../lib/craneRetentionStore';
import {
  assertNoCranePayloadLeak,
  emitDiagnosticSafe,
  looksLikeCranePayload,
  registerExternalSink,
  resetExternalSinks,
  wrapSentryForSovereignty,
} from '../lib/sovereigntyGuard';

const EPHEMERAL_KEY = 'surge.crane.ephemeral.test-session';
const PERSISTENT_KEY = 'surge.crane.saved.test-session';
const PREF_KEY = 'surge.crane.pref.test-session';

describe('useEphemeralStorage / evaluateEphemeralLifecycle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('preserves data when Save Insights Locally toggle is true (persistent)', () => {
    const createdAt = Date.now() - CRANE_TTL_MS - 60_000;
    const messages = [{ id: '1', role: 'user', content: 'grounding note', createdAt }];

    localStorage.setItem(PREF_KEY, 'true');
    localStorage.setItem(
      PERSISTENT_KEY,
      JSON.stringify({ messages, createdAt, updatedAt: createdAt }),
    );

    const thread = loadCraneThread('test-session');

    expect(thread).not.toBeNull();
    expect(thread.savePersistently).toBe(true);
    expect(thread.messages).toHaveLength(1);
    expect(thread.messages[0].content).toBe('grounding note');
    expect(localStorage.getItem(PERSISTENT_KEY)).not.toBeNull();
  });

  it('irreversibly wipes ephemeral data after 24 hours elapsed', () => {
    const createdAt = Date.now() - DEFAULT_EPHEMERAL_TTL_MS - 1;
    const payload = {
      data: { messages: [{ id: 'm1', role: 'user', content: 'secret thought', createdAt }] },
      createdAt,
      persist: false,
    };

    localStorage.setItem(EPHEMERAL_KEY, JSON.stringify(payload));
    expect(localStorage.getItem(EPHEMERAL_KEY)).not.toBeNull();

    const { purged, record } = evaluateEphemeralLifecycle({
      storageKey: EPHEMERAL_KEY,
      ttlMs: DEFAULT_EPHEMERAL_TTL_MS,
      savePersistently: false,
    });

    expect(purged).toBe(true);
    expect(record).toBeNull();
    expect(localStorage.getItem(EPHEMERAL_KEY)).toBeNull();

    hardPurgeStorageKey(EPHEMERAL_KEY);
    expect(localStorage.getItem(EPHEMERAL_KEY)).toBeNull();
  });

  it('retains ephemeral data within the 24-hour window', () => {
    const createdAt = Date.now() - 60 * 60 * 1000;
    localStorage.setItem(
      EPHEMERAL_KEY,
      JSON.stringify({
        data: { messages: [{ id: 'm2', role: 'crane', content: 'held locally', createdAt }] },
        createdAt,
        persist: false,
      }),
    );

    const { purged, record } = evaluateEphemeralLifecycle({
      storageKey: EPHEMERAL_KEY,
      ttlMs: DEFAULT_EPHEMERAL_TTL_MS,
    });

    expect(purged).toBe(false);
    expect(record?.data?.messages).toHaveLength(1);
    expect(localStorage.getItem(EPHEMERAL_KEY)).not.toBeNull();
  });

  it('saveCraneThread respects persistent vs ephemeral storage keys', () => {
    const now = Date.now();
    saveCraneThread({
      sessionId: 'test-session',
      messages: [{ id: 'a', role: 'user', content: 'local only', createdAt: now }],
      savePersistently: false,
      createdAt: now,
      expiresAt: now + CRANE_TTL_MS,
    });

    expect(localStorage.getItem(EPHEMERAL_KEY)).not.toBeNull();
    expect(localStorage.getItem(PERSISTENT_KEY)).toBeNull();

    saveCraneThread({
      sessionId: 'test-session',
      messages: [{ id: 'b', role: 'user', content: 'saved insight', createdAt: now }],
      savePersistently: true,
      createdAt: now,
    });

    expect(localStorage.getItem(PREF_KEY)).toBe('true');
    expect(localStorage.getItem(PERSISTENT_KEY)).not.toBeNull();
    expect(localStorage.getItem(EPHEMERAL_KEY)).toBeNull();
  });
});

describe('sovereigntyGuard — Crane interaction leak prevention', () => {
  beforeEach(() => {
    resetExternalSinks();
  });

  it('detects Crane-shaped payloads', () => {
    expect(looksLikeCranePayload('surge.crane.ephemeral.abc')).toBe(true);
    expect(looksLikeCranePayload({ role: 'user', content: 'hello' })).toBe(true);
    expect(looksLikeCranePayload('session completed')).toBe(false);
  });

  it('does not forward Crane text to external diagnostic sinks', () => {
    const sink = vi.fn();
    registerExternalSink(sink);

    emitDiagnosticSafe('engine ready');
    emitDiagnosticSafe({ role: 'user', content: 'private brain dump' });
    emitDiagnosticSafe('surge.crane.saved.session-1');

    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink).toHaveBeenCalledWith('engine ready');
  });

  it('blocks Sentry captureMessage from receiving Crane conversation payloads', () => {
    const captureMessage = vi.fn();
    const captureException = vi.fn();
    const sentry = wrapSentryForSovereignty({ captureMessage, captureException });

    sentry.captureMessage('sequence started');
    expect(captureMessage).toHaveBeenCalledWith('sequence started');

    expect(() =>
      sentry.captureMessage(JSON.stringify({ role: 'crane', content: 'therapeutic reply' })),
    ).toThrow(/Sovereignty/);

    expect(captureMessage).toHaveBeenCalledTimes(1);
  });

  it('assertNoCranePayloadLeak throws on sensitive thread export', () => {
    expect(() => assertNoCranePayloadLeak('benign metric')).not.toThrow();
    expect(() =>
      assertNoCranePayloadLeak('{"role":"user","content":"I feel overwhelmed"}'),
    ).toThrow(/Sovereignty/);
  });
});

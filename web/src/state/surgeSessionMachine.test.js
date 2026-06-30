/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import {
  SurgeEvent,
  SurgePhase,
  createInitialSessionState,
  surgeSessionReducer,
} from './surgeSessionMachine';

describe('surgeSessionMachine completion flow', () => {
  it('transitions regulation → completing → aftermath', () => {
    let state = createInitialSessionState();
    state = surgeSessionReducer(state, {
      type: SurgeEvent.ENGAGE,
      payload: { sessionId: 'test-session', startedAt: Date.now(), variantId: 'instant-reset' },
    });
    expect(state.phase).toBe(SurgePhase.REGULATION);

    state = surgeSessionReducer(state, {
      type: SurgeEvent.CYCLE_COMPLETE,
      payload: { completedAt: Date.now(), durationSeconds: 30 },
    });
    expect(state.phase).toBe(SurgePhase.COMPLETING);
    expect(state.sessionId).toBe('test-session');

    state = surgeSessionReducer(state, { type: SurgeEvent.ENTER_AFTERMATH });
    expect(state.phase).toBe(SurgePhase.AFTERMATH);
  });

  it('rejects ENTER_AFTERMATH unless completing', () => {
    let state = createInitialSessionState();
    state = surgeSessionReducer(state, {
      type: SurgeEvent.ENGAGE,
      payload: { sessionId: 'x', startedAt: Date.now() },
    });
    state = surgeSessionReducer(state, { type: SurgeEvent.ENTER_AFTERMATH });
    expect(state.phase).toBe(SurgePhase.REGULATION);
  });

  it('supports decompression round-trip from aftermath', () => {
    let state = createInitialSessionState();
    state = surgeSessionReducer(state, {
      type: SurgeEvent.ENGAGE,
      payload: { sessionId: 'x', startedAt: Date.now() },
    });
    state = surgeSessionReducer(state, {
      type: SurgeEvent.CYCLE_COMPLETE,
      payload: { completedAt: Date.now(), durationSeconds: 90 },
    });
    state = surgeSessionReducer(state, { type: SurgeEvent.ENTER_AFTERMATH });
    state = surgeSessionReducer(state, { type: SurgeEvent.ENTER_DECOMPRESSION });
    expect(state.phase).toBe(SurgePhase.DECOMPRESSION);

    state = surgeSessionReducer(state, { type: SurgeEvent.EXIT_DECOMPRESSION });
    expect(state.phase).toBe(SurgePhase.AFTERMATH);
  });
});

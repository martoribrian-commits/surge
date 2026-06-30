import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { useSurgeEngine } from '../hooks/useSurgeEngine';
import {
  SurgeEvent,
  SurgePhase,
  createInitialSessionState,
  isLockedOnRegulation,
  surgeSessionReducer,
} from '../state/surgeSessionMachine';
import {
  buildSessionPayload,
  cacheSessionPayload,
  submitSessionTelemetry,
} from '../lib/sessionPayload';

const SESSION_DURATION_S = 90;
const COMPLETION_HOLD_MS = 3200;

const SurgeSessionContext = createContext(null);

export function SurgeSessionProvider({ children }) {
  const [state, dispatch] = useReducer(surgeSessionReducer, undefined, createInitialSessionState);
  const engine = useSurgeEngine(SESSION_DURATION_S);
  const sessionStartRef = useRef(null);
  const completionTimerRef = useRef(null);
  const completionHandledRef = useRef(false);

  const engage = useCallback(() => {
    if (state.phase !== SurgePhase.ENTRY && state.phase !== SurgePhase.PAUSED) return;

    if (state.phase === SurgePhase.ENTRY) {
      sessionStartRef.current = performance.now();
      dispatch({
        type: SurgeEvent.ENGAGE,
        payload: { sessionId: crypto.randomUUID(), startedAt: Date.now() },
      });
    } else {
      dispatch({ type: SurgeEvent.RESUME });
    }

    engine.startSurge();
  }, [engine, state.phase]);

  const release = useCallback(() => {
    if (state.phase !== SurgePhase.REGULATION) return;
    dispatch({ type: SurgeEvent.RELEASE });
    engine.stopSurge();
  }, [engine, state.phase]);

  const reset = useCallback(() => {
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
    completionHandledRef.current = false;
    sessionStartRef.current = null;
    dispatch({ type: SurgeEvent.RESET });
  }, []);

  useEffect(() => {
    if (!engine.isComplete || state.phase !== SurgePhase.REGULATION || completionHandledRef.current) {
      return;
    }
    completionHandledRef.current = true;

    const elapsed = sessionStartRef.current
      ? Math.round((performance.now() - sessionStartRef.current) / 1000)
      : SESSION_DURATION_S;

    const payload = buildSessionPayload(
      Math.max(1, elapsed),
      true,
      state.sessionId,
    );
    cacheSessionPayload(payload);
    submitSessionTelemetry(payload);

    dispatch({
      type: SurgeEvent.CYCLE_COMPLETE,
      payload: {
        completedAt: Date.now(),
        durationSeconds: Math.max(1, elapsed),
      },
    });
  }, [engine.isComplete, state.phase, state.sessionId]);

  useEffect(() => {
    if (state.phase !== SurgePhase.COMPLETING) return;

    completionTimerRef.current = setTimeout(() => {
      dispatch({ type: SurgeEvent.ENTER_AFTERMATH });
      completionTimerRef.current = null;
    }, COMPLETION_HOLD_MS);

    return () => {
      if (completionTimerRef.current) {
        clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;
      }
    };
  }, [state.phase]);

  const progress = useMemo(() => {
    return Math.max(0, Math.min(1, 1 - engine.intensity));
  }, [engine.intensity]);

  const value = useMemo(
    () => ({
      phase: state.phase,
      sessionId: state.sessionId,
      durationSeconds: state.durationSeconds,
      intensity: engine.intensity,
      progress,
      isActive: engine.isActive,
      isLocked: isLockedOnRegulation(state.phase),
      syncPreferences: state.syncPreferences,
      engage,
      release,
      reset,
    }),
    [state, engine.intensity, engine.isActive, progress, engage, release, reset],
  );

  return (
    <SurgeSessionContext.Provider value={value}>{children}</SurgeSessionContext.Provider>
  );
}

export function useSurgeSession() {
  const ctx = useContext(SurgeSessionContext);
  if (!ctx) {
    throw new Error('useSurgeSession must be used within SurgeSessionProvider');
  }
  return ctx;
}

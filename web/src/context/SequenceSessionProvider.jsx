import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useSequenceClock } from '../hooks/useSequenceClock';
import { useSequenceHaptics } from '../hooks/useSequenceHaptics';
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
import { getVariant, resolveVariantId, InteractionMode } from '../sequences';

const COMPLETION_HOLD_MS = 3200;

const SequenceSessionContext = createContext(null);

/**
 * Release 1.33 session provider — variant-aware clock, sovereignty-preserving pause.
 */
export function SequenceSessionProvider({ children, initialVariantId = null }) {
  const [state, dispatch] = useReducer(surgeSessionReducer, undefined, () => {
    const base = createInitialSessionState();
    if (initialVariantId) {
      const variant = getVariant(initialVariantId);
      return {
        ...base,
        variantId: variant.id,
        durationSeconds: variant.durationSeconds,
      };
    }
    return base;
  });

  const variant = useMemo(
    () => getVariant(state.variantId ?? initialVariantId),
    [state.variantId, initialVariantId],
  );

  const [isEngaged, setIsEngaged] = useState(false);
  const sessionStartRef = useRef(null);
  const completionTimerRef = useRef(null);
  const brainDumpSeedRef = useRef(null);
  const haptics = useSequenceHaptics();

  const clock = useSequenceClock({
    durationSeconds: variant.durationSeconds,
    interactionMode: variant.interactionMode,
    isEngaged,
    enabled: state.phase === SurgePhase.REGULATION,
  });

  const selectVariant = useCallback((variantId) => {
    const v = getVariant(variantId);
    dispatch({
      type: SurgeEvent.SELECT_VARIANT,
      payload: { variantId: v.id, durationSeconds: v.durationSeconds },
    });
  }, []);

  const beginRegulation = useCallback(() => {
    if (state.phase !== SurgePhase.ENTRY && state.phase !== SurgePhase.PAUSED) return;

    sessionStartRef.current = performance.now();
    dispatch({
      type: SurgeEvent.ENGAGE,
      payload: {
        sessionId: crypto.randomUUID(),
        startedAt: Date.now(),
        variantId: variant.id,
        durationSeconds: variant.durationSeconds,
      },
    });
  }, [state.phase, variant]);

  const engageHold = useCallback(() => {
    if (state.phase === SurgePhase.ENTRY) beginRegulation();
    else if (state.phase === SurgePhase.PAUSED) {
      dispatch({ type: SurgeEvent.RESUME });
    }
    setIsEngaged(true);
  }, [beginRegulation, state.phase]);

  const releaseHold = useCallback(() => {
    if (variant.interactionMode !== InteractionMode.HOLD) return;
    if (state.phase !== SurgePhase.REGULATION) return;
    setIsEngaged(false);
    dispatch({ type: SurgeEvent.RELEASE });
  }, [state.phase, variant.interactionMode]);

  const reset = useCallback(() => {
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
    sessionStartRef.current = null;
    setIsEngaged(false);
    clock.reset();
    dispatch({ type: SurgeEvent.RESET });
  }, [clock]);

  const enterDecompression = useCallback((brainDumpText) => {
    brainDumpSeedRef.current = brainDumpText?.trim() || null;
    dispatch({ type: SurgeEvent.ENTER_DECOMPRESSION });
  }, []);

  const exitDecompression = useCallback(() => {
    dispatch({ type: SurgeEvent.EXIT_DECOMPRESSION });
  }, []);

  const consumeBrainDumpSeed = useCallback(() => {
    const seed = brainDumpSeedRef.current;
    brainDumpSeedRef.current = null;
    return seed;
  }, []);

  // Sequence completion → telemetry → aftermath bridge
  useEffect(() => {
    if (!clock.isComplete || state.phase !== SurgePhase.REGULATION) return;

    haptics.sequenceComplete();

    const elapsed = sessionStartRef.current
      ? Math.round((performance.now() - sessionStartRef.current) / 1000)
      : variant.durationSeconds;

    const payload = {
      ...buildSessionPayload(Math.max(1, elapsed), true, state.sessionId),
      variantId: variant.id,
    };
    cacheSessionPayload(payload);
    submitSessionTelemetry(payload);

    dispatch({
      type: SurgeEvent.CYCLE_COMPLETE,
      payload: {
        completedAt: Date.now(),
        durationSeconds: Math.max(1, elapsed),
      },
    });

    completionTimerRef.current = setTimeout(() => {
      dispatch({ type: SurgeEvent.ENTER_AFTERMATH });
    }, COMPLETION_HOLD_MS);

    return () => {
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
    };
  }, [clock.isComplete, state.phase, state.sessionId, variant, haptics]);

  const value = useMemo(
    () => ({
      phase: state.phase,
      sessionId: state.sessionId,
      variantId: variant.id,
      variant,
      durationSeconds: state.durationSeconds || variant.durationSeconds,
      progress: clock.progress,
      elapsedSeconds: clock.elapsedSeconds,
      isEngaged,
      isActive: clock.isRunning,
      isLocked: isLockedOnRegulation(state.phase),
      clock,
      haptics,
      selectVariant,
      beginRegulation,
      engageHold,
      releaseHold,
      reset,
      enterDecompression,
      exitDecompression,
      consumeBrainDumpSeed,
    }),
    [
      state,
      variant,
      clock,
      isEngaged,
      haptics,
      selectVariant,
      beginRegulation,
      engageHold,
      releaseHold,
      reset,
      enterDecompression,
      exitDecompression,
      consumeBrainDumpSeed,
    ],
  );

  return (
    <SequenceSessionContext.Provider value={value}>{children}</SequenceSessionContext.Provider>
  );
}

export function useSequenceSession() {
  const ctx = useContext(SequenceSessionContext);
  if (!ctx) {
    throw new Error('useSequenceSession must be used within SequenceSessionProvider');
  }
  return ctx;
}

/** @deprecated alias for gradual migration */
export const useSurgeSession = useSequenceSession;

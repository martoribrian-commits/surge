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
import { recordRecoveryHistory } from '../lib/recoveryHistoryStore';
import { getVariant, resolveVariantId, InteractionMode, isCustomVariantId, DEFAULT_VARIANT_ID } from '../sequences';
import {
  buildCustomVariant,
  clearPersistedCustomVariant,
  loadPersistedCustomVariant,
  persistCustomVariant,
} from '../sequences/customSequence';
import { unlockAudioContext } from '../lib/proceduralAudio/shared';

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

  const [customVariant, setCustomVariant] = useState(() => loadPersistedCustomVariant());

  const variant = useMemo(() => {
    if (customVariant) return customVariant;
    if (isCustomVariantId(state.variantId)) {
      const persisted = loadPersistedCustomVariant();
      if (persisted) return persisted;
    }
    return getVariant(state.variantId ?? initialVariantId);
  }, [customVariant, state.variantId, initialVariantId]);

  const [isEngaged, setIsEngaged] = useState(false);
  const sessionStartRef = useRef(null);
  const completionTimerRef = useRef(null);
  const completionHandledRef = useRef(false);
  const brainDumpSeedRef = useRef(null);
  const haptics = useSequenceHaptics();

  const clock = useSequenceClock({
    durationSeconds: variant.durationSeconds,
    interactionMode: variant.interactionMode,
    isEngaged,
    enabled: state.phase === SurgePhase.REGULATION,
  });

  const selectVariant = useCallback((variantId) => {
    setCustomVariant(null);
    clearPersistedCustomVariant();
    const v = getVariant(variantId);
    dispatch({
      type: SurgeEvent.SELECT_VARIANT,
      payload: { variantId: v.id, durationSeconds: v.durationSeconds },
    });
  }, []);

  const applyCustomSequence = useCallback((spec) => {
    const built = buildCustomVariant(spec);
    setCustomVariant(built);
    persistCustomVariant(built);
    completionHandledRef.current = false;
    clock.reset();
    dispatch({
      type: SurgeEvent.SELECT_VARIANT,
      payload: { variantId: built.id, durationSeconds: built.durationSeconds },
    });
  }, [clock]);

  const clearCustomSequence = useCallback(() => {
    setCustomVariant(null);
    clearPersistedCustomVariant();
    const fallback = getVariant(DEFAULT_VARIANT_ID);
    dispatch({
      type: SurgeEvent.SELECT_VARIANT,
      payload: { variantId: fallback.id, durationSeconds: fallback.durationSeconds },
    });
  }, []);

  const beginRegulation = useCallback(() => {
    if (state.phase !== SurgePhase.ENTRY && state.phase !== SurgePhase.PAUSED) return;

    unlockAudioContext();

    if (state.phase === SurgePhase.ENTRY) {
      completionHandledRef.current = false;
      clock.reset();
    }

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
  }, [state.phase, variant, clock]);

  const engageHold = useCallback(() => {
    unlockAudioContext();
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
    haptics.killAll();
    dispatch({ type: SurgeEvent.RELEASE });
  }, [state.phase, variant.interactionMode, haptics]);

  const reset = useCallback((options = {}) => {
    const { recordInterrupted = false } = options;

    if (
      recordInterrupted &&
      state.sessionId &&
      (state.phase === SurgePhase.REGULATION || state.phase === SurgePhase.PAUSED)
    ) {
      const elapsed = sessionStartRef.current
        ? Math.max(1, Math.round((performance.now() - sessionStartRef.current) / 1000))
        : Math.max(1, clock.elapsedSeconds ?? 1);

      const payload = buildSessionPayload(elapsed, false, state.sessionId, variant.id);
      cacheSessionPayload(payload);
      submitSessionTelemetry(payload);

      const hadClinicalToken = (() => {
        try {
          return Boolean(localStorage.getItem('surge.clinicalToken'));
        } catch {
          return false;
        }
      })();

      recordRecoveryHistory({
        sessionId: state.sessionId,
        variantId: variant.id,
        variantLabel: variant.name ?? null,
        durationSeconds: elapsed,
        completionState: 'interrupted',
        hadClinicalToken,
      });
    }

    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
    completionHandledRef.current = false;
    sessionStartRef.current = null;
    setIsEngaged(false);
    haptics.killAll();
    clock.reset();
    setCustomVariant(null);
    clearPersistedCustomVariant();
    dispatch({ type: SurgeEvent.RESET });
  }, [clock, haptics, state.sessionId, state.phase, variant]);

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

  // Sequence completion → telemetry → COMPLETING overlay
  useEffect(() => {
    if (!clock.isComplete || state.phase !== SurgePhase.REGULATION || completionHandledRef.current) {
      return;
    }
    completionHandledRef.current = true;

    setIsEngaged(false);
    haptics.sequenceComplete();

    const elapsed = sessionStartRef.current
      ? Math.round((performance.now() - sessionStartRef.current) / 1000)
      : variant.durationSeconds;

    const payload = buildSessionPayload(
      Math.max(1, elapsed),
      true,
      state.sessionId,
      variant.id,
    );
    cacheSessionPayload(payload);
    submitSessionTelemetry(payload);

    const hadClinicalToken = (() => {
      try {
        return Boolean(localStorage.getItem('surge.clinicalToken'));
      } catch {
        return false;
      }
    })();

    recordRecoveryHistory({
      sessionId: state.sessionId,
      variantId: variant.id,
      variantLabel: variant.name ?? null,
      durationSeconds: Math.max(1, elapsed),
      completionState: 'complete',
      hadClinicalToken,
    });

    dispatch({
      type: SurgeEvent.CYCLE_COMPLETE,
      payload: {
        completedAt: Date.now(),
        durationSeconds: Math.max(1, elapsed),
      },
    });
  }, [clock.isComplete, state.phase, state.sessionId, variant, haptics]);

  // COMPLETING hold → post-sequence dashboard (AftermathView)
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
      applyCustomSequence,
      clearCustomSequence,
      isCustomSequence: Boolean(customVariant),
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
      customVariant,
      clock,
      isEngaged,
      haptics,
      selectVariant,
      applyCustomSequence,
      clearCustomSequence,
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

export function useSequenceSessionOptional() {
  return useContext(SequenceSessionContext);
}

/** @deprecated alias for gradual migration */
export const useSurgeSession = useSequenceSession;

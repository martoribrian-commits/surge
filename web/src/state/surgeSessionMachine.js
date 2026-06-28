/**
 * Surge session state machine — Entry → Regulation → Aftermath
 *
 * Pure transitions; side effects (audio, telemetry) live in SurgeSessionProvider.
 */

export const SurgePhase = {
  ENTRY: 'entry',
  REGULATION: 'regulation',
  PAUSED: 'paused',
  COMPLETING: 'completing',
  AFTERMATH: 'aftermath',
};

export const SurgeEvent = {
  SELECT_VARIANT: 'SELECT_VARIANT',
  ENGAGE: 'ENGAGE',
  RELEASE: 'RELEASE',
  RESUME: 'RESUME',
  CYCLE_COMPLETE: 'CYCLE_COMPLETE',
  ENTER_AFTERMATH: 'ENTER_AFTERMATH',
  RESET: 'RESET',
};

export function createInitialSessionState() {
  return {
    phase: SurgePhase.ENTRY,
    sessionId: null,
    startedAt: null,
    completedAt: null,
    durationSeconds: 90,
    variantId: null,
    /** Reserved for future Supabase opt-in sync */
    syncPreferences: {
      cloudEnabled: false,
    },
  };
}

/**
 * @param {ReturnType<typeof createInitialSessionState>} state
 * @param {{ type: string, payload?: Record<string, unknown> }} event
 */
export function surgeSessionReducer(state, event) {
  switch (event.type) {
    case SurgeEvent.SELECT_VARIANT:
      if (state.phase !== SurgePhase.ENTRY) return state;
      return {
        ...state,
        variantId: event.payload?.variantId ?? state.variantId,
        durationSeconds: event.payload?.durationSeconds ?? state.durationSeconds,
      };

    case SurgeEvent.ENGAGE:
      if (state.phase !== SurgePhase.ENTRY && state.phase !== SurgePhase.PAUSED) return state;
      if (state.phase === SurgePhase.ENTRY) {
        return {
          ...state,
          phase: SurgePhase.REGULATION,
          sessionId: event.payload?.sessionId ?? crypto.randomUUID(),
          startedAt: event.payload?.startedAt ?? Date.now(),
          variantId: event.payload?.variantId ?? state.variantId,
          durationSeconds: event.payload?.durationSeconds ?? state.durationSeconds,
        };
      }
      return { ...state, phase: SurgePhase.REGULATION };

    case SurgeEvent.RELEASE:
      if (state.phase !== SurgePhase.REGULATION) return state;
      return { ...state, phase: SurgePhase.PAUSED };

    case SurgeEvent.RESUME:
      if (state.phase !== SurgePhase.PAUSED) return state;
      return { ...state, phase: SurgePhase.REGULATION };

    case SurgeEvent.CYCLE_COMPLETE:
      if (state.phase !== SurgePhase.REGULATION && state.phase !== SurgePhase.PAUSED) {
        return state;
      }
      return {
        ...state,
        phase: SurgePhase.COMPLETING,
        completedAt: event.payload?.completedAt ?? Date.now(),
        durationSeconds: event.payload?.durationSeconds ?? 90,
      };

    case SurgeEvent.ENTER_AFTERMATH:
      if (state.phase !== SurgePhase.COMPLETING) return state;
      return { ...state, phase: SurgePhase.AFTERMATH };

    case SurgeEvent.RESET:
      return createInitialSessionState();

    default:
      return state;
  }
}

/** @param {string} phase */
export function isLockedOnRegulation(phase) {
  return (
    phase === SurgePhase.REGULATION ||
    phase === SurgePhase.PAUSED ||
    phase === SurgePhase.COMPLETING
  );
}

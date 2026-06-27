/**
 * Surge session state machine — Entry → Regulation → Aftermath
 */
(function (global) {
  var Phase = {
    ENTRY: 'entry',
    REGULATION: 'regulation',
    PAUSED: 'paused',
    COMPLETING: 'completing',
    AFTERMATH: 'aftermath',
  };

  var Event = {
    ENGAGE: 'ENGAGE',
    RELEASE: 'RELEASE',
    RESUME: 'RESUME',
    CYCLE_COMPLETE: 'CYCLE_COMPLETE',
    ENTER_AFTERMATH: 'ENTER_AFTERMATH',
    RESET: 'RESET',
  };

  function createInitialState() {
    return {
      phase: Phase.ENTRY,
      sessionId: null,
      startedAt: null,
      completedAt: null,
      durationSeconds: 0,
    };
  }

  function reducer(state, event) {
    switch (event.type) {
      case Event.ENGAGE:
        if (state.phase !== Phase.ENTRY) return state;
        return {
          phase: Phase.REGULATION,
          sessionId: event.payload.sessionId,
          startedAt: event.payload.startedAt,
          completedAt: null,
          durationSeconds: 0,
        };

      case Event.RELEASE:
        if (state.phase !== Phase.REGULATION) return state;
        return Object.assign({}, state, { phase: Phase.PAUSED });

      case Event.RESUME:
        if (state.phase !== Phase.PAUSED) return state;
        return Object.assign({}, state, { phase: Phase.REGULATION });

      case Event.CYCLE_COMPLETE:
        if (state.phase !== Phase.REGULATION && state.phase !== Phase.PAUSED) return state;
        return Object.assign({}, state, {
          phase: Phase.COMPLETING,
          completedAt: event.payload.completedAt,
          durationSeconds: event.payload.durationSeconds,
        });

      case Event.ENTER_AFTERMATH:
        if (state.phase !== Phase.COMPLETING) return state;
        return Object.assign({}, state, { phase: Phase.AFTERMATH });

      case Event.RESET:
        return createInitialState();

      default:
        return state;
    }
  }

  function createSession() {
    var state = createInitialState();
    var listeners = [];

    function notify() {
      listeners.forEach(function (fn) {
        fn(state);
      });
    }

    return {
      Phase: Phase,
      Event: Event,
      getState: function () {
        return state;
      },
      subscribe: function (fn) {
        listeners.push(fn);
        return function () {
          listeners = listeners.filter(function (l) {
            return l !== fn;
          });
        };
      },
      dispatch: function (event) {
        state = reducer(state, event);
        notify();
      },
      reset: function () {
        state = createInitialState();
        notify();
      },
    };
  }

  global.SurgeSession = {
    Phase: Phase,
    Event: Event,
    create: createSession,
  };
})(typeof window !== 'undefined' ? window : globalThis);

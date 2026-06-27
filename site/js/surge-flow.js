/**
 * MVP user journey — Entry → Regulation → Aftermath (production root at /).
 */
(function () {
  var Phase = SurgeSession.Phase;
  var Event = SurgeSession.Event;

  var surgeView = document.getElementById('surge-view');
  var aftermathView = document.getElementById('aftermath-view');
  var durationEl = document.getElementById('aftermath-duration');
  var brainDumpEl = document.getElementById('brain-dump-input');
  var resetBtn = document.getElementById('aftermath-reset');
  var craneBtn = document.getElementById('crane-handoff-btn');

  if (!surgeView || !aftermathView) return;

  var session = SurgeSession.create();
  var engine = createSurgeEngine({
    screen: surgeView,
    canvas: document.getElementById('engine-canvas'),
    fogEl: document.getElementById('engine-fog'),
    copyEl: document.getElementById('engine-copy'),
    anchorEl: document.getElementById('tactile-anchor'),
    onMotorComplete: function (result) {
      session.dispatch({
        type: Event.CYCLE_COMPLETE,
        payload: {
          completedAt: Date.now(),
          durationSeconds: result.durationSeconds,
        },
      });
      window.setTimeout(function () {
        session.dispatch({ type: Event.ENTER_AFTERMATH });
      }, 200);
    },
  });

  if (!engine) return;

  function showView(phase) {
    var inAftermath = phase === Phase.AFTERMATH;
    surgeView.hidden = inAftermath;
    aftermathView.hidden = !inAftermath;
    document.body.classList.toggle('aftermath-active', inAftermath);
    if (inAftermath) {
      window.scrollTo(0, 0);
    }
  }

  function bindEphemeral(sessionId) {
    if (!brainDumpEl || !sessionId) return;
    brainDumpEl.value = EphemeralStore.load(sessionId);
    brainDumpEl.oninput = function () {
      EphemeralStore.save(sessionId, brainDumpEl.value);
    };
  }

  session.subscribe(function (state) {
    showView(state.phase);

    if (state.phase === Phase.AFTERMATH) {
      if (durationEl) {
        durationEl.textContent = String(state.durationSeconds);
      }
      bindEphemeral(state.sessionId);
    }
  });

  function engage() {
    var state = session.getState();
    if (state.phase === Phase.ENTRY) {
      var id = crypto.randomUUID();
      session.dispatch({
        type: Event.ENGAGE,
        payload: { sessionId: id, startedAt: Date.now() },
      });
      engine.engage(id);
    } else if (state.phase === Phase.PAUSED) {
      session.dispatch({ type: Event.RESUME });
      engine.engage(state.sessionId);
    }
  }

  function release() {
    var state = session.getState();
    if (state.phase === Phase.REGULATION) {
      session.dispatch({ type: Event.RELEASE });
      engine.release();
    }
  }

  surgeView.addEventListener('pointerdown', function (e) {
    var state = session.getState();
    if (state.phase === Phase.COMPLETING || state.phase === Phase.AFTERMATH) return;
    if (!engine.onPointerDown(e)) return;
    engage();
  });

  surgeView.addEventListener('pointerup', function () {
    engine.onPointerUp();
    release();
  });

  surgeView.addEventListener('pointerleave', function () {
    engine.onPointerUp();
    release();
  });

  surgeView.addEventListener('pointercancel', function () {
    engine.onPointerUp();
    release();
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      session.reset();
      engine.reset();
    });
  }

  if (craneBtn) {
    craneBtn.addEventListener('click', function () {
      var state = session.getState();
      var note = brainDumpEl ? brainDumpEl.value.trim() : '';
      try {
        sessionStorage.setItem(
          'surge.craneHandoff',
          JSON.stringify({
            sessionId: state.sessionId,
            brainDump: note || undefined,
          }),
        );
      } catch {
        /* ignore */
      }
      window.location.href = 'crane.html';
    });
  }

  showView(Phase.ENTRY);
})();

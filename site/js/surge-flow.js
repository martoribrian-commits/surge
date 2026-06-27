/**
 * MVP user journey at /engine — Entry → Regulation → Aftermath.
 */
(function () {
  var Phase = SurgeSession.Phase;
  var Event = SurgeSession.Event;
  var HANDOFF_KEY = 'surge.craneHandoff';
  var BRIDGE_MS = 1400;

  var surgeView = document.getElementById('surge-view');
  var aftermathView = document.getElementById('aftermath-view');
  var durationEl = document.getElementById('aftermath-duration');
  var brainDumpEl = document.getElementById('brain-dump-input');
  var resetBtn = document.getElementById('aftermath-reset');
  var craneBtn = document.getElementById('crane-handoff-btn');
  var recoveryPromptEl = document.getElementById('recovery-prompt');
  var environmentListEl = document.getElementById('recovery-environment-list');
  var ritualsListEl = document.getElementById('recovery-rituals-list');
  var anchorForm = document.getElementById('engine-anchor-form');
  var anchorWordInput = document.getElementById('engine-anchor-word');
  var anchorStatusEl = document.getElementById('engine-anchor-status');

  if (!surgeView || !aftermathView) return;

  document.body.classList.add('engine-active');

  var session = SurgeSession.create();
  var bridgeTimer = null;

  var engine = createSurgeEngine({
    screen: surgeView,
    canvas: document.getElementById('engine-canvas'),
    fogEl: document.getElementById('engine-fog'),
    copyEl: document.getElementById('engine-copy'),
    phaseLabelEl: document.getElementById('engine-phase-label'),
    scienceLineEl: document.getElementById('engine-science-line'),
    progressFillEl: document.getElementById('engine-progress-fill'),
    anchorDisplayEl: document.getElementById('engine-anchor-display'),
    breathCueEl: document.getElementById('engine-breath-cue'),
    entryPanelEl: document.getElementById('engine-entry-panel'),
    onMotorComplete: function (result) {
      session.dispatch({
        type: Event.CYCLE_COMPLETE,
        payload: {
          completedAt: Date.now(),
          durationSeconds: result.durationSeconds,
        },
      });
      persistHandoff(result.sessionId, result.durationSeconds, 'complete');
      window.setTimeout(function () {
        session.dispatch({ type: Event.ENTER_AFTERMATH });
      }, 400);
    },
  });

  if (!engine) return;

  function readSessionRecord() {
    try {
      return JSON.parse(sessionStorage.getItem('surge.session'));
    } catch {
      return null;
    }
  }

  function persistHandoff(sessionId, durationSeconds, completionState) {
    var note = brainDumpEl ? brainDumpEl.value.trim() : '';
    try {
      sessionStorage.setItem(
        HANDOFF_KEY,
        JSON.stringify({
          sessionId: sessionId,
          durationSeconds: durationSeconds,
          completionState: completionState || 'complete',
          brainDump: note || undefined,
        }),
      );
    } catch {
      /* private browsing */
    }
  }

  function transitionToAftermath() {
    if (bridgeTimer) clearTimeout(bridgeTimer);

    aftermathView.hidden = false;
    document.body.classList.add('flow-bridge-active');
    document.body.classList.remove('aftermath-active');

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.body.classList.add('flow-bridge-complete');
      });
    });

    bridgeTimer = window.setTimeout(function () {
      surgeView.hidden = true;
      document.body.classList.remove('flow-bridge-active', 'flow-bridge-complete', 'engine-active');
      document.body.classList.add('aftermath-active');
      window.scrollTo(0, 0);
    }, BRIDGE_MS);
  }

  function showEntry() {
    if (bridgeTimer) {
      clearTimeout(bridgeTimer);
      bridgeTimer = null;
    }
    document.body.classList.add('engine-active');
    document.body.classList.remove('flow-bridge-active', 'flow-bridge-complete', 'aftermath-active');
    surgeView.hidden = false;
    aftermathView.hidden = true;
  }

  function bindEphemeral(sessionId) {
    if (!brainDumpEl || !sessionId) return;
    brainDumpEl.value = EphemeralStore.load(sessionId);
    brainDumpEl.oninput = function () {
      EphemeralStore.save(sessionId, brainDumpEl.value);
      var state = session.getState();
      persistHandoff(state.sessionId, state.durationSeconds, 'complete');
    };
  }

  function applyRecoveryPrompts(state) {
    if (typeof RecoveryPrompts === 'undefined') return;
    var record = readSessionRecord();
    RecoveryPrompts.applyRecoveryPrompts({
      introEl: recoveryPromptEl,
      environmentListEl: environmentListEl,
      ritualsListEl: ritualsListEl,
      durationSeconds: state.durationSeconds,
      completionState: record ? record.completionState : 'complete',
      completedAt: state.completedAt || Date.now(),
    });
  }

  session.subscribe(function (state) {
    if (state.phase === Phase.AFTERMATH) {
      if (durationEl) durationEl.textContent = String(state.durationSeconds);
      applyRecoveryPrompts(state);
      bindEphemeral(state.sessionId);
      if (!surgeView.hidden && !document.body.classList.contains('flow-bridge-active')) {
        transitionToAftermath();
      } else if (surgeView.hidden) {
        document.body.classList.add('aftermath-active');
      }
      return;
    }

    if (state.phase === Phase.ENTRY) {
      showEntry();
      return;
    }

    if (state.phase === Phase.COMPLETING) {
      document.body.classList.remove('aftermath-active');
      document.body.classList.add('engine-active');
      surgeView.hidden = false;
      aftermathView.hidden = true;
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
      var record = readSessionRecord();
      if (record) {
        persistHandoff(record.sessionId, record.duration || 0, record.completionState || 'interrupted');
      }
    }
  }

  function bindPointer(el, type, handler) {
    el.addEventListener(type, handler, { passive: false });
  }

  bindPointer(surgeView, 'pointerdown', function (e) {
    var state = session.getState();
    if (state.phase === Phase.COMPLETING || state.phase === Phase.AFTERMATH) return;
    if (!engine.onPointerDown(e)) return;
    engage();
  });

  bindPointer(surgeView, 'pointerup', function () {
    engine.onPointerUp();
    release();
  });

  bindPointer(surgeView, 'pointercancel', function () {
    engine.onPointerUp();
    release();
  });

  bindPointer(surgeView, 'contextmenu', function (e) {
    e.preventDefault();
  });

  if (anchorForm && typeof EngineAnchor !== 'undefined') {
    anchorForm.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var word = anchorWordInput ? anchorWordInput.value : '';
      if (anchorStatusEl) {
        anchorStatusEl.hidden = false;
        anchorStatusEl.textContent = 'Calibrating anchor...';
      }
      EngineAnchor.fetchAnchor(word).then(function (data) {
        engine.setAnchor(data);
        if (anchorStatusEl) {
          anchorStatusEl.textContent = data.anchor + (data.source === 'ai' ? '' : '');
        }
        if (anchorWordInput) anchorWordInput.blur();
      });
    });

    anchorWordInput.addEventListener('pointerdown', function (e) {
      e.stopPropagation();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      session.reset();
      engine.reset();
    });
  }

  if (craneBtn) {
    craneBtn.addEventListener('click', function () {
      var state = session.getState();
      persistHandoff(state.sessionId, state.durationSeconds, 'complete');
      window.location.href = 'crane.html';
    });
  }

  showEntry();
})();

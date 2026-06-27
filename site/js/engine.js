/**
 * Surge somatic engine — press and hold, 90-second sensory decay.
 */
(function (global) {
  var STORAGE_KEY = 'surge.session';
  var MAX_PULSE_HZ = 1.0;
  var MIN_PULSE_HZ = 0.5;
  var COMPLETION_HOLD_MS = 3200;
  var HOLD_THRESHOLD_MS = 90;
  var RELEASE_GRACE_MS = 240;

  function createSurgeEngine(options) {
    var screen = options.screen;
    var canvas = options.canvas;
    var fogEl = options.fogEl;
    var hudEl = options.hudEl;
    var copyEl = options.copyEl;
    var phaseLabelEl = options.phaseLabelEl;
    var scienceLineEl = options.scienceLineEl;
    var timeEl = options.timeEl;
    var breathPhaseEl = options.breathPhaseEl;
    var progressFillEl = options.progressFillEl;
    var anchorDisplayEl = options.anchorDisplayEl;
    var breathCueEl = options.breathCueEl;
    var entryPanelEl = options.entryPanelEl;
    var onHoldReady = options.onHoldReady || function () {};
    var onHoldLost = options.onHoldLost || function () {};
    var onMotorComplete = options.onMotorComplete || function () {};

    if (!screen || !canvas) return null;

    var ctx = canvas.getContext('2d');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var audio = new SurgeAudio();
    var haptics = new SurgeHaptics();

    var motorPhase = 'idle';
    var rafId = null;
    var startMs = null;
    var pausedElapsed = 0;
    var sessionId = null;
    var pointerDown = false;
    var isHolding = false;
    var holdTimer = null;
    var releaseTimer = null;
    var clockStart = performance.now() / 1000;
    var rings = [];
    var ripples = [];
    var lastRingBeat = -1;
    var completeFade = 0;
    var copyPhase = null;
    var cachedAnchor = typeof EngineAnchor !== 'undefined' ? EngineAnchor.getCached() : null;

    var COPY_BY_PHASE = {
      chaos: 'Hold through the peak.',
      mid: 'The field is settling.',
      heartbeat: 'One pulse at a time.',
    };

    function writeSession(completionState, duration) {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            sessionId: sessionId,
            duration: duration,
            completionState: completionState,
            timestamp: new Date().toISOString(),
          }),
        );
      } catch {
        /* private browsing */
      }
    }

    function elapsedMs() {
      if (motorPhase === 'active' && startMs !== null) {
        return pausedElapsed + (performance.now() - startMs);
      }
      return pausedElapsed;
    }

    function curveState() {
      return SurgeCurve.curveAt(elapsedMs());
    }

    function visualPhase() {
      if (motorPhase === 'idle') return 'idle';
      if (motorPhase === 'interrupted') return 'interrupted';
      if (motorPhase === 'holding') return 'holding';
      return 'active';
    }

    function viewportSize() {
      var vv = window.visualViewport;
      return {
        width: vv ? vv.width : window.innerWidth,
        height: vv ? vv.height : window.innerHeight,
      };
    }

    function resizeCanvas() {
      var size = viewportSize();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(size.width * dpr);
      canvas.height = Math.floor(size.height * dpr);
      canvas.style.width = size.width + 'px';
      canvas.style.height = size.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function clearHoldTimer() {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    }

    function clearReleaseTimer() {
      if (releaseTimer) {
        clearTimeout(releaseTimer);
        releaseTimer = null;
      }
    }

    function addRipple(x, y) {
      ripples.push({ x: x, y: y, born: performance.now() / 1000 });
      if (ripples.length > 8) ripples.shift();
    }

    function pruneRipples(nowSec) {
      ripples = ripples.filter(function (r) {
        return nowSec - r.born < 1.8;
      });
    }

    function updateFog(intensity, chaos) {
      if (!fogEl) return;
      var show = motorPhase === 'active' && intensity > 0.05;
      fogEl.hidden = !show;
      if (!show) return;
      var pulseHz = MIN_PULSE_HZ + intensity * (MAX_PULSE_HZ - MIN_PULSE_HZ);
      fogEl.style.setProperty('--fog-blur', 8 + intensity * 28 + 'px');
      fogEl.style.setProperty('--inner-glow', String(0.06 + intensity * 0.28));
      fogEl.style.setProperty('--outer-amber', String(0.04 + intensity * 0.18));
      fogEl.style.setProperty('--deep-core', String(0.02 + intensity * 0.12));
      fogEl.style.setProperty('--pulse-duration', 1 / pulseHz + 's');
    }

    function updateHud(state) {
      var elapsed = elapsedMs();
      var remaining = SurgeCurve.timeRemainingMs(elapsed);

      if (progressFillEl) {
        var pct = motorPhase === 'idle' ? 0 : Math.round(state.progress * 100);
        progressFillEl.style.width = pct + '%';
      }

      if (timeEl) {
        if (motorPhase === 'active') {
          timeEl.textContent = SurgeCurve.formatClock(remaining);
          timeEl.hidden = false;
        } else if (motorPhase === 'interrupted') {
          timeEl.textContent = SurgeCurve.formatClock(SurgeCurve.DURATION_MS - pausedElapsed);
          timeEl.hidden = false;
        } else {
          timeEl.hidden = true;
        }
      }

      if (hudEl) {
        hudEl.classList.toggle('engine-hud-focus', motorPhase === 'active' && state.chaos > 0.45);
        hudEl.classList.toggle('engine-hud-live', motorPhase === 'active' || motorPhase === 'interrupted');
      }

      if (motorPhase === 'idle') {
        if (phaseLabelEl) phaseLabelEl.textContent = 'Ready';
        if (scienceLineEl) scienceLineEl.textContent = '90-second vagal downshift';
        if (entryPanelEl) entryPanelEl.hidden = false;
        if (anchorDisplayEl) anchorDisplayEl.hidden = true;
        if (breathCueEl) breathCueEl.hidden = true;
        if (breathPhaseEl) breathPhaseEl.hidden = true;
        return;
      }

      if (entryPanelEl) entryPanelEl.hidden = true;

      if (motorPhase === 'interrupted') {
        if (phaseLabelEl) phaseLabelEl.textContent = 'Paused';
        if (scienceLineEl) {
          scienceLineEl.textContent =
            'Progress saved · ' + Math.round(state.progress * 100) + '% · hold to resume';
        }
        if (breathPhaseEl) breathPhaseEl.hidden = true;
        return;
      }

      if (motorPhase === 'holding') {
        if (phaseLabelEl) phaseLabelEl.textContent = 'Complete';
        if (scienceLineEl) scienceLineEl.textContent = 'You can release';
        if (breathPhaseEl) breathPhaseEl.hidden = true;
        return;
      }

      var phase = SurgeCurve.phaseAt(state);
      if (phaseLabelEl) phaseLabelEl.textContent = phase.label;
      if (scienceLineEl) scienceLineEl.textContent = phase.science;

      if (breathPhaseEl && state.heartbeat > 0.4) {
        breathPhaseEl.textContent = SurgeCurve.breathLabel(elapsed / 1000);
        breathPhaseEl.hidden = false;
      } else if (breathPhaseEl) {
        breathPhaseEl.hidden = true;
      }

      if (cachedAnchor && cachedAnchor.anchor && anchorDisplayEl) {
        if (state.heartbeat > 0.25 || state.progress > 0.4) {
          anchorDisplayEl.textContent = cachedAnchor.anchor;
          anchorDisplayEl.hidden = false;
        } else {
          anchorDisplayEl.hidden = true;
        }
      }

      if (cachedAnchor && cachedAnchor.breathCue && breathCueEl) {
        if (state.heartbeat > 0.45) {
          breathCueEl.textContent = cachedAnchor.breathCue;
          breathCueEl.hidden = false;
        } else {
          breathCueEl.hidden = true;
        }
      }
    }

    function updateCopy(state, overrideText) {
      if (!copyEl) return;
      var text = overrideText;
      if (!text) {
        if (motorPhase === 'idle') {
          copyPhase = null;
          text = isHolding ? 'Keep holding...' : 'Press and hold.';
        } else if (motorPhase === 'interrupted') {
          copyPhase = null;
          text = isHolding ? 'Resuming...' : 'Hold to resume.';
        } else if (motorPhase === 'holding') {
          copyPhase = null;
          text = 'The system has reset.';
        } else {
          var pid = SurgeCurve.phaseAt(state).id;
          if (pid !== copyPhase) copyPhase = pid;
          text = COPY_BY_PHASE[copyPhase] || 'The system is resetting.';
        }
      }
      copyEl.textContent = text;
      if (motorPhase === 'active') {
        var opacity = Math.min(1, state.value / 0.5);
        copyEl.style.opacity = String(Math.max(0.25, opacity));
      } else {
        copyEl.style.opacity = '1';
      }
    }

    function pruneRings(nowSec) {
      rings = rings.filter(function (r) {
        return nowSec - r.born < 2.6;
      });
    }

    function maybeSpawnRing(nowSec, heartbeat) {
      var beatIndex = Math.floor(nowSec * SurgeCurve.HEARTBEAT_HZ);
      if (beatIndex !== lastRingBeat && heartbeat > 0.08) {
        lastRingBeat = beatIndex;
        rings.push({ born: nowSec, strength: 0.35 + heartbeat * 0.65 });
      }
    }

    function renderFrame() {
      var nowSec = performance.now() / 1000;
      var elapsed = elapsedMs();
      var state = motorPhase === 'idle' ? SurgeCurve.curveAt(0) : SurgeCurve.curveAt(elapsed);
      var size = viewportSize();

      if (motorPhase === 'active') {
        maybeSpawnRing(nowSec, state.heartbeat);
        audio.sync(state, elapsed);
      }
      pruneRings(nowSec);
      pruneRipples(nowSec);

      SurgeVisual.draw(ctx, {
        phase: visualPhase(),
        t: nowSec - clockStart,
        progress: state.progress,
        chaos: state.chaos,
        heartbeat: state.heartbeat,
        completeFade: completeFade,
        rings: rings,
        ripples: ripples,
        isHolding: isHolding,
        reducedMotion: reducedMotion,
        width: size.width,
        height: size.height,
      });

      if (motorPhase === 'active') {
        updateFog(state.value, state.chaos);
      }
      updateCopy(state);
      updateHud(state);
    }

    function tick() {
      if (motorPhase !== 'active') return;
      renderFrame();
      if (elapsedMs() >= SurgeCurve.DURATION_MS) {
        finishCycle();
        return;
      }
      rafId = requestAnimationFrame(tick);
    }

    function idleLoop() {
      if (motorPhase !== 'idle' && motorPhase !== 'interrupted' && motorPhase !== 'holding') return;
      renderFrame();
      rafId = requestAnimationFrame(idleLoop);
    }

    function engage(newSessionId) {
      if (motorPhase === 'active') return;

      cachedAnchor = typeof EngineAnchor !== 'undefined' ? EngineAnchor.getCached() : cachedAnchor;

      if (motorPhase === 'interrupted') {
        motorPhase = 'active';
        startMs = performance.now();
        audio.resume();
        haptics.resume();
        if (typeof EngineUtil !== 'undefined') EngineUtil.acquireWakeLock();
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(tick);
        return;
      }

      motorPhase = 'active';
      sessionId = newSessionId || crypto.randomUUID();
      startMs = performance.now();
      pausedElapsed = 0;
      lastRingBeat = -1;
      rings = [];
      completeFade = 0;
      copyPhase = null;

      audio.start(SurgeCurve.DURATION_MS);
      haptics.start(curveState);
      if (typeof EngineUtil !== 'undefined') EngineUtil.acquireWakeLock();

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }

    function release() {
      if (motorPhase !== 'active') return;
      cancelAnimationFrame(rafId);
      pausedElapsed += performance.now() - startMs;
      motorPhase = 'interrupted';
      writeSession('interrupted', Math.round(pausedElapsed / 1000));
      audio.pause();
      haptics.pause();
      if (typeof EngineUtil !== 'undefined') EngineUtil.releaseWakeLock();
      onHoldLost();
      rafId = requestAnimationFrame(idleLoop);
    }

    function finishCycle() {
      cancelAnimationFrame(rafId);
      motorPhase = 'holding';
      isHolding = false;
      pointerDown = false;
      clearHoldTimer();
      clearReleaseTimer();
      screen.classList.remove('engine-arming', 'engine-holding');

      var duration = Math.round(elapsedMs() / 1000) || 90;
      writeSession('complete', duration);
      audio.complete();
      haptics.complete();
      if (typeof EngineUtil !== 'undefined') EngineUtil.releaseWakeLock();
      if (fogEl) fogEl.hidden = true;

      completeFade = 0;
      var fadeStart = performance.now();

      function holdFade() {
        renderFrame();
        if (performance.now() - fadeStart < COMPLETION_HOLD_MS) {
          rafId = requestAnimationFrame(holdFade);
        } else {
          completeFade = 1;
          renderFrame();
          onMotorComplete({
            sessionId: sessionId,
            durationSeconds: Math.max(1, duration),
          });
        }
      }
      rafId = requestAnimationFrame(holdFade);
    }

    function reset() {
      cancelAnimationFrame(rafId);
      clearHoldTimer();
      clearReleaseTimer();
      motorPhase = 'idle';
      startMs = null;
      pausedElapsed = 0;
      sessionId = null;
      pointerDown = false;
      isHolding = false;
      rings = [];
      ripples = [];
      completeFade = 0;
      copyPhase = null;
      cachedAnchor = typeof EngineAnchor !== 'undefined' ? EngineAnchor.getCached() : cachedAnchor;
      screen.classList.remove('engine-arming', 'engine-holding');
      haptics.stop();
      audio.stop();
      if (typeof EngineUtil !== 'undefined') EngineUtil.releaseWakeLock();
      rafId = requestAnimationFrame(idleLoop);
    }

    function setAnchor(data) {
      cachedAnchor = data;
    }

    function confirmHold() {
      isHolding = true;
      screen.classList.remove('engine-arming');
      screen.classList.add('engine-holding');
      haptics.ack();
      onHoldReady();
    }

    function onPointerDown(e) {
      if (motorPhase === 'holding') return false;
      if (e.target.closest && e.target.closest('.engine-interactive')) return false;

      e.preventDefault();
      audio.prime();

      pointerDown = true;
      clearReleaseTimer();

      var coords =
        typeof EngineUtil !== 'undefined'
          ? EngineUtil.pointerCoords(e, canvas)
          : { x: e.clientX, y: e.clientY };
      addRipple(coords.x, coords.y);

      if (motorPhase === 'active') {
        isHolding = true;
        screen.classList.add('engine-holding');
        return true;
      }

      screen.classList.add('engine-arming');
      clearHoldTimer();
      holdTimer = window.setTimeout(function () {
        if (pointerDown && (motorPhase === 'idle' || motorPhase === 'interrupted')) {
          confirmHold();
        }
      }, HOLD_THRESHOLD_MS);

      return true;
    }

    function onPointerUp() {
      if (!pointerDown) return false;
      pointerDown = false;
      clearHoldTimer();
      screen.classList.remove('engine-arming');

      if (motorPhase === 'active') {
        isHolding = false;
        clearReleaseTimer();
        releaseTimer = window.setTimeout(function () {
          screen.classList.remove('engine-holding');
          release();
        }, RELEASE_GRACE_MS);
        return true;
      }

      isHolding = false;
      screen.classList.remove('engine-holding');
      return motorPhase === 'idle';
    }

    function onPointerReengage() {
      if (!pointerDown || motorPhase !== 'active') return;
      clearReleaseTimer();
      isHolding = true;
      screen.classList.add('engine-holding');
    }

    window.addEventListener('resize', resizeCanvas);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', resizeCanvas);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden' && motorPhase === 'active') {
        pointerDown = false;
        isHolding = false;
        clearHoldTimer();
        clearReleaseTimer();
        screen.classList.remove('engine-arming', 'engine-holding');
        release();
      }
      if (document.visibilityState === 'visible' && motorPhase === 'active') {
        if (typeof EngineUtil !== 'undefined') EngineUtil.acquireWakeLock();
      }
    });

    resizeCanvas();
    rafId = requestAnimationFrame(idleLoop);

    return {
      engage: engage,
      release: release,
      reset: reset,
      setAnchor: setAnchor,
      onPointerDown: onPointerDown,
      onPointerUp: onPointerUp,
      onPointerReengage: onPointerReengage,
      getMotorPhase: function () {
        return motorPhase;
      },
      getSessionId: function () {
        return sessionId;
      },
    };
  }

  global.createSurgeEngine = createSurgeEngine;
})(typeof window !== 'undefined' ? window : globalThis);

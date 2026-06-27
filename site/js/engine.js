/**
 * Surge somatic engine — press and hold, 90-second sensory decay.
 * Factory API for surge-flow.js state machine integration.
 */
(function (global) {
  var STORAGE_KEY = 'surge.session';
  var MAX_PULSE_HZ = 1.0;
  var MIN_PULSE_HZ = 0.5;
  var COMPLETION_HOLD_MS = 3200;

  function createSurgeEngine(options) {
    var screen = options.screen;
    var canvas = options.canvas;
    var fogEl = options.fogEl;
    var copyEl = options.copyEl;
    var anchorEl = options.anchorEl;
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
    var clockStart = performance.now() / 1000;
    var rings = [];
    var lastRingBeat = -1;
    var completeFade = 0;
    var sessionStartPerf = null;
    var copyPhase = null;

    var COPY_BY_PHASE = {
      chaos: 'Hold through the peak.',
      mid: 'The field is settling.',
      heartbeat: 'One pulse at a time.',
    };

    function curveCopyPhase(state) {
      if (state.chaos > 0.55) return 'chaos';
      if (state.heartbeat > 0.35 || state.progress > 0.52) return 'heartbeat';
      return 'mid';
    }

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
      return 'active';
    }

    function resizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function updateFog(intensity, chaos) {
      if (!fogEl) return;
      var show = motorPhase === 'active' && intensity > 0.05;
      fogEl.hidden = !show;
      if (!show) return;

      var pulseHz = MIN_PULSE_HZ + intensity * (MAX_PULSE_HZ - MIN_PULSE_HZ);
      var pulseDuration = 1 / pulseHz;
      fogEl.style.setProperty('--fog-blur', 8 + intensity * 28 + 'px');
      fogEl.style.setProperty('--inner-glow', String(0.06 + intensity * 0.28));
      fogEl.style.setProperty('--outer-amber', String(0.04 + intensity * 0.18));
      fogEl.style.setProperty('--deep-core', String(0.02 + intensity * 0.12));
      fogEl.style.setProperty('--pulse-duration', pulseDuration + 's');
    }

    function updateCopy(state, overrideText) {
      if (!copyEl) return;
      var text = overrideText;
      if (!text) {
        if (motorPhase === 'idle') {
          copyPhase = null;
          text = 'Press and hold.';
        } else if (motorPhase === 'interrupted') {
          copyPhase = null;
          text = 'Hold to resume.';
        } else if (motorPhase === 'holding') {
          copyPhase = null;
          text = 'The system has reset.';
        } else {
          var phase = curveCopyPhase(state);
          if (phase !== copyPhase) {
            copyPhase = phase;
          }
          text = COPY_BY_PHASE[copyPhase] || 'The system is resetting.';
        }
      }
      copyEl.textContent = text;
      if (motorPhase === 'active') {
        var opacity = Math.min(1, state.value / 0.5);
        copyEl.style.opacity = String(Math.max(0.15, opacity));
        copyEl.style.color = opacity > 0.6 ? '#ffffff' : '';
      } else {
        copyEl.style.opacity = '1';
        copyEl.style.color = motorPhase === 'holding' ? '' : '';
      }
    }

    function updateAnchor(intensity) {
      if (!anchorEl) return;
      anchorEl.hidden = motorPhase === 'holding';
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
      var state = SurgeCurve.curveAt(elapsed);

      if (motorPhase === 'active') {
        maybeSpawnRing(nowSec, state.heartbeat);
      }
      pruneRings(nowSec);

      SurgeVisual.draw(ctx, {
        phase: visualPhase(),
        t: nowSec - clockStart,
        progress: state.progress,
        chaos: state.chaos,
        heartbeat: state.heartbeat,
        completeFade: completeFade,
        rings: rings,
        reducedMotion: reducedMotion,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      if (motorPhase === 'active') {
        updateFog(state.value, state.chaos);
        updateCopy(state);
      }
      updateAnchor(state.value);
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
      if (motorPhase !== 'idle' && motorPhase !== 'interrupted') return;
      renderFrame();
      rafId = requestAnimationFrame(idleLoop);
    }

    function engage(newSessionId) {
      if (motorPhase === 'active') return;

      if (motorPhase === 'interrupted') {
        motorPhase = 'active';
        startMs = performance.now();
        copyEl.style.display = 'block';
        audio.resume();
        haptics.resume();
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(tick);
        return;
      }

      motorPhase = 'active';
      sessionId = newSessionId || crypto.randomUUID();
      sessionStartPerf = performance.now();
      startMs = sessionStartPerf;
      pausedElapsed = 0;
      lastRingBeat = -1;
      rings = [];
      completeFade = 0;
      copyPhase = null;
      copyEl.style.display = 'block';

      audio.start(SurgeCurve.DURATION_MS);
      haptics.start(curveState);

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
      updateCopy({});
      rafId = requestAnimationFrame(idleLoop);
    }

    function finishCycle() {
      cancelAnimationFrame(rafId);
      motorPhase = 'holding';
      var duration = Math.round(elapsedMs() / 1000) || 90;
      writeSession('complete', duration);
      audio.complete();
      haptics.complete();
      if (fogEl) fogEl.hidden = true;
      updateCopy({}, 'The system has reset.');

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
      motorPhase = 'idle';
      startMs = null;
      pausedElapsed = 0;
      sessionId = null;
      sessionStartPerf = null;
      rings = [];
      completeFade = 0;
      copyPhase = null;
      copyEl.style.display = 'block';
      updateCopy({});
      haptics.stop();
      audio.stop();
      rafId = requestAnimationFrame(idleLoop);
    }

    function onPointerDown(e) {
      e.preventDefault();
      if (motorPhase === 'holding') return false;
      pointerDown = true;
      return true;
    }

    function onPointerUp() {
      if (!pointerDown) return false;
      pointerDown = false;
      if (motorPhase === 'active') {
        release();
        return true;
      }
      return false;
    }

    window.addEventListener('resize', resizeCanvas);

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden' && motorPhase === 'active') {
        pointerDown = false;
        release();
      }
    });

    resizeCanvas();
    updateCopy({});
    rafId = requestAnimationFrame(idleLoop);

    return {
      engage: engage,
      release: release,
      reset: reset,
      onPointerDown: onPointerDown,
      onPointerUp: onPointerUp,
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

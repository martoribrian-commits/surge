/**
 * Surge somatic engine — press and hold, 90-second sensory decay.
 */
(function () {
  const STORAGE_KEY = 'surge.session';
  const TOKEN_KEY = 'surge_token';
  const HOLD_MS = 3000;
  const MAX_PULSE_HZ = 1.0;
  const MIN_PULSE_HZ = 0.5;

  const screen = document.getElementById('engine-screen');
  const canvas = document.getElementById('engine-canvas');
  const fogEl = document.getElementById('engine-fog');
  const copyEl = document.getElementById('engine-copy');
  const completeEl = document.getElementById('engine-complete');
  const resetLine = document.getElementById('reset-line');
  const craneBlock = document.getElementById('crane-block');
  const noTokenBlock = document.getElementById('no-token-block');
  const enterBtn = document.getElementById('enter-crane');

  if (!screen || !canvas) return;

  const ctx = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const audio = new SurgeAudio();
  const haptics = new SurgeHaptics();

  let phase = 'idle';
  let rafId = null;
  let startMs = null;
  let pausedElapsed = 0;
  let sessionId = null;
  let pointerDown = false;
  let clockStart = performance.now() / 1000;
  let rings = [];
  let lastRingBeat = -1;
  let completeFade = 0;

  function hasToken() {
    try {
      const t = localStorage.getItem(TOKEN_KEY);
      return t && t.length === 6;
    } catch {
      return false;
    }
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
    if (phase === 'active' && startMs !== null) {
      return pausedElapsed + (performance.now() - startMs);
    }
    return pausedElapsed;
  }

  function curveState() {
    return SurgeCurve.curveAt(elapsedMs());
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function updateFog(intensity, chaos) {
    if (!fogEl) return;
    const show = phase === 'active' && intensity > 0.05;
    fogEl.hidden = !show;
    if (!show) return;

    const pulseHz = MIN_PULSE_HZ + intensity * (MAX_PULSE_HZ - MIN_PULSE_HZ);
    const pulseDuration = 1 / pulseHz;
    const fogBlur = 8 + intensity * 28;
    const innerGlow = 0.06 + intensity * 0.28;

    fogEl.style.setProperty('--fog-blur', fogBlur + 'px');
    fogEl.style.setProperty('--inner-glow', String(innerGlow));
    fogEl.style.setProperty('--outer-amber', String(0.04 + intensity * 0.18));
    fogEl.style.setProperty('--deep-core', String(0.02 + intensity * 0.12));
    fogEl.style.setProperty('--pulse-duration', pulseDuration + 's');
    fogEl.style.setProperty('--chaos', String(chaos));
  }

  function updateCopy(state) {
    if (phase === 'idle') {
      copyEl.textContent = 'Press and hold.';
      copyEl.style.opacity = '1';
      copyEl.style.color = '';
      return;
    }
    if (phase === 'interrupted') {
      copyEl.textContent = 'Hold to resume.';
      copyEl.style.opacity = '1';
      copyEl.style.color = '';
      return;
    }
    if (phase === 'active') {
      copyEl.textContent = 'The system is resetting.';
      const opacity = Math.min(1, state.value / 0.5);
      copyEl.style.opacity = String(Math.max(0.15, opacity));
      copyEl.style.color = opacity > 0.6 ? '#ffffff' : '';
    }
  }

  function pruneRings(nowSec) {
    rings = rings.filter(function (r) {
      return nowSec - r.born < 2.6;
    });
  }

  function maybeSpawnRing(nowSec, heartbeat) {
    const beatIndex = Math.floor(nowSec * SurgeCurve.HEARTBEAT_HZ);
    if (beatIndex !== lastRingBeat && heartbeat > 0.08) {
      lastRingBeat = beatIndex;
      rings.push({ born: nowSec, strength: 0.35 + heartbeat * 0.65 });
    }
  }

  function renderFrame() {
    const nowSec = performance.now() / 1000;
    const elapsed = elapsedMs();
    const state = SurgeCurve.curveAt(elapsed);

    if (phase === 'active') {
      maybeSpawnRing(nowSec, state.heartbeat);
    }
    pruneRings(nowSec);

    SurgeVisual.draw(ctx, {
      phase: phase,
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

    if (phase === 'active') {
      updateFog(state.value, state.chaos);
      updateCopy(state);
    }
  }

  function tick() {
    if (phase !== 'active') return;

    renderFrame();

    const elapsed = elapsedMs();
    if (elapsed >= SurgeCurve.DURATION_MS) {
      finishCycle(90);
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  function idleLoop() {
    if (phase !== 'idle' && phase !== 'interrupted' && phase !== 'holding' && phase !== 'complete') {
      return;
    }
    renderFrame();
    if (phase === 'idle' || phase === 'interrupted') {
      rafId = requestAnimationFrame(idleLoop);
    }
  }

  function startCycle() {
    if (phase === 'active') return;
    phase = 'active';
    sessionId = crypto.randomUUID();
    startMs = performance.now();
    pausedElapsed = 0;
    lastRingBeat = -1;
    rings = [];
    completeFade = 0;
    completeEl.classList.remove('visible');
    copyEl.style.display = 'block';

    audio.start(SurgeCurve.DURATION_MS);
    haptics.start(curveState);

    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }

  function resumeCycle() {
    if (phase !== 'interrupted') return;
    phase = 'active';
    startMs = performance.now();
    copyEl.style.display = 'block';
    audio.resume();
    haptics.resume();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }

  function interruptCycle() {
    if (phase !== 'active') return;
    cancelAnimationFrame(rafId);
    pausedElapsed += performance.now() - startMs;
    phase = 'interrupted';
    const duration = Math.round(pausedElapsed / 1000);
    writeSession('interrupted', duration);
    audio.pause();
    haptics.pause();
    updateCopy({});
    rafId = requestAnimationFrame(idleLoop);
  }

  function finishCycle(duration) {
    cancelAnimationFrame(rafId);
    phase = 'holding';
    writeSession('complete', duration);
    audio.complete();
    haptics.complete();
    if (fogEl) fogEl.hidden = true;
    copyEl.style.display = 'none';

    completeFade = 0;
    const fadeStart = performance.now();
    function holdFade() {
      renderFrame();
      if (performance.now() - fadeStart < HOLD_MS) {
        rafId = requestAnimationFrame(holdFade);
      } else {
        showCompletionUI();
      }
    }
    rafId = requestAnimationFrame(holdFade);
  }

  function showCompletionUI() {
    completeFade = 1;
    renderFrame();

    resetLine.style.opacity = '0';
    resetLine.style.transition = 'opacity 1.2s ease';
    completeEl.classList.add('visible');
    requestAnimationFrame(function () {
      resetLine.style.opacity = '1';
    });

    setTimeout(function showCrane() {
      if (hasToken()) {
        craneBlock.style.opacity = '0';
        craneBlock.style.transition = 'opacity 1.2s ease';
        craneBlock.style.display = 'block';
        noTokenBlock.style.display = 'none';
        requestAnimationFrame(function () {
          craneBlock.style.opacity = '1';
        });
      } else {
        craneBlock.style.display = 'none';
        noTokenBlock.style.display = 'block';
      }
      phase = 'complete';
    }, 1200);
  }

  function onPointerDown(e) {
    e.preventDefault();
    if (phase === 'complete' || phase === 'holding') return;
    pointerDown = true;
    if (phase === 'interrupted') {
      resumeCycle();
    } else if (phase === 'idle') {
      startCycle();
    }
  }

  function onPointerUp() {
    if (!pointerDown) return;
    pointerDown = false;
    if (phase === 'active') {
      interruptCycle();
    }
  }

  screen.addEventListener('pointerdown', onPointerDown);
  screen.addEventListener('pointerup', onPointerUp);
  screen.addEventListener('pointerleave', onPointerUp);
  screen.addEventListener('pointercancel', onPointerUp);

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && phase === 'active') {
      interruptCycle();
    }
  });

  window.addEventListener('resize', resizeCanvas);

  if (enterBtn) {
    enterBtn.addEventListener('click', function () {
      window.location.href = 'crane.html';
    });
  }

  resizeCanvas();
  updateCopy({});
  rafId = requestAnimationFrame(idleLoop);
})();

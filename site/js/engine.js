/**
 * Surge somatic engine — press and hold, 90-second decay, sessionStorage cache.
 */
(function () {
  const STORAGE_KEY = 'surge.session';
  const TOKEN_KEY = 'surge_token';
  const HOLD_MS = 3000;

  const screen = document.getElementById('engine-screen');
  const copyEl = document.getElementById('engine-copy');
  const completeEl = document.getElementById('engine-complete');
  const resetLine = document.getElementById('reset-line');
  const craneBlock = document.getElementById('crane-block');
  const noTokenBlock = document.getElementById('no-token-block');
  const enterBtn = document.getElementById('enter-crane');

  if (!screen) return;

  let phase = 'idle'; // idle | active | interrupted | holding | complete
  let rafId = null;
  let startMs = null;
  let pausedElapsed = 0;
  let lastVibrate = 0;
  let sessionId = null;
  let pointerDown = false;

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

  function showCopy(text) {
    copyEl.textContent = text;
    copyEl.style.display = 'block';
    completeEl.classList.remove('visible');
  }

  function hideCopy() {
    copyEl.style.display = 'none';
  }

  function tick(now) {
    if (phase !== 'active') return;

    const elapsed = pausedElapsed + (now - startMs);
    const t = SurgeCurve.intensityAt(elapsed);
    const bg = SurgeCurve.colorAt(t);

    screen.style.backgroundColor = bg;
    copyEl.style.color = t > 0.4 ? '#000000' : '#ffffff';

    if (SurgeCurve.hapticAt(t, lastVibrate, now)) {
      lastVibrate = now;
    }

    if (elapsed >= SurgeCurve.DURATION_MS) {
      finishCycle(90);
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  function startCycle() {
    if (phase === 'active') return;
    phase = 'active';
    sessionId = crypto.randomUUID();
    startMs = performance.now();
    pausedElapsed = 0;
    lastVibrate = 0;
    hideCopy();
    completeEl.classList.remove('visible');
    rafId = requestAnimationFrame(tick);
  }

  function resumeCycle() {
    if (phase !== 'interrupted') return;
    phase = 'active';
    startMs = performance.now();
    hideCopy();
    rafId = requestAnimationFrame(tick);
  }

  function interruptCycle() {
    if (phase !== 'active') return;
    cancelAnimationFrame(rafId);
    pausedElapsed += performance.now() - startMs;
    phase = 'interrupted';
    const duration = Math.round(pausedElapsed / 1000);
    writeSession('interrupted', duration);
    showCopy('Hold to resume.');
  }

  function finishCycle(duration) {
    cancelAnimationFrame(rafId);
    phase = 'holding';
    writeSession('complete', duration);
    screen.style.backgroundColor = '#1C1C1E';
    hideCopy();

    setTimeout(function showReset() {
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
    }, HOLD_MS);
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

  if (enterBtn) {
    enterBtn.addEventListener('click', function () {
      window.location.href = 'crane.html';
    });
  }

  showCopy('Press and hold.');
})();

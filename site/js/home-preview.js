/**
 * Landing hero — canvas micro-preview of the somatic decay curve.
 */
(function () {
  var container = document.querySelector('.home-anchor-preview');
  if (!container || typeof SurgeVisual === 'undefined' || typeof SurgeCurve === 'undefined') {
    return;
  }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var previewMs = reducedMotion ? 0 : 12000;

  container.innerHTML = '';
  var canvas = document.createElement('canvas');
  canvas.className = 'home-preview-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var clockStart = performance.now() / 1000;
  var rings = [];
  var lastRingBeat = -1;
  var rafId = null;

  function resize() {
    var size = container.clientWidth || 144;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function previewProgress(nowSec) {
    if (previewMs <= 0) return 0.42;
    var loop = ((nowSec - clockStart) * 1000) % previewMs;
    return loop / previewMs;
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

  function drawFrame() {
    var nowSec = performance.now() / 1000;
    var progress = previewProgress(nowSec);
    var state = SurgeCurve.curveAtProgress(progress);
    var size = container.clientWidth || 144;

    maybeSpawnRing(nowSec, state.heartbeat);
    pruneRings(nowSec);

    SurgeVisual.draw(ctx, {
      phase: 'active',
      t: nowSec - clockStart,
      progress: state.progress,
      chaos: state.chaos,
      heartbeat: state.heartbeat,
      completeFade: 0,
      rings: rings,
      reducedMotion: reducedMotion,
      width: size,
      height: size,
    });
  }

  function tick() {
    drawFrame();
    if (!reducedMotion) {
      rafId = requestAnimationFrame(tick);
    }
  }

  resize();
  tick();
  window.addEventListener('resize', resize);

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      cancelAnimationFrame(rafId);
    } else if (!reducedMotion) {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }
  });
})();

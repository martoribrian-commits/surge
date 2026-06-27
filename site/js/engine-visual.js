/**
 * Canvas field — ripples, vignette, functional breath guide, hold compression.
 */
(function (global) {
  var lerp = global.SurgeCurve.lerp;
  var HEARTBEAT_HZ = global.SurgeCurve.HEARTBEAT_HZ;
  var STROBE_HZ = global.SurgeCurve.STROBE_HZ;
  var BREATH_HZ = global.SurgeCurve.BREATH_HZ;
  var focalPoint = global.SurgeCurve.focalPoint;
  var breathAmount = global.SurgeCurve.breathAmount;

  var PARTICLE_COUNT = 48;

  function rgb(level) {
    var c = Math.max(0, Math.min(255, Math.round(level)));
    return 'rgb(' + c + ', ' + c + ', ' + Math.min(255, c + 2) + ')';
  }

  function initParticles() {
    var out = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      out.push({
        angle: (i / PARTICLE_COUNT) * Math.PI * 2,
        radius: 0.12 + Math.random() * 0.38,
        speed: 0.4 + Math.random() * 1.6,
        size: 0.8 + Math.random() * 2.2,
      });
    }
    return out;
  }

  var particles = initParticles();

  function drawVignette(ctx, w, h, strength) {
    if (strength <= 0) return;
    var g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.72);
    g.addColorStop(0, 'rgba(0, 0, 0, 0)');
    g.addColorStop(1, 'rgba(0, 0, 0, ' + strength + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function drawRipples(ctx, input, minDim) {
    if (!input.ripples || !input.ripples.length) return;
    for (var i = 0; i < input.ripples.length; i++) {
      var rip = input.ripples[i];
      var age = input.t - rip.born;
      var life = 1.8;
      if (age < 0 || age > life) continue;
      var k = age / life;
      var radius = minDim * (0.04 + k * 0.28);
      var alpha = (1 - k) * 0.28;
      ctx.strokeStyle = 'rgba(245, 166, 35, ' + alpha + ')';
      ctx.lineWidth = Math.max(1, minDim * 0.0025);
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawParticles(ctx, input, cx, cy, minDim) {
    if (input.phase !== 'active' && input.phase !== 'interrupted') return;

    var order = lerp(0.15, 0.95, input.heartbeat);
    var spread = lerp(minDim * 0.42, minDim * 0.18, input.heartbeat);
    var chaosJitter = input.chaos * minDim * 0.08;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var orbitSpeed = p.speed * lerp(2.4, 0.35, order);
      var angle = p.angle + input.t * orbitSpeed * (input.phase === 'interrupted' ? 0.3 : 1);
      var r = spread * p.radius + Math.sin(input.t * 3 + i) * chaosJitter;
      var px = cx + Math.cos(angle) * r;
      var py = cy + Math.sin(angle) * r;
      var alpha = lerp(0.08, 0.35, order) * (input.phase === 'interrupted' ? 0.45 : 1);
      ctx.fillStyle = 'rgba(245, 166, 35, ' + alpha + ')';
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBilateralWash(ctx, input, w, h) {
    if (input.phase !== 'active' || input.chaos < 0.25 || input.reducedMotion) return;
    var sweep = 0.5 + 0.5 * Math.sin(input.t * 2.2);
    var alpha = input.chaos * 0.07 * sweep;
    var grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(255, 200, 120, ' + alpha + ')');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(255, 200, 120, ' + (alpha * (1 - sweep)) + ')');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  function drawBreathGuide(ctx, input, cx, cy, minDim) {
    if (input.phase !== 'active' || input.heartbeat < 0.35) return;
    var amount = breathAmount(input.t);
    var baseR = minDim * lerp(0.26, 0.2, input.progress);
    var innerR = baseR * (0.72 + amount * 0.22);
    var outerR = baseR * (1.02 + amount * 0.08);
    var alpha = 0.1 + 0.22 * input.heartbeat;

    ctx.strokeStyle = 'rgba(127, 168, 146, ' + (alpha * 0.45) + ')';
    ctx.lineWidth = Math.max(1, minDim * 0.003);
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(127, 168, 146, ' + (alpha * 0.12) + ')';
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(238, 244, 240, ' + (alpha * 0.55) + ')';
    ctx.lineWidth = Math.max(1.5, minDim * 0.004);
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * amount);
    ctx.stroke();
  }

  function drawProgressArc(ctx, input, cx, cy, minDim) {
    if (input.phase !== 'active' && input.phase !== 'interrupted') return;
    var arcR = minDim * lerp(0.4, 0.34, input.progress);
    var start = -Math.PI / 2;
    var end = start + Math.PI * 2 * input.progress;
    ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.06 + 0.08 * (1 - input.chaos)) + ')';
    ctx.lineWidth = Math.max(1, minDim * 0.003);
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(245, 166, 35, ' + (0.18 + 0.28 * input.heartbeat) + ')';
    ctx.lineWidth = Math.max(1.5, minDim * 0.0035);
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, start, end);
    ctx.stroke();
  }

  function drawTouchRings(ctx, input, cx, cy, minDim) {
    if (input.phase === 'holding') return;
    var breath = 0.5 + 0.5 * Math.sin(2 * Math.PI * (input.t / (input.phase === 'idle' ? 4 : 3)));
    var holdScale = input.isHolding ? 0.92 : 1;
    var base = minDim * (input.phase === 'idle' ? 0.16 : 0.14) * holdScale;
    var rings = [
      { scale: 1, alpha: input.isHolding ? 0.22 : 0.14 },
      { scale: 1.18, alpha: input.isHolding ? 0.14 : 0.09 },
      { scale: 1.36, alpha: input.isHolding ? 0.08 : 0.05 },
    ];
    for (var i = 0; i < rings.length; i++) {
      var r = rings[i];
      var radius = base * r.scale * (1 + 0.02 * breath);
      ctx.strokeStyle = 'rgba(245, 166, 35, ' + r.alpha + ')';
      ctx.lineWidth = input.isHolding ? 1.5 : 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255, 255, 255, ' + (input.isHolding ? 0.95 : input.phase === 'idle' ? 0.85 : 0.55) + ')';
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(3, minDim * 0.008), 0, Math.PI * 2);
    ctx.fill();
  }

  function draw(ctx, input) {
    var w = input.width;
    var h = input.height;
    var fp = focalPoint(w, h);
    var cx = fp.x;
    var cy = fp.y;
    var minDim = Math.min(w, h);
    var t = input.t;

    var bgLevel = lerp(0, 28, input.progress);
    bgLevel = lerp(bgLevel, 58, input.completeFade);
    if (input.phase === 'idle') bgLevel = 0;
    ctx.fillStyle = rgb(bgLevel);
    ctx.fillRect(0, 0, w, h);

    drawBilateralWash(ctx, input, w, h);
    drawRipples(ctx, input, minDim);

    var beat = 0.5 + 0.5 * Math.sin(2 * Math.PI * HEARTBEAT_HZ * t);
    var strobe = 1;
    if (!input.reducedMotion && input.phase === 'active') {
      var s = 0.5 + 0.5 * Math.sin(2 * Math.PI * STROBE_HZ * t);
      strobe = 1 - 0.22 * input.chaos * s;
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var ri = 0; ri < input.rings.length; ri++) {
      var ring = input.rings[ri];
      var age = t - ring.born;
      var life = 2.6;
      if (age < 0 || age > life) continue;
      var k = age / life;
      var radius = minDim * (0.08 + k * 0.55);
      var alpha = (1 - k) * 0.22 * ring.strength;
      var grad = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius);
      grad.addColorStop(0, 'rgba(255, 159, 10, 0)');
      grad.addColorStop(0.85, 'rgba(255, 180, 70, ' + alpha + ')');
      grad.addColorStop(1, 'rgba(255, 159, 10, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    drawParticles(ctx, input, cx, cy, minDim);
    drawBreathGuide(ctx, input, cx, cy, minDim);
    drawProgressArc(ctx, input, cx, cy, minDim);

    var holdCompress = input.isHolding && input.phase === 'active' ? 0.94 : 1;
    var coreAlpha;
    var coreRadius;
    var amber;

    if (input.phase === 'idle' || input.phase === 'interrupted') {
      var breathRate = input.phase === 'idle' ? 4 : 3;
      var breathIdle = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t / breathRate));
      coreAlpha = input.phase === 'idle' ? 0.22 + 0.12 * breathIdle : 0.16 + 0.1 * breathIdle;
      coreRadius = minDim * (input.phase === 'idle' ? 0.16 + 0.015 * breathIdle : 0.14 + 0.02 * breathIdle);
      amber = input.phase === 'idle' ? 0.15 : 0.1;
    } else {
      var energy = lerp(0.95, 0.45, input.progress);
      coreAlpha = energy * strobe * (1 - 0.4 * input.completeFade);
      var pulseAmp = lerp(0.02, 0.14, input.heartbeat);
      coreRadius = minDim * (lerp(0.34, 0.2, input.progress) + pulseAmp * beat) * holdCompress;
      amber = input.chaos;
    }

    var r = 255;
    var g = Math.round(lerp(159, 255, amber));
    var b = Math.round(lerp(10, 255, amber));
    var blur = lerp(0.2, 0.62, input.progress);

    var core = ctx.createRadialGradient(cx, cy, coreRadius * (1 - blur) * 0.4, cx, cy, coreRadius);
    core.addColorStop(0, 'rgba(' + r + ', ' + g + ', ' + b + ', ' + coreAlpha + ')');
    core.addColorStop(0.55, 'rgba(' + r + ', ' + g + ', ' + b + ', ' + coreAlpha * 0.45 + ')');
    core.addColorStop(1, 'rgba(' + r + ', ' + g + ', ' + b + ', 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    if (input.phase === 'active') {
      var dotAlpha = lerp(0.85, 0.4, input.progress);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + dotAlpha * (1 - input.completeFade) + ')';
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(2, minDim * 0.006), 0, Math.PI * 2);
      ctx.fill();
    }

    drawTouchRings(ctx, input, cx, cy, minDim);
    drawVignette(ctx, w, h, input.phase === 'idle' ? 0.35 : 0.22 + input.chaos * 0.18);
  }

  global.SurgeVisual = { draw, focalPoint: focalPoint };
})(typeof window !== 'undefined' ? window : globalThis);

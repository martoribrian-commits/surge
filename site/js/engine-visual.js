/**
 * Canvas field — aurora idle, ignition burst, shockwaves, constellation, bloom.
 */
(function (global) {
  var lerp = global.SurgeCurve.lerp;
  var HEARTBEAT_HZ = global.SurgeCurve.HEARTBEAT_HZ;
  var STROBE_HZ = global.SurgeCurve.STROBE_HZ;
  var BREATH_HZ = global.SurgeCurve.BREATH_HZ;
  var focalPoint = global.SurgeCurve.focalPoint;
  var breathAmount = global.SurgeCurve.breathAmount;

  var PARTICLE_COUNT = 64;
  var scratchPositions = [];

  function initParticles() {
    var out = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      out.push({
        angle: (i / PARTICLE_COUNT) * Math.PI * 2,
        radius: 0.1 + Math.random() * 0.42,
        speed: 0.35 + Math.random() * 1.8,
        size: 0.7 + Math.random() * 2.4,
      });
    }
    return out;
  }

  var particles = initParticles();

  function palette(progress, chaos, heartbeat) {
    var r = lerp(8, 18, progress);
    var g = lerp(8, lerp(14, 42, heartbeat), progress);
    var b = lerp(10, lerp(12, 36, heartbeat), progress);
    if (chaos > 0.5) {
      r = lerp(r, 22, chaos * 0.5);
      g = lerp(g, 12, chaos * 0.4);
    }
    return { r: r, g: g, b: b };
  }

  function drawAurora(ctx, w, h, t) {
    var g1 = ctx.createRadialGradient(w * 0.3, h * 0.35, 0, w * 0.3, h * 0.35, w * 0.55);
    g1.addColorStop(0, 'rgba(182, 80, 46, ' + (0.04 + 0.02 * Math.sin(t * 0.4)) + ')');
    g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, h);

    var g2 = ctx.createRadialGradient(w * 0.72, h * 0.62, 0, w * 0.72, h * 0.62, w * 0.48);
    g2.addColorStop(0, 'rgba(196, 90, 50, ' + (0.035 + 0.015 * Math.sin(t * 0.3 + 1)) + ')');
    g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);
  }

  function drawPhaseFlashes(ctx, input, w, h) {
    if (!input.flashes) return;
    for (var i = 0; i < input.flashes.length; i++) {
      var f = input.flashes[i];
      var age = input.t - f.born;
      var life = f.type === 'complete' ? 1.6 : 0.85;
      if (age < 0 || age > life) continue;
      var k = age / life;
      var alpha = f.strength * (1 - k) * (1 - k);
      var color =
        f.type === 'heartbeat'
          ? '127, 168, 146'
          : f.type === 'mid'
            ? '196, 90, 50'
            : '244, 240, 235';
      var g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
      g.addColorStop(0, 'rgba(' + color + ', ' + alpha * 0.35 + ')');
      g.addColorStop(0.55, 'rgba(' + color + ', ' + alpha * 0.08 + ')');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function drawEngageBurst(ctx, input, cx, cy, minDim) {
    if (!input.engageBurst || input.engageBurst < 0.02) return;
    var strength = input.engageBurst;
    var r = minDim * (0.12 + (1 - strength) * 0.65);
    var g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    g.addColorStop(0, 'rgba(255, 248, 235, ' + strength * 0.55 + ')');
    g.addColorStop(0.4, 'rgba(182, 80, 46, ' + strength * 0.28 + ')');
    g.addColorStop(1, 'rgba(182, 80, 46, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, ' + strength * 0.45 + ')';
    ctx.lineWidth = Math.max(2, minDim * 0.005);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawHoldCharge(ctx, input, cx, cy, minDim) {
    if (!input.holdCharge || input.holdCharge <= 0) return;
    var charge = input.holdCharge;
    var r = minDim * 0.19;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = Math.max(2, minDim * 0.004);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(182, 80, 46, ' + (0.35 + charge * 0.55) + ')';
    ctx.lineWidth = Math.max(2.5, minDim * 0.005);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * charge);
    ctx.stroke();
  }

  function drawShockwaves(ctx, input, cx, cy, minDim) {
    if (!input.shockwaves) return;
    for (var i = 0; i < input.shockwaves.length; i++) {
      var sw = input.shockwaves[i];
      var age = input.t - sw.born;
      var life = sw.type === 'ignite' ? 1.1 : 1.6;
      if (age < 0 || age > life) continue;
      var k = age / life;
      var radius = minDim * (sw.type === 'ignite' ? 0.06 + k * 0.72 : 0.05 + k * 0.62);
      var alpha = (1 - k) * sw.strength;
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + alpha * 0.55 + ')';
      ctx.lineWidth = Math.max(1, minDim * (0.006 - k * 0.003));
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(182, 80, 46, ' + alpha * 0.35 + ')';
      ctx.lineWidth = Math.max(1, minDim * 0.002);
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.97, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function computeParticles(input, cx, cy, minDim) {
    scratchPositions.length = 0;
    if (input.phase !== 'active' && input.phase !== 'interrupted') return scratchPositions;

    var order = lerp(0.15, 0.95, input.heartbeat);
    var spread = lerp(minDim * 0.44, minDim * 0.17, input.heartbeat);
    var chaosJitter = input.chaos * minDim * 0.09;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var orbitSpeed = p.speed * lerp(2.6, 0.3, order);
      var angle = p.angle + input.t * orbitSpeed * (input.phase === 'interrupted' ? 0.25 : 1);
      var r = spread * p.radius + Math.sin(input.t * 3 + i) * chaosJitter;
      scratchPositions.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        alpha: lerp(0.1, 0.42, order),
        size: p.size,
      });
    }
    return scratchPositions;
  }

  function drawConstellation(ctx, positions, heartbeat, minDim) {
    if (heartbeat < 0.42 || positions.length < 4) return;
    var linkDist = minDim * 0.14;
    var linkDistSq = linkDist * linkDist;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = Math.max(0.5, minDim * 0.0012);
    for (var i = 0; i < positions.length; i++) {
      for (var j = i + 1; j < positions.length; j++) {
        var dx = positions[i].x - positions[j].x;
        var dy = positions[i].y - positions[j].y;
        var d2 = dx * dx + dy * dy;
        if (d2 > linkDistSq) continue;
        var prox = 1 - Math.sqrt(d2) / linkDist;
        ctx.strokeStyle = 'rgba(127, 200, 160, ' + prox * heartbeat * 0.22 + ')';
        ctx.beginPath();
        ctx.moveTo(positions[i].x, positions[i].y);
        ctx.lineTo(positions[j].x, positions[j].y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawParticles(ctx, positions, input) {
    if (!positions.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < positions.length; i++) {
      var pt = positions[i];
      var alpha = pt.alpha * (input.phase === 'interrupted' ? 0.4 : 1);
      ctx.fillStyle = 'rgba(245, 190, 90, ' + alpha + ')';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawInkRings(ctx, input, cx, cy, minDim) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var ri = 0; ri < input.rings.length; ri++) {
      var ring = input.rings[ri];
      var age = input.t - ring.born;
      var life = 2.8;
      if (age < 0 || age > life) continue;
      var k = age / life;
      var radius = minDim * (0.06 + k * 0.58);
      var alpha = (1 - k) * 0.28 * ring.strength;
      var grad = ctx.createRadialGradient(cx, cy, radius * 0.65, cx, cy, radius);
      grad.addColorStop(0, 'rgba(255, 159, 10, 0)');
      grad.addColorStop(0.8, 'rgba(255, 190, 80, ' + alpha + ')');
      grad.addColorStop(1, 'rgba(255, 159, 10, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBilateralWash(ctx, input, w, h) {
    if (input.phase !== 'active' || input.chaos < 0.2 || input.reducedMotion) return;
    var sweep = 0.5 + 0.5 * Math.sin(input.t * 2.4);
    var alpha = input.chaos * 0.09 * sweep;
    var grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(255, 210, 140, ' + alpha + ')');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(255, 210, 140, ' + (alpha * (1 - sweep)) + ')');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  function drawBreathGuide(ctx, input, cx, cy, minDim) {
    if (input.phase !== 'active' || input.heartbeat < 0.35) return;
    var amount = breathAmount(input.t);
    var baseR = minDim * lerp(0.27, 0.21, input.progress);
    var innerR = baseR * (0.7 + amount * 0.24);
    var alpha = 0.12 + 0.28 * input.heartbeat;

    ctx.strokeStyle = 'rgba(196, 90, 50, ' + alpha * 0.5 + ')';
    ctx.lineWidth = Math.max(1, minDim * 0.003);
    ctx.beginPath();
    ctx.arc(cx, cy, baseR * 1.05, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(196, 90, 50, ' + alpha * 0.14 + ')';
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, ' + alpha * 0.65 + ')';
    ctx.lineWidth = Math.max(2, minDim * 0.0045);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * amount);
    ctx.stroke();
  }

  function drawProgressArc(ctx, input, cx, cy, minDim) {
    if (input.phase !== 'active' && input.phase !== 'interrupted') return;
    var arcR = minDim * lerp(0.42, 0.36, input.progress);
    var start = -Math.PI / 2;
    var end = start + Math.PI * 2 * input.progress;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = Math.max(1, minDim * 0.0025);
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(182, 80, 46, ' + (0.22 + 0.32 * input.heartbeat) + ')';
    ctx.lineWidth = Math.max(2, minDim * 0.004);
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, start, end);
    ctx.stroke();
  }

  function drawCore(ctx, input, cx, cy, minDim, beat, strobe) {
    var holdCompress = input.isHolding && input.phase === 'active' ? 0.93 : 1;
    var coreAlpha;
    var coreRadius;
    var amber;

    if (input.phase === 'idle' || input.phase === 'interrupted') {
      var breathRate = input.phase === 'idle' ? 4 : 3;
      var breathIdle = 0.5 + 0.5 * Math.sin(2 * Math.PI * (input.t / breathRate));
      coreAlpha = input.phase === 'idle' ? 0.26 + 0.14 * breathIdle : 0.18 + 0.1 * breathIdle;
      coreRadius = minDim * (input.phase === 'idle' ? 0.17 + 0.018 * breathIdle : 0.14 + 0.02 * breathIdle);
      amber = input.phase === 'idle' ? 0.18 : 0.1;
    } else {
      var energy = lerp(1, 0.42, input.progress);
      coreAlpha = energy * strobe * (1 - 0.35 * input.completeFade);
      var pulseAmp = lerp(0.03, 0.16, input.heartbeat);
      coreRadius = minDim * (lerp(0.36, 0.19, input.progress) + pulseAmp * beat) * holdCompress;
      amber = input.chaos;
    }

    var bloomR = coreRadius * lerp(1.8, 2.6, input.chaos);
    var bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, bloomR);
    bloom.addColorStop(0, 'rgba(255, 200, 120, ' + coreAlpha * 0.22 + ')');
    bloom.addColorStop(0.45, 'rgba(182, 80, 46, ' + coreAlpha * 0.08 + ')');
    bloom.addColorStop(1, 'rgba(182, 80, 46, 0)');
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(cx, cy, bloomR, 0, Math.PI * 2);
    ctx.fill();

    var r = 255;
    var g = Math.round(lerp(150, 255, amber));
    var b = Math.round(lerp(12, 255, amber));
    var blur = lerp(0.18, 0.65, input.progress);

    function paintCore(offsetX, offsetY, alphaMul) {
      var core = ctx.createRadialGradient(
        cx + offsetX,
        cy + offsetY,
        coreRadius * (1 - blur) * 0.35,
        cx + offsetX,
        cy + offsetY,
        coreRadius,
      );
      core.addColorStop(0, 'rgba(' + r + ', ' + g + ', ' + b + ', ' + coreAlpha * alphaMul + ')');
      core.addColorStop(0.5, 'rgba(' + r + ', ' + g + ', ' + b + ', ' + coreAlpha * 0.42 * alphaMul + ')');
      core.addColorStop(1, 'rgba(' + r + ', ' + g + ', ' + b + ', 0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx + offsetX, cy + offsetY, coreRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (input.chaos > 0.55 && input.phase === 'active' && !input.reducedMotion) {
      var split = minDim * 0.012 * input.chaos;
      ctx.globalCompositeOperation = 'lighter';
      paintCore(-split, 0, 0.35);
      paintCore(split, 0, 0.35);
      ctx.globalCompositeOperation = 'source-over';
    }

    paintCore(0, 0, 1);

    if (input.phase === 'active' || input.phase === 'idle') {
      var dotAlpha = input.phase === 'idle' ? 0.9 : lerp(0.9, 0.45, input.progress);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + dotAlpha * (1 - input.completeFade) + ')';
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(2.5, minDim * 0.007), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawTouchRings(ctx, input, cx, cy, minDim) {
    if (input.phase === 'holding') return;
    var breath = 0.5 + 0.5 * Math.sin(2 * Math.PI * (input.t / (input.phase === 'idle' ? 4 : 3)));
    var holdScale = input.isHolding ? 0.9 : 1;
    var base = minDim * (input.phase === 'idle' ? 0.17 : 0.14) * holdScale;
    var alphas = input.isHolding ? [0.28, 0.16, 0.09] : [0.16, 0.1, 0.05];
    var scales = [1, 1.2, 1.38];
    for (var i = 0; i < scales.length; i++) {
      ctx.strokeStyle = 'rgba(182, 80, 46, ' + alphas[i] + ')';
      ctx.lineWidth = input.isHolding ? 2 : 1;
      ctx.beginPath();
      ctx.arc(cx, cy, base * scales[i] * (1 + 0.025 * breath), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawRipples(ctx, input, minDim) {
    if (!input.ripples || !input.ripples.length) return;
    for (var i = 0; i < input.ripples.length; i++) {
      var rip = input.ripples[i];
      var age = input.t - rip.born;
      var life = 2;
      if (age < 0 || age > life) continue;
      var k = age / life;
      var radius = minDim * (0.03 + k * 0.32);
      var alpha = (1 - k) * 0.38;
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + alpha * 0.5 + ')';
      ctx.lineWidth = Math.max(1, minDim * 0.002);
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(182, 80, 46, ' + alpha + ')';
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, radius * 0.92, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawVignette(ctx, w, h, strength) {
    if (strength <= 0) return;
    var g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.15, w / 2, h / 2, Math.max(w, h) * 0.78);
    g.addColorStop(0, 'rgba(0, 0, 0, 0)');
    g.addColorStop(1, 'rgba(0, 0, 0, ' + strength + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function drawSupernova(ctx, input, cx, cy, minDim) {
    if (input.completeFade <= 0 && (!input.engageBurst || input.engageBurst < 0.05)) return;
    var strength = Math.max(input.completeFade, input.engageBurst * 0.4);
    if (strength <= 0) return;
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.75);
    g.addColorStop(0, 'rgba(255, 255, 255, ' + strength * 0.45 + ')');
    g.addColorStop(0.25, 'rgba(200, 230, 210, ' + strength * 0.2 + ')');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, input.width, input.height);
  }

  function draw(ctx, input) {
    var w = input.width;
    var h = input.height;
    var fp = focalPoint(w, h);
    var cx = fp.x;
    var cy = fp.y;
    var minDim = Math.min(w, h);
    var t = input.t;

    var pal = palette(input.progress, input.chaos, input.heartbeat);
    if (input.phase === 'idle') {
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, w, h);
      drawAurora(ctx, w, h, t);
    } else {
      ctx.fillStyle = 'rgb(' + pal.r + ', ' + pal.g + ', ' + pal.b + ')';
      ctx.fillRect(0, 0, w, h);
    }

    drawPhaseFlashes(ctx, input, w, h);
    drawBilateralWash(ctx, input, w, h);
    drawRipples(ctx, input, minDim);

    var beat = 0.5 + 0.5 * Math.sin(2 * Math.PI * HEARTBEAT_HZ * t);
    var strobe = 1;
    if (!input.reducedMotion && input.phase === 'active') {
      var s = 0.5 + 0.5 * Math.sin(2 * Math.PI * STROBE_HZ * t);
      strobe = 1 - 0.26 * input.chaos * s;
    }

    drawInkRings(ctx, input, cx, cy, minDim);
    drawShockwaves(ctx, input, cx, cy, minDim);

    var positions = computeParticles(input, cx, cy, minDim);
    drawConstellation(ctx, positions, input.heartbeat, minDim);
    drawParticles(ctx, positions, input);

    drawBreathGuide(ctx, input, cx, cy, minDim);
    drawProgressArc(ctx, input, cx, cy, minDim);
    drawHoldCharge(ctx, input, cx, cy, minDim);
    drawEngageBurst(ctx, input, cx, cy, minDim);
    drawCore(ctx, input, cx, cy, minDim, beat, strobe);
    drawTouchRings(ctx, input, cx, cy, minDim);
    drawSupernova(ctx, input, cx, cy, minDim);
    drawVignette(ctx, w, h, input.phase === 'idle' ? 0.38 : 0.2 + input.chaos * 0.22);
  }

  global.SurgeVisual = { draw, focalPoint: focalPoint };
})(typeof window !== 'undefined' ? window : globalThis);

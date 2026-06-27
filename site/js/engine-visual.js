/**
 * Canvas field renderer — ink rings, amber core, peak strobe, idle breath.
 */
(function (global) {
  const { lerp, HEARTBEAT_HZ, STROBE_HZ } = global.SurgeCurve;

  function rgb(level) {
    const c = Math.max(0, Math.min(255, Math.round(level)));
    return 'rgb(' + c + ', ' + c + ', ' + Math.min(255, c + 2) + ')';
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {{
   *   phase: string,
   *   t: number,
   *   progress: number,
   *   chaos: number,
   *   heartbeat: number,
   *   completeFade: number,
   *   rings: Array<{ born: number, strength: number }>,
   *   reducedMotion: boolean,
   *   width: number,
   *   height: number,
   * }} input
   */
  function draw(ctx, input) {
    const w = input.width;
    const h = input.height;
    const cx = w / 2;
    const cy = h / 2;
    const minDim = Math.min(w, h);
    const t = input.t;

    let bgLevel = lerp(0, 28, input.progress);
    bgLevel = lerp(bgLevel, 58, input.completeFade);
    if (input.phase === 'idle') bgLevel = 0;
    ctx.fillStyle = rgb(bgLevel);
    ctx.fillRect(0, 0, w, h);

    const beat = 0.5 + 0.5 * Math.sin(2 * Math.PI * HEARTBEAT_HZ * t);

    let strobe = 1;
    if (!input.reducedMotion && input.phase === 'active') {
      const s = 0.5 + 0.5 * Math.sin(2 * Math.PI * STROBE_HZ * t);
      strobe = 1 - 0.22 * input.chaos * s;
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < input.rings.length; i++) {
      const ring = input.rings[i];
      const age = t - ring.born;
      const life = 2.6;
      if (age < 0 || age > life) continue;
      const k = age / life;
      const radius = minDim * (0.08 + k * 0.55);
      const alpha = (1 - k) * 0.18 * ring.strength;
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius);
      grad.addColorStop(0, 'rgba(255, 159, 10, 0)');
      grad.addColorStop(0.85, 'rgba(255, 180, 70, ' + alpha + ')');
      grad.addColorStop(1, 'rgba(255, 159, 10, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    let coreAlpha;
    let coreRadius;
    let amber;

    if (input.phase === 'idle') {
      const breath = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t / 4));
      coreAlpha = 0.22 + 0.12 * breath;
      coreRadius = minDim * (0.16 + 0.015 * breath);
      amber = 0.15;
    } else if (input.phase === 'interrupted') {
      const breath = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t / 3));
      coreAlpha = 0.16 + 0.1 * breath;
      coreRadius = minDim * (0.14 + 0.02 * breath);
      amber = 0.1;
    } else {
      const energy = lerp(0.95, 0.45, input.progress);
      coreAlpha = energy * strobe * (1 - 0.4 * input.completeFade);
      const pulseAmp = lerp(0.02, 0.14, input.heartbeat);
      coreRadius = minDim * (lerp(0.34, 0.2, input.progress) + pulseAmp * beat);
      amber = input.chaos;
    }

    const r = 255;
    const g = Math.round(lerp(159, 255, amber));
    const b = Math.round(lerp(10, 255, amber));
    const blur = lerp(0.2, 0.62, input.progress);

    const core = ctx.createRadialGradient(
      cx,
      cy,
      coreRadius * (1 - blur) * 0.4,
      cx,
      cy,
      coreRadius,
    );
    core.addColorStop(0, 'rgba(' + r + ', ' + g + ', ' + b + ', ' + coreAlpha + ')');
    core.addColorStop(0.55, 'rgba(' + r + ', ' + g + ', ' + b + ', ' + coreAlpha * 0.45 + ')');
    core.addColorStop(1, 'rgba(' + r + ', ' + g + ', ' + b + ', 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    if (input.phase === 'active' || input.phase === 'interrupted') {
      const dotAlpha =
        input.phase === 'interrupted' ? 0.3 : lerp(0.85, 0.4, input.progress);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + dotAlpha * (1 - input.completeFade) + ')';
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(2, minDim * 0.006), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  global.SurgeVisual = { draw };
})(typeof window !== 'undefined' ? window : globalThis);

import { useEffect, useRef } from 'react';
import {
  HEARTBEAT_HZ,
  STROBE_HZ,
  breathAmount,
  curveAtElapsed,
  focalPoint,
  lerp,
  phaseAt,
} from '../../../lib/surgeCurve';

const PARTICLE_COUNT = 64;

function initParticles() {
  const out = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    out.push({
      angle: (i / PARTICLE_COUNT) * Math.PI * 2,
      radius: 0.1 + Math.random() * 0.42,
      speed: 0.35 + Math.random() * 1.8,
      size: 0.7 + Math.random() * 2.4,
    });
  }
  return out;
}

function palette(progress, chaos, heartbeat) {
  let r = lerp(8, 18, progress);
  let g = lerp(8, lerp(14, 42, heartbeat), progress);
  let b = lerp(10, lerp(12, 36, heartbeat), progress);
  if (chaos > 0.5) {
    r = lerp(r, 22, chaos * 0.5);
    g = lerp(g, 12, chaos * 0.4);
  }
  return { r, g, b };
}

/**
 * Original Surge canvas field — ported from site/js/engine-visual.js.
 * Full-screen particles, shockwaves, strobe core, progress arc.
 */
export default function FieldCanvas({
  elapsedSeconds,
  isEngaged = false,
  isPaused = false,
  isComplete = false,
  completeFade = 0,
  engageBurst = 0,
  ripples = [],
  className = '',
}) {
  const canvasRef = useRef(null);
  const particlesRef = useRef(initParticles());
  const ringsRef = useRef([]);
  const shockwavesRef = useRef([]);
  const flashesRef = useRef([]);
  const clockStartRef = useRef(performance.now() / 1000);
  const lastRingBeatRef = useRef(-1);
  const lastShockBeatRef = useRef(-1);
  const lastPhaseRef = useRef(null);
  const rafRef = useRef(null);
  const stateRef = useRef({ elapsedSeconds, isEngaged, isPaused, isComplete, completeFade, engageBurst, ripples });

  stateRef.current = { elapsedSeconds, isEngaged, isPaused, isComplete, completeFade, engageBurst, ripples };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawAurora = (w, h, t) => {
      const g1 = ctx.createRadialGradient(w * 0.3, h * 0.35, 0, w * 0.3, h * 0.35, w * 0.55);
      g1.addColorStop(0, `rgba(182, 80, 46, ${0.04 + 0.02 * Math.sin(t * 0.4)})`);
      g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(w * 0.72, h * 0.62, 0, w * 0.72, h * 0.62, w * 0.48);
      g2.addColorStop(0, `rgba(196, 90, 50, ${0.035 + 0.015 * Math.sin(t * 0.3 + 1)})`);
      g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);
    };

    const drawFrame = () => {
      const {
        elapsedSeconds: elapsed,
        isEngaged: engaged,
        isPaused: paused,
        isComplete: complete,
        completeFade: fade,
        engageBurst: burst,
        ripples: rippleList,
      } = stateRef.current;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const fp = focalPoint(w, h);
      const cx = fp.x;
      const cy = fp.y;
      const minDim = Math.min(w, h);
      const t = performance.now() / 1000 - clockStartRef.current;

      const phase =
        !engaged && elapsed <= 0
          ? 'idle'
          : paused
            ? 'interrupted'
            : complete
              ? 'holding'
              : 'active';

      const state = curveAtElapsed(elapsed);
      const { progress, chaos, heartbeat } = state;

      if (phase === 'active') {
        const beatIndex = Math.floor(t * HEARTBEAT_HZ);
        if (beatIndex !== lastRingBeatRef.current && heartbeat > 0.08) {
          lastRingBeatRef.current = beatIndex;
          ringsRef.current.push({ born: t, strength: 0.35 + heartbeat * 0.65 });
        }
        if (beatIndex !== lastShockBeatRef.current && heartbeat > 0.22) {
          lastShockBeatRef.current = beatIndex;
          shockwavesRef.current.push({ born: t, strength: 0.5 + heartbeat * 0.5, type: 'beat' });
        }

        const phaseId = phaseAt(state).id;
        if (phaseId !== lastPhaseRef.current) {
          if (lastPhaseRef.current) {
            flashesRef.current.push({ born: t, strength: 0.5, type: phaseId });
          }
          lastPhaseRef.current = phaseId;
        }
      }

      ringsRef.current = ringsRef.current.filter((r) => t - r.born < 2.6);
      shockwavesRef.current = shockwavesRef.current.filter((s) => t - s.born < 2);
      flashesRef.current = flashesRef.current.filter((f) => t - f.born < 2);

      const pal = palette(progress, chaos, heartbeat);
      if (phase === 'idle') {
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, w, h);
        drawAurora(w, h, t);
      } else {
        ctx.fillStyle = `rgb(${pal.r}, ${pal.g}, ${pal.b})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Phase flashes
      for (const f of flashesRef.current) {
        const age = t - f.born;
        const life = f.type === 'complete' ? 1.6 : 0.85;
        if (age < 0 || age > life) continue;
        const k = age / life;
        const alpha = f.strength * (1 - k) * (1 - k);
        const color =
          f.type === 'heartbeat' ? '127, 168, 146' : f.type === 'mid' ? '196, 90, 50' : '244, 240, 235';
        const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
        g.addColorStop(0, `rgba(${color}, ${alpha * 0.35})`);
        g.addColorStop(0.55, `rgba(${color}, ${alpha * 0.08})`);
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // Bilateral wash at chaos
      if (phase === 'active' && chaos > 0.2 && !reducedMotion) {
        const sweep = 0.5 + 0.5 * Math.sin(t * 2.4);
        const alpha = chaos * 0.09 * sweep;
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, `rgba(255, 210, 140, ${alpha})`);
        grad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, `rgba(255, 210, 140, ${alpha * (1 - sweep)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Touch ripples
      for (const rip of rippleList) {
        const age = t - rip.born;
        const life = 2;
        if (age < 0 || age > life) continue;
        const k = age / life;
        const radius = minDim * (0.03 + k * 0.32);
        const alpha = (1 - k) * 0.38;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.lineWidth = Math.max(1, minDim * 0.002);
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(182, 80, 46, ${alpha})`;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, radius * 0.92, 0, Math.PI * 2);
        ctx.stroke();
      }

      const beat = 0.5 + 0.5 * Math.sin(2 * Math.PI * HEARTBEAT_HZ * t);
      let strobe = 1;
      if (!reducedMotion && phase === 'active') {
        const s = 0.5 + 0.5 * Math.sin(2 * Math.PI * STROBE_HZ * t);
        strobe = 1 - 0.38 * chaos * s;
      }

      // Ink rings
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const ring of ringsRef.current) {
        const age = t - ring.born;
        const life = 2.8;
        if (age < 0 || age > life) continue;
        const k = age / life;
        const radius = minDim * (0.06 + k * 0.58);
        const alpha = (1 - k) * 0.28 * ring.strength;
        const grad = ctx.createRadialGradient(cx, cy, radius * 0.65, cx, cy, radius);
        grad.addColorStop(0, 'rgba(255, 159, 10, 0)');
        grad.addColorStop(0.8, `rgba(255, 190, 80, ${alpha})`);
        grad.addColorStop(1, 'rgba(255, 159, 10, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Shockwaves
      for (const sw of shockwavesRef.current) {
        const age = t - sw.born;
        const life = sw.type === 'ignite' ? 1.1 : 1.6;
        if (age < 0 || age > life) continue;
        const k = age / life;
        const radius = minDim * (sw.type === 'ignite' ? 0.06 + k * 0.72 : 0.05 + k * 0.62);
        const alpha = (1 - k) * sw.strength;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.55})`;
        ctx.lineWidth = Math.max(1, minDim * (0.006 - k * 0.003));
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(182, 80, 46, ${alpha * 0.35})`;
        ctx.lineWidth = Math.max(1, minDim * 0.002);
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.97, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Particles
      const order = lerp(0.15, 0.95, heartbeat);
      const spread = lerp(minDim * 0.44, minDim * 0.17, heartbeat);
      const chaosJitter = chaos * minDim * 0.09;
      const positions = [];

      if (phase === 'active' || phase === 'interrupted') {
        for (let i = 0; i < particlesRef.current.length; i++) {
          const p = particlesRef.current[i];
          const orbitSpeed = p.speed * lerp(2.6, 0.3, order);
          const angle = p.angle + t * orbitSpeed * (phase === 'interrupted' ? 0.25 : 1);
          const r = spread * p.radius + Math.sin(t * 3 + i) * chaosJitter;
          positions.push({
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r,
            alpha: lerp(0.1, 0.42, order),
            size: p.size,
          });
        }
      }

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const pt of positions) {
        const alpha = pt.alpha * (phase === 'interrupted' ? 0.4 : 1);
        ctx.fillStyle = `rgba(245, 190, 90, ${alpha})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Engage burst
      if (burst > 0.02) {
        const strength = burst;
        const r = minDim * (0.12 + (1 - strength) * 0.65);
        const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
        g.addColorStop(0, `rgba(255, 248, 235, ${strength * 0.55})`);
        g.addColorStop(0.4, `rgba(182, 80, 46, ${strength * 0.28})`);
        g.addColorStop(1, 'rgba(182, 80, 46, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 255, 255, ${strength * 0.45})`;
        ctx.lineWidth = Math.max(2, minDim * 0.005);
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Progress arc
      if (phase === 'active' || phase === 'interrupted') {
        const arcR = minDim * lerp(0.42, 0.36, progress);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = Math.max(1, minDim * 0.0025);
        ctx.beginPath();
        ctx.arc(cx, cy, arcR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(182, 80, 46, ${0.22 + 0.32 * heartbeat})`;
        ctx.lineWidth = Math.max(2, minDim * 0.004);
        ctx.beginPath();
        ctx.arc(cx, cy, arcR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.stroke();
      }

      // Core bloom
      const holdCompress = engaged && phase === 'active' ? 0.93 : 1;
      let coreAlpha;
      let coreRadius;
      let amber;

      if (phase === 'idle' || phase === 'interrupted') {
        const breathRate = phase === 'idle' ? 4 : 3;
        const breathIdle = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / breathRate);
        coreAlpha = phase === 'idle' ? 0.26 + 0.14 * breathIdle : 0.18 + 0.1 * breathIdle;
        coreRadius = minDim * (phase === 'idle' ? 0.17 + 0.018 * breathIdle : 0.14 + 0.02 * breathIdle);
        amber = phase === 'idle' ? 0.18 : 0.1;
      } else {
        const energy = lerp(1, 0.42, progress);
        coreAlpha = energy * strobe * (1 - 0.35 * fade);
        const pulseAmp = lerp(0.03, 0.16, heartbeat);
        coreRadius = minDim * (lerp(0.36, 0.19, progress) + pulseAmp * beat) * holdCompress;
        amber = chaos;
      }

      const bloomR = coreRadius * lerp(1.8, 2.6, chaos);
      const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, bloomR);
      bloom.addColorStop(0, `rgba(255, 200, 120, ${coreAlpha * 0.22})`);
      bloom.addColorStop(0.45, `rgba(182, 80, 46, ${coreAlpha * 0.08})`);
      bloom.addColorStop(1, 'rgba(182, 80, 46, 0)');
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(cx, cy, bloomR, 0, Math.PI * 2);
      ctx.fill();

      const rr = 255;
      const rg = Math.round(lerp(150, 255, amber));
      const rb = Math.round(lerp(12, 255, amber));
      const blur = lerp(0.18, 0.65, progress);

      const paintCore = (offsetX, offsetY, alphaMul) => {
        const core = ctx.createRadialGradient(
          cx + offsetX,
          cy + offsetY,
          coreRadius * (1 - blur) * 0.35,
          cx + offsetX,
          cy + offsetY,
          coreRadius,
        );
        core.addColorStop(0, `rgba(${rr}, ${rg}, ${rb}, ${coreAlpha * alphaMul})`);
        core.addColorStop(0.5, `rgba(${rr}, ${rg}, ${rb}, ${coreAlpha * 0.42 * alphaMul})`);
        core.addColorStop(1, `rgba(${rr}, ${rg}, ${rb}, 0)`);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(cx + offsetX, cy + offsetY, coreRadius, 0, Math.PI * 2);
        ctx.fill();
      };

      if (chaos > 0.55 && phase === 'active' && !reducedMotion) {
        const split = minDim * 0.012 * chaos;
        ctx.globalCompositeOperation = 'lighter';
        paintCore(-split, 0, 0.35);
        paintCore(split, 0, 0.35);
        ctx.globalCompositeOperation = 'source-over';
      }
      paintCore(0, 0, 1);

      if (phase === 'active' || phase === 'idle') {
        const dotAlpha = phase === 'idle' ? 0.9 : lerp(0.9, 0.45, progress);
        ctx.fillStyle = `rgba(255, 255, 255, ${dotAlpha * (1 - fade)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(2.5, minDim * 0.007), 0, Math.PI * 2);
        ctx.fill();
      }

      // Breath guide in tail
      if (phase === 'active' && heartbeat > 0.35) {
        const amount = breathAmount(t);
        const baseR = minDim * lerp(0.27, 0.21, progress);
        const innerR = baseR * (0.7 + amount * 0.24);
        const alpha = 0.12 + 0.28 * heartbeat;
        ctx.strokeStyle = `rgba(196, 90, 50, ${alpha * 0.5})`;
        ctx.lineWidth = Math.max(1, minDim * 0.003);
        ctx.beginPath();
        ctx.arc(cx, cy, baseR * 1.05, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(196, 90, 50, ${alpha * 0.14})`;
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Supernova on complete
      const superStrength = Math.max(fade, burst * 0.4);
      if (superStrength > 0) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.75);
        g.addColorStop(0, `rgba(255, 255, 255, ${superStrength * 0.45})`);
        g.addColorStop(0.25, `rgba(200, 230, 210, ${superStrength * 0.2})`);
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // Vignette
      const vigStrength = phase === 'idle' ? 0.38 : 0.2 + chaos * 0.22;
      const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.15, w / 2, h / 2, Math.max(w, h) * 0.78);
      vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vg.addColorStop(1, `rgba(0, 0, 0, ${vigStrength})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    };

    const loop = () => {
      drawFrame();
      rafRef.current = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener('resize', resize);
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /** Trigger ignite shockwave externally */
  useEffect(() => {
    if (engageBurst > 0.5) {
      const t = performance.now() / 1000 - clockStartRef.current;
      shockwavesRef.current.push({ born: t, strength: 1, type: 'ignite' });
      flashesRef.current.push({ born: t, strength: 0.75, type: 'chaos' });
    }
  }, [engageBurst]);

  useEffect(() => {
    if (isComplete) {
      const t = performance.now() / 1000 - clockStartRef.current;
      flashesRef.current.push({ born: t, strength: 0.95, type: 'complete' });
    }
  }, [isComplete]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    />
  );
}

/** Call from parent to register touch ripples */
export function createRipple(x, y, clockStart) {
  return { x, y, born: performance.now() / 1000 - clockStart };
}

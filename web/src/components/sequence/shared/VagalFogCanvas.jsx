import { useEffect, useRef } from 'react';
import {
  BREATH_HZ,
  HEARTBEAT_HZ,
  breathAmount,
  curveAtElapsed,
  focalPoint,
  lerp,
} from '../../../lib/surgeCurve';

/**
 * Vagal Downshift — clinical visual decay protocol.
 * Descending fog strata + breath diaphragm. No static, no particles, no strobe.
 * Distinct from Static Field's chaotic sonic canvas.
 */
export default function VagalFogCanvas({
  elapsedSeconds,
  isEngaged,
  isPaused,
  isComplete = false,
  palette,
}) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ elapsedSeconds, isEngaged, isPaused, isComplete, palette });
  const clockRef = useRef(performance.now() / 1000);

  stateRef.current = { elapsedSeconds, isEngaged, isPaused, isComplete, palette };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    let raf = null;

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

    const drawFogStrata = (w, h, t, chaos, heartbeat, engaged) => {
      const layerCount = Math.floor(lerp(8, 3, heartbeat));
      for (let i = 0; i < layerCount; i++) {
        const depth = i / layerCount;
        const drift = (t * (0.015 + depth * 0.02) + depth * 1.7) % 1;
        const y = h * (drift * 1.15 - 0.08);
        const bandH = h * lerp(0.14, 0.08, heartbeat) * (1 - depth * 0.35);
        const alpha = engaged
          ? lerp(0.06, 0.02, heartbeat) * (1 - depth * 0.4) * (0.5 + chaos * 0.5)
          : 0.02;

        const grad = ctx.createLinearGradient(0, y, 0, y + bandH);
        grad.addColorStop(0, `rgba(107, 154, 170, 0)`);
        grad.addColorStop(0.35, `rgba(107, 154, 170, ${alpha})`);
        grad.addColorStop(0.65, `rgba(143, 181, 150, ${alpha * 0.85})`);
        grad.addColorStop(1, `rgba(107, 154, 170, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, y, w, bandH);
      }
    };

    const drawBreathDiaphragm = (cx, cy, minDim, t, heartbeat, engaged, palette) => {
      if (heartbeat < 0.2 && !engaged) return;

      const amount = breathAmount(t);
      const baseR = minDim * lerp(0.38, 0.28, heartbeat);
      const innerR = baseR * (0.72 + amount * 0.22);
      const alpha = engaged ? 0.18 + heartbeat * 0.35 : 0.08;

      // Outer clinical ring
      ctx.strokeStyle = `rgba(107, 154, 170, ${alpha * 0.5})`;
      ctx.lineWidth = Math.max(1.5, minDim * 0.003);
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 1.08, 0, Math.PI * 2);
      ctx.stroke();

      // Breath fill — soft teal diaphragm
      const fill = ctx.createRadialGradient(cx, cy, innerR * 0.2, cx, cy, innerR);
      fill.addColorStop(0, `rgba(143, 181, 150, ${alpha * 0.45})`);
      fill.addColorStop(0.55, `rgba(107, 154, 170, ${alpha * 0.2})`);
      fill.addColorStop(1, 'rgba(4, 8, 16, 0)');
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.fill();

      // Breath arc indicator
      ctx.strokeStyle = palette?.accent ?? '#6B9AAA';
      ctx.globalAlpha = 0.35 + heartbeat * 0.45;
      ctx.lineWidth = Math.max(2.5, minDim * 0.005);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, innerR * 0.95, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * amount);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const drawDecayCurve = (w, h, progress, heartbeat, cx, cy, minDim) => {
      // Clinical decay trace — descending curve line
      ctx.strokeStyle = `rgba(107, 154, 170, ${0.15 + heartbeat * 0.25})`;
      ctx.lineWidth = Math.max(1, minDim * 0.002);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const t = x / w;
        const curve = 1 - Math.pow(t, 0.65 + progress * 0.35);
        const y = cy + minDim * 0.35 - curve * minDim * 0.55 * (0.4 + progress * 0.6);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Progress marker
      const mx = w * progress;
      const my = cy + minDim * 0.35 - (1 - Math.pow(progress, 0.8)) * minDim * 0.55 * (0.4 + progress * 0.6);
      ctx.fillStyle = `rgba(143, 181, 150, ${0.5 + heartbeat * 0.4})`;
      ctx.beginPath();
      ctx.arc(mx, my, Math.max(3, minDim * 0.008), 0, Math.PI * 2);
      ctx.fill();
    };

    const drawHeartbeatRipples = (cx, cy, minDim, t, heartbeat, engaged) => {
      if (!engaged || heartbeat < 0.15) return;
      const beatIndex = Math.floor(t * HEARTBEAT_HZ);
      for (let i = 0; i < 2; i++) {
        const phase = ((t * HEARTBEAT_HZ + i * 0.5) % 1);
        const r = minDim * (0.12 + phase * lerp(0.55, 0.35, heartbeat));
        const alpha = (1 - phase) * heartbeat * 0.35;
        ctx.strokeStyle = `rgba(143, 181, 150, ${alpha})`;
        ctx.lineWidth = Math.max(1, minDim * 0.0025);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      void beatIndex;
    };

    const draw = () => {
      const { elapsedSeconds: elapsed, isEngaged: engaged, isPaused: paused, isComplete: complete, palette: pal } =
        stateRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const fp = focalPoint(w, h);
      const cx = fp.x;
      const cy = fp.y;
      const minDim = Math.min(w, h);
      const t = performance.now() / 1000 - clockRef.current;
      const state = curveAtElapsed(elapsed);
      const { progress, chaos, heartbeat } = state;

      // Deep clinical void — cool blue-black, never warm amber
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#020610');
      bgGrad.addColorStop(0.45, '#041018');
      bgGrad.addColorStop(1, '#061420');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Soft aurora wash — teal/sage only
      const aurora = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, w * 0.65);
      aurora.addColorStop(0, `rgba(107, 154, 170, ${0.04 + heartbeat * 0.08})`);
      aurora.addColorStop(0.5, `rgba(143, 181, 150, ${0.02 + heartbeat * 0.04})`);
      aurora.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aurora;
      ctx.fillRect(0, 0, w, h);

      if (!paused) {
        drawFogStrata(w, h, t, chaos, heartbeat, engaged);
        drawDecayCurve(w, h, progress, heartbeat, cx, cy, minDim);
        drawHeartbeatRipples(cx, cy, minDim, t, heartbeat, engaged);
        drawBreathDiaphragm(cx, cy, minDim, t, heartbeat, engaged, pal);
      }

      // Completion — soft green-white bloom (not static supernova)
      if (complete) {
        const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.7);
        bloom.addColorStop(0, 'rgba(200, 230, 210, 0.35)');
        bloom.addColorStop(0.4, 'rgba(107, 154, 170, 0.12)');
        bloom.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bloom;
        ctx.fillRect(0, 0, w, h);
      }

      // Vignette — clinical framing
      const vig = ctx.createRadialGradient(w / 2, h / 2, minDim * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, `rgba(0,0,0,${0.25 + chaos * 0.15})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />;
}

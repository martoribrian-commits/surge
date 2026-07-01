import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Procedural canvas visual driven by custom sequence spec.
 */
export default function CustomSequenceVisual({
  visualType = 'pulse',
  palette,
  elapsedSeconds,
  progress,
  isEngaged = true,
  breathCycle = null,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let rafId = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const accent = palette?.accent ?? '#B6502E';
      const calm = palette?.accentCalm ?? accent;
      const t = elapsedSeconds;

      ctx.clearRect(0, 0, w, h);

      const breath =
        breathCycle && isEngaged
          ? (() => {
              const len = breathCycle.inhale + (breathCycle.exhale ?? 6);
              const cycleT = t % len;
              return cycleT < breathCycle.inhale
                ? cycleT / breathCycle.inhale
                : 1 - (cycleT - breathCycle.inhale) / (breathCycle.exhale ?? 6);
            })()
          : 0.5 + 0.5 * Math.sin(t * 0.8);

      const baseR = Math.min(w, h) * (0.18 + progress * 0.12);

      ctx.globalCompositeOperation = 'lighter';

      if (visualType === 'pulse' || visualType === 'field') {
        for (let i = 0; i < 4; i += 1) {
          const r = baseR * (1 + i * 0.35) * (0.85 + breath * 0.3);
          const alpha = (0.22 - i * 0.04) * (0.6 + progress * 0.4);
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = i % 2 === 0 ? hexAlpha(accent, alpha) : hexAlpha(calm, alpha * 0.8);
          ctx.lineWidth = 2 + i;
          ctx.stroke();
        }
      } else if (visualType === 'ripple') {
        for (let i = 0; i < 5; i += 1) {
          const phase = (t * 0.6 + i * 0.4) % 3;
          const r = baseR * (0.5 + phase * 0.55);
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = hexAlpha(calm, 0.18 * (1 - phase / 3));
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      } else if (visualType === 'fog') {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 2.2);
        grad.addColorStop(0, hexAlpha(accent, 0.35 * breath));
        grad.addColorStop(0.5, hexAlpha(calm, 0.12));
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      } else if (visualType === 'ember') {
        for (let i = 0; i < 24; i += 1) {
          const angle = (i / 24) * Math.PI * 2 + t * 0.3;
          const dist = baseR * (0.6 + 0.4 * Math.sin(t * 1.2 + i));
          const x = cx + Math.cos(angle) * dist;
          const y = cy + Math.sin(angle) * dist * 0.7;
          ctx.beginPath();
          ctx.arc(x, y, 2 + breath * 3, 0, Math.PI * 2);
          ctx.fillStyle = hexAlpha(accent, 0.25 + breath * 0.35);
          ctx.fill();
        }
      } else if (visualType === 'gate') {
        const tunnel = baseR * (1.2 + progress * 0.8);
        ctx.beginPath();
        ctx.ellipse(cx, cy, tunnel * 0.35, tunnel, 0, 0, Math.PI * 2);
        ctx.strokeStyle = hexAlpha(accent, 0.35);
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx, cy, tunnel * 0.2, tunnel * 0.55, 0, 0, Math.PI * 2);
        ctx.strokeStyle = hexAlpha(calm, 0.5);
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (visualType === 'thaw') {
        const warmGrad = ctx.createRadialGradient(cx, cy + h * 0.1, 0, cx, cy, baseR * 2);
        warmGrad.addColorStop(0, hexAlpha(accent, 0.4 * (0.3 + progress)));
        warmGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = warmGrad;
        ctx.fillRect(0, 0, w, h);
        ctx.beginPath();
        ctx.arc(cx, cy, baseR * (0.5 + progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = hexAlpha(calm, 0.15 + breath * 0.2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      rafId = requestAnimationFrame(draw);
    };

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [visualType, palette, elapsedSeconds, progress, isEngaged, breathCycle]);

  return (
    <motion.canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
    />
  );
}

function hexAlpha(hex, alpha) {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

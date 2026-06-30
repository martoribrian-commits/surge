import { useEffect, useRef } from 'react';

const STAR_COUNT = 380;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Hyperspace gate — warp tunnel accelerates then decelerates to still core.
 */
export default function NovaGateCanvas({ elapsedSeconds, progress, palette }) {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (starsRef.current.length === 0) {
        starsRef.current = Array.from({ length: STAR_COUNT }, () => ({
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
          z: Math.random(),
          hue: Math.random(),
        }));
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const gold = palette.accent;
    const violet = palette.accentCalm ?? '#9D4EDD';
    const core = palette.copy ?? '#F4F0EB';

    const warpSpeed = (t) => {
      if (t < 12) return lerp(0.008, 0.055, t / 12);
      if (t < 42) return 0.055 + Math.sin((t - 12) * 0.08) * 0.012;
      return lerp(0.055, 0.004, (t - 42) / 18);
    };

    const draw = () => {
      const speed = warpSpeed(elapsedSeconds);
      const cx = w * 0.5;
      const cy = h * 0.5;
      const maxR = Math.hypot(w, h) * 0.55;

      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, w, h);

      const gatePulse = 0.5 + 0.5 * Math.sin(elapsedSeconds * 1.4);
      for (let ring = 0; ring < 5; ring++) {
        const ringT = (elapsedSeconds * 0.15 + ring * 0.2) % 1;
        const radius = maxR * (0.15 + ringT * 0.85);
        const alpha = (1 - ringT) * (0.15 + progress * 0.25) * gatePulse;
        ctx.strokeStyle = ring % 2 === 0 ? `${gold}${Math.round(alpha * 255).toString(16).padStart(2, '0')}` : `${violet}${Math.round(alpha * 200).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 1.5 + (1 - ringT) * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      const stars = starsRef.current;
      for (const s of stars) {
        s.z -= speed;
        if (s.z <= 0.02) {
          s.x = (Math.random() - 0.5) * 2;
          s.y = (Math.random() - 0.5) * 2;
          s.z = 1;
        }

        const k = 1 / s.z;
        const px = cx + s.x * k * w * 0.45;
        const py = cy + s.y * k * h * 0.45;
        const prevK = 1 / (s.z + speed * 2.5);
        const ppx = cx + s.x * prevK * w * 0.45;
        const ppy = cy + s.y * prevK * h * 0.45;

        const streak = Math.min(1, speed * 18);
        const colorMix = s.hue < 0.5 ? gold : violet;
        ctx.strokeStyle = colorMix;
        ctx.globalAlpha = (1 - s.z) * 0.85;
        ctx.lineWidth = 1 + streak * 2.5;
        ctx.beginPath();
        ctx.moveTo(ppx, ppy);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      const coreScale = 0.08 + progress * 0.14 + gatePulse * 0.04;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * coreScale);
      coreGrad.addColorStop(0, core);
      coreGrad.addColorStop(0.35, `${gold}CC`);
      coreGrad.addColorStop(0.7, `${violet}44`);
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * coreScale, 0, Math.PI * 2);
      ctx.fill();

      const vignette = ctx.createRadialGradient(cx, cy, maxR * 0.2, cx, cy, maxR);
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(1, `rgba(0,0,0,${0.55 - progress * 0.2})`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [elapsedSeconds, progress, palette]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />;
}

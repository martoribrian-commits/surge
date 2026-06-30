import { useEffect, useRef } from 'react';

const CRYSTAL_COUNT = 120;
const MOTE_COUNT = 48;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * 60s Still Thaw — frost crystals melt as warmth spreads from the edges inward.
 */
export default function StillThawCanvas({ elapsedSeconds, progress, palette }) {
  const canvasRef = useRef(null);
  const crystalsRef = useRef([]);
  const motesRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;

    const ice = hexToRgb(palette.accent);
    const warm = hexToRgb(palette.accentCalm ?? '#e8a86b');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (crystalsRef.current.length === 0) {
        crystalsRef.current = Array.from({ length: CRYSTAL_COUNT }, () => ({
          x: Math.random(),
          y: Math.random(),
          size: 2 + Math.random() * 6,
          rot: Math.random() * Math.PI,
          edge: Math.random() < 0.65,
        }));
      }
      if (motesRef.current.length === 0) {
        motesRef.current = Array.from({ length: MOTE_COUNT }, () => ({
          x: Math.random(),
          y: Math.random(),
          speed: 0.0008 + Math.random() * 0.002,
          phase: Math.random() * Math.PI * 2,
        }));
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const thaw = Math.min(1, progress * 1.15 + elapsedSeconds / 60);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.48;

      // Warm edge glow rising from bottom
      const warmGrad = ctx.createRadialGradient(cx, h * 1.05, 0, cx, h * 0.55, h * 0.85);
      warmGrad.addColorStop(0, `rgba(${warm.r},${warm.g},${warm.b},${0.35 * thaw})`);
      warmGrad.addColorStop(0.55, `rgba(${warm.r},${warm.g},${warm.b},${0.08 * thaw})`);
      warmGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = warmGrad;
      ctx.fillRect(0, 0, w, h);

      // Side warmth
      for (const side of [-1, 1]) {
        const sx = side < 0 ? 0 : w;
        const sideGrad = ctx.createRadialGradient(sx, h * 0.7, 0, sx, h * 0.5, w * 0.55);
        sideGrad.addColorStop(0, `rgba(${warm.r},${warm.g},${warm.b},${0.18 * thaw})`);
        sideGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sideGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // Frost crystals
      for (const c of crystalsRef.current) {
        const distFromCenter = Math.hypot(c.x - 0.5, c.y - 0.48);
        const meltDelay = c.edge ? 0 : 0.25;
        const melt = Math.max(0, Math.min(1, (thaw - meltDelay) / (1 - meltDelay)));
        const alpha = (1 - melt) * (0.15 + c.edge * 0.35);
        if (alpha < 0.02) continue;

        const px = c.x * w;
        const py = c.y * h;
        const size = c.size * (1 - melt * 0.85);

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(c.rot + elapsedSeconds * 0.02);
        ctx.strokeStyle = `rgba(${ice.r},${ice.g},${ice.b},${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const r = i % 2 === 0 ? size : size * 0.45;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // Rising warmth motes
      for (const m of motesRef.current) {
        if (thaw < 0.12) continue;
        m.y -= m.speed * (0.5 + thaw);
        if (m.y < -0.05) {
          m.y = 1.05;
          m.x = Math.random();
        }
        const pulse = 0.5 + 0.5 * Math.sin(elapsedSeconds * 2 + m.phase);
        const alpha = pulse * 0.45 * thaw * (1 - Math.abs(m.x - 0.5) * 0.6);
        ctx.fillStyle = `rgba(${warm.r},${warm.g},${warm.b},${alpha})`;
        ctx.beginPath();
        ctx.arc(m.x * w, m.y * h, 1.2 + pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      // Central pulse — heartbeat returning
      const pulseT = elapsedSeconds >= 20 ? (elapsedSeconds - 20) / 40 : 0;
      const beat = 0.5 + 0.5 * Math.sin(elapsedSeconds * Math.PI * 2 * lerp(0.3, 0.55, pulseT));
      const coreR = lerp(8, 28 + beat * 12, thaw);
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.5);
      coreGrad.addColorStop(0, `rgba(${warm.r},${warm.g},${warm.b},${0.25 + beat * 0.2 * thaw})`);
      coreGrad.addColorStop(0.4, `rgba(${ice.r},${ice.g},${ice.b},${0.08 * (1 - thaw * 0.7)})`);
      coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 2.5, 0, Math.PI * 2);
      ctx.fill();

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [elapsedSeconds, progress, palette]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}

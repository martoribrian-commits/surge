import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 220;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function mixColor(c1, c2, t) {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  return `rgb(${Math.round(lerp(a.r, b.r, t))},${Math.round(lerp(a.g, b.g, t))},${Math.round(lerp(a.b, b.b, t))})`;
}

function spawnParticle(w, h, burst = false) {
  const angle = Math.random() * Math.PI * 2;
  const speed = burst ? 2.5 + Math.random() * 6 : 0.4 + Math.random() * 1.2;
  return {
    x: w * 0.5 + (Math.random() - 0.5) * w * 0.15,
    y: h * 0.5 + (Math.random() - 0.5) * h * 0.15,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: 1.2 + Math.random() * 3.5,
    twinkle: Math.random() * Math.PI * 2,
  };
}

/**
 * Thermal particle field — ember burst freezes into crystal lattice on hold.
 */
export default function FlashFreezeCanvas({
  elapsedSeconds,
  progress,
  isEngaged,
  isPaused,
  palette,
}) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const burstRef = useRef(false);
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
      if (particlesRef.current.length === 0) {
        particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
          spawnParticle(w, h, true),
        );
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const hot = palette.accent;
    const ice = palette.accentCalm ?? '#7DD3FC';
    const core = palette.copy ?? '#F4F0EB';

    const draw = (time) => {
      const freezeTarget = isEngaged && !isPaused
        ? Math.min(1, progress * 1.15 + elapsedSeconds / 30)
        : Math.max(0, progress * 0.35 - 0.15);
      const freeze = freezeTarget;

      if (isEngaged && !burstRef.current && elapsedSeconds > 0) {
        burstRef.current = true;
        particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
          spawnParticle(w, h, true),
        );
      }

      ctx.fillStyle = `rgba(0,0,0,${0.22 + freeze * 0.35})`;
      ctx.fillRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.5;
      const heatGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.55);
      heatGlow.addColorStop(0, `${hot}${Math.round((1 - freeze) * 40).toString(16).padStart(2, '0')}`);
      heatGlow.addColorStop(0.5, `${ice}${Math.round(freeze * 35).toString(16).padStart(2, '0')}`);
      heatGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = heatGlow;
      ctx.fillRect(0, 0, w, h);

      const particles = particlesRef.current;
      const damp = isEngaged ? 0.92 + freeze * 0.07 : 0.985;
      const pull = freeze * 0.018;

      for (const p of particles) {
        if (isEngaged) {
          p.vx += (cx - p.x) * pull;
          p.vy += (cy - p.y) * pull;
        } else if (!isPaused) {
          p.vx += (Math.random() - 0.5) * 0.08;
          p.vy += (Math.random() - 0.5) * 0.08;
        }
        p.vx *= damp;
        p.vy *= damp;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > w) p.vx *= -0.6;
        if (p.y < 0 || p.y > h) p.vy *= -0.6;
      }

      if (freeze > 0.45) {
        ctx.lineWidth = 0.6;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i];
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = dx * dx + dy * dy;
            if (dist < 2800) {
              const alpha = (1 - dist / 2800) * freeze * 0.35;
              ctx.strokeStyle = mixColor(ice, core, 0.3);
              ctx.globalAlpha = alpha;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = 1;
      }

      for (const p of particles) {
        const t = freeze + Math.sin(time * 0.003 + p.twinkle) * 0.05;
        const color = mixColor(hot, ice, Math.min(1, t));
        const sz = p.size * (1 + freeze * 0.4);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.55 + freeze * 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
        ctx.fill();

        if (freeze > 0.55) {
          ctx.strokeStyle = `${core}88`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x - sz * 1.8, p.y);
          ctx.lineTo(p.x + sz * 1.8, p.y);
          ctx.moveTo(p.x, p.y - sz * 1.8);
          ctx.lineTo(p.x, p.y + sz * 1.8);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [elapsedSeconds, progress, isEngaged, isPaused, palette]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />;
}

import { useEffect, useRef } from 'react';
import { curveAtElapsed } from '../../../lib/surgeCurve';

/**
 * Full-screen animated TV static — layered on Static Field for peak chaos intensity.
 */
export default function TvStaticCanvas({ elapsedSeconds, isEngaged, isPaused }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ elapsedSeconds, isEngaged, isPaused });

  stateRef.current = { elapsedSeconds, isEngaged, isPaused };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let imageData = null;
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
      imageData = ctx.createImageData(Math.ceil(w / 2), Math.ceil(h / 2));
    };

    const draw = () => {
      const { elapsedSeconds: elapsed, isEngaged: engaged, isPaused: paused } = stateRef.current;
      const state = curveAtElapsed(elapsed);
      const { chaos } = state;

      if (!engaged || paused || chaos < 0.08) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        raf = requestAnimationFrame(draw);
        return;
      }

      const w = window.innerWidth;
      const h = window.innerHeight;
      const intensity = 0.15 + chaos * 0.85;
      const data = imageData.data;
      const sw = imageData.width;
      const sh = imageData.height;

      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255 * intensity;
        data[i] = v;
        data[i + 1] = v * (0.92 + Math.random() * 0.08);
        data[i + 2] = v * (0.88 + Math.random() * 0.1);
        data[i + 3] = 255 * (0.35 + chaos * 0.55);
      }

      ctx.clearRect(0, 0, w, h);
      const off = document.createElement('canvas');
      off.width = sw;
      off.height = sh;
      off.getContext('2d').putImageData(imageData, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, w, h);

      // Scan lines
      ctx.fillStyle = `rgba(0,0,0,${0.08 + chaos * 0.12})`;
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
      }

      // Peak strobe flash — disabled under prefers-reduced-motion
      if (!reducedMotion && chaos > 0.55 && Math.random() > 0.92) {
        ctx.fillStyle = `rgba(255,255,255,${0.04 + chaos * 0.08})`;
        ctx.fillRect(0, 0, w, h);
      }

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

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[3] mix-blend-screen"
      aria-hidden
    />
  );
}

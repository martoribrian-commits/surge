import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { MARK_PATH, VIEWBOX } from './SurgeLockup';

/**
 * Animated decay curve logomark — brand v1.1 hero visual.
 */
export default function DecayHero({ className = '', compact = false }) {
  const curveRef = useRef(null);
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), { stiffness: 120, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 120, damping: 18 });

  useEffect(() => {
    if (reducedMotion || !curveRef.current) return undefined;
    const curve = curveRef.current;
    const length = curve.getTotalLength();
    curve.style.strokeDasharray = `${length}`;
    curve.style.strokeDashoffset = `${length}`;

    const start = performance.now();
    const cycleMs = 4200;
    let raf;

    const tick = (now) => {
      const t = ((now - start) % cycleMs) / cycleMs;
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      curve.style.strokeDashoffset = `${length * (1 - eased)}`;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  return (
    <motion.div
      className={`relative mx-auto ${compact ? 'w-48' : 'w-full max-w-[22rem]'} ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={(e) => {
        if (reducedMotion) return;
        const rect = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - rect.left) / rect.width - 0.5);
        my.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <svg
        viewBox={VIEWBOX}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block h-auto w-full drop-shadow-[0_0_32px_rgba(182,80,46,0.12)]"
        aria-hidden
      >
        <path d="M6 58 L134 58" stroke="rgba(244,240,235,0.08)" strokeWidth="1" />
        <path
          ref={curveRef}
          d={MARK_PATH}
          stroke="#B6502E"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          style={reducedMotion ? { strokeDashoffset: 0 } : undefined}
        />
        <circle cx="134" cy="58" r="3.5" fill="#F4F0EB" />
        <circle cx="134" cy="58" r="1.5" fill="#B6502E" />
        {!reducedMotion ? (
          <motion.circle
            cx="134"
            cy="58"
            r="8"
            fill="none"
            stroke="#B6502E"
            strokeWidth="1"
            animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : null}
      </svg>
    </motion.div>
  );
}

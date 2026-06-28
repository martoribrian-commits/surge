import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SNAP, EASE_OUT } from './shared/motionPresets';

const SHARDS = [
  { x: 12, y: 18, s: 64, rot: 15, delay: 0 },
  { x: 68, y: 12, s: 48, rot: -28, delay: 0.08 },
  { x: 52, y: 62, s: 72, rot: 42, delay: 0.04 },
  { x: 22, y: 55, s: 40, rot: -12, delay: 0.12 },
  { x: 78, y: 48, s: 52, rot: 33, delay: 0.06 },
  { x: 42, y: 28, s: 36, rot: -40, delay: 0.1 },
];

/**
 * 30s Instant Reset — vibrating acute geometry → snap to indigo ripples at 10s.
 */
export default function InstantResetVisual({
  elapsedSeconds,
  transitionAtSeconds = 10,
  palette,
  onTransition,
}) {
  const isCalm = elapsedSeconds >= transitionAtSeconds;
  const [flash, setFlash] = useState(false);
  const preTransition = Math.min(1, elapsedSeconds / transitionAtSeconds);

  useEffect(() => {
    if (isCalm && onTransition) onTransition();
  }, [isCalm, onTransition]);

  useEffect(() => {
    if (isCalm) {
      setFlash(true);
      const t = window.setTimeout(() => setFlash(false), 420);
      return () => window.clearTimeout(t);
    }
  }, [isCalm]);

  const shake = useMemo(
    () => ({
      x: [0, -5, 6, -4, 5, 0],
      y: [0, 4, -5, 3, -2, 0],
    }),
    [],
  );

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Acute chromatic wash */}
      {!isCalm && (
        <motion.div
          className="absolute inset-0 mix-blend-screen"
          style={{
            background: `radial-gradient(circle at 50% 42%, ${palette.accent}88 0%, transparent 48%)`,
          }}
          animate={{ opacity: [0.35, 0.65, 0.35], ...shake }}
          transition={{ duration: 0.28, repeat: Infinity }}
        />
      )}

      <AnimatePresence mode="wait">
        {!isCalm ? (
          <motion.div
            key="acute"
            className="absolute inset-0"
            exit={{ opacity: 0, scale: 1.08, filter: 'blur(12px)' }}
            transition={SNAP}
          >
            {/* Scan lines */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)',
              }}
            />

            {SHARDS.map((g, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${g.x}%`,
                  top: `${g.y}%`,
                  width: 0,
                  height: 0,
                  borderLeft: `${g.s * 0.45}px solid transparent`,
                  borderRight: `${g.s * 0.45}px solid transparent`,
                  borderBottom: `${g.s}px solid ${palette.accent}`,
                  filter: `drop-shadow(0 0 12px ${palette.accent})`,
                }}
                animate={{
                  rotate: [g.rot, g.rot + 14, g.rot - 10, g.rot],
                  scale: [1, 1.12, 0.94, 1],
                  opacity: [0.5, 1, 0.65, 0.5],
                }}
                transition={{
                  duration: 0.38 + g.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}

            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              animate={{ scale: [0.85, 1.2, 0.85], rotate: [0, 90, 180] }}
              transition={{ duration: 0.55, repeat: Infinity }}
            >
              <div
                className="h-28 w-28 border-2"
                style={{
                  borderColor: palette.accent,
                  boxShadow: `0 0 40px ${palette.accent}, inset 0 0 24px ${palette.accent}44`,
                }}
              />
            </motion.div>

            <motion.div
              className="absolute left-1/2 top-1/2 h-[76%] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed"
              style={{ borderColor: palette.accent }}
              animate={{ rotate: 360, opacity: [0.3, 0.7, 0.3] }}
              transition={{
                rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
                opacity: { duration: 1.2, repeat: Infinity },
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="calm"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
          >
            {[0, 1, 2, 3, 4, 5].map((ring) => (
              <motion.div
                key={ring}
                className="absolute rounded-full"
                style={{
                  border: `1px solid ${palette.accentCalm}`,
                  width: `${24 + ring * 14}vmin`,
                  height: `${24 + ring * 14}vmin`,
                  boxShadow: `0 0 ${20 + ring * 8}px ${palette.accentCalm}33`,
                }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{
                  scale: [0.88, 1.06, 0.88],
                  opacity: [0.15, 0.55 - ring * 0.06, 0.15],
                }}
                transition={{
                  duration: 3.8 + ring * 0.5,
                  repeat: Infinity,
                  delay: ring * 0.12,
                  ease: 'easeInOut',
                }}
              />
            ))}

            <motion.div
              className="relative h-4 w-4 rounded-full"
              style={{
                backgroundColor: palette.accentCalm,
                boxShadow: `0 0 32px ${palette.accentCalm}, 0 0 64px ${palette.accentCalm}88`,
              }}
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 2.8, repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transition flash */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key="flash"
            className="pointer-events-none absolute inset-0 z-10 bg-white"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          />
        )}
      </AnimatePresence>

      {/* Pre-transition intensity vignette */}
      {!isCalm && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, transparent ${30 + preTransition * 20}%, rgba(0,0,0,0.75) 100%)`,
          }}
        />
      )}
    </div>
  );
}

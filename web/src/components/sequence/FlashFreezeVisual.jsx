import { motion, AnimatePresence } from 'framer-motion';
import FlashFreezeCanvas from './shared/FlashFreezeCanvas';
import { shellGradient } from './shared/groundStyles';
import { EASE_OUT } from './shared/motionPresets';

/**
 * 30s Flash Freeze — hold to stop thermal chaos mid-air; embers crystallize.
 */
export default function FlashFreezeVisual({
  elapsedSeconds,
  progress,
  palette,
  isEngaged,
  isPaused,
}) {
  const freezeLevel = isEngaged ? Math.min(1, progress * 1.1) : 0;
  const showFlash = freezeLevel > 0.35 && freezeLevel < 0.42;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: shellGradient(palette) }}
    >
      <FlashFreezeCanvas
        elapsedSeconds={elapsedSeconds}
        progress={progress}
        isEngaged={isEngaged}
        isPaused={isPaused}
        palette={palette}
      />

      {/* Heat shimmer pre-freeze */}
      {!isEngaged && elapsedSeconds < 2 && (
        <motion.div
          className="pointer-events-none absolute inset-0 mix-blend-screen"
          style={{
            background: `radial-gradient(circle at 50% 48%, ${palette.accent}55 0%, transparent 55%)`,
          }}
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.04, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
      )}

      {/* Ice bloom overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: freezeLevel * 0.45 }}
        style={{
          background: `radial-gradient(circle at 50% 50%, ${palette.accentCalm}44 0%, transparent 62%)`,
        }}
      />

      <AnimatePresence>
        {showFlash && (
          <motion.div
            key="freeze-flash"
            className="pointer-events-none absolute inset-0 z-10 bg-white"
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
          />
        )}
      </AnimatePresence>

      {/* Crystal core */}
      {freezeLevel > 0.5 && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.9 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <div
            className="h-16 w-16 rotate-45 border-2"
            style={{
              borderColor: palette.accentCalm,
              boxShadow: `0 0 40px ${palette.accentCalm}, inset 0 0 20px ${palette.copy}44`,
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

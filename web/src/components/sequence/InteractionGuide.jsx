import { motion, AnimatePresence } from 'framer-motion';
import { EASE_OUT } from './shared/motionPresets';

const MODE_COPY = {
  auto: { label: 'Runs automatically', action: 'Breathe with the field' },
  bilateral: { label: 'Alternate touch', action: 'Left · Right · Left' },
  hold: { label: 'Press and hold', action: 'Release to pause' },
};

/**
 * Bottom-centered interaction cue — large, legible, no gamification.
 */
export default function InteractionGuide({
  mode,
  hint,
  isPaused,
  isComplete,
  accent,
  accentCalm,
}) {
  const meta = MODE_COPY[mode] ?? MODE_COPY.hold;
  const displayHint = isComplete ? 'Complete' : hint ?? meta.action;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex flex-col items-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8">
      <div
        className="mb-4 h-px w-12 opacity-40"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />

      <AnimatePresence mode="wait">
        <motion.p
          key={displayHint}
          className="text-center font-sans text-[clamp(2rem,7vw,3.25rem)] font-semibold uppercase tracking-[0.06em]"
          style={{ color: isPaused ? accentCalm ?? accent : '#F4F0EB' }}
          initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
          animate={{ opacity: isPaused ? 0.7 : 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
        >
          {displayHint}
        </motion.p>
      </AnimatePresence>

      <p className="mt-3 font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">
        {meta.label}
      </p>
    </div>
  );
}

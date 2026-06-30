import { motion, AnimatePresence } from 'framer-motion';

/**
 * Countdown banner when Crane auto-launches a sequence.
 */
export default function CraneAutoLaunchBanner({ pending, secondsLeft, onCancel, onLaunchNow }) {
  if (!pending) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="mx-5 mb-3 shrink-0 rounded-sm border border-[#B6502E]/40 bg-[#B6502E]/10 px-4 py-3"
        role="status"
        aria-live="polite"
      >
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B6502E]">
          Launching {pending.label?.replace(/^Begin /, '') ?? 'sequence'}
        </p>
        <p className="mt-1 font-sans text-[12px] text-[#F4F0EB]/90">
          Starting in {secondsLeft}s
          {pending.prepNote ? (
            <span className="block mt-1 text-[10px] text-white/40">{pending.prepNote}</span>
          ) : null}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm border border-white/15 px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.12em] text-white/50 hover:text-white/80"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onLaunchNow}
            className="rounded-sm border border-[#B6502E]/50 bg-[#B6502E]/15 px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.12em] text-[#F4F0EB]"
          >
            Start now
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

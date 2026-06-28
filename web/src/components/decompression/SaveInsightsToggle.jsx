import { motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

/**
 * Quiet opt-in persistence — Save Insights Locally.
 */
export default function SaveInsightsToggle({ enabled, onToggle, retentionLabel }) {
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className="group flex items-center gap-3 border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 transition-colors hover:border-white/[0.12]"
      >
        <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 transition-colors group-hover:text-white/55">
          Save insights locally
        </span>

        <span
          className="relative h-4 w-8 shrink-0 rounded-full border border-white/10"
          aria-hidden="true"
        >
          <motion.span
            className="absolute top-0.5 h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: enabled ? '#B6502E' : 'rgba(244,240,235,0.25)' }}
            animate={{ left: enabled ? 'calc(100% - 0.625rem - 2px)' : '2px' }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          />
        </span>
      </button>

      <motion.p
        key={retentionLabel}
        className="font-sans text-[10px] tracking-[0.06em] text-white/28"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        {retentionLabel}
      </motion.p>
    </div>
  );
}

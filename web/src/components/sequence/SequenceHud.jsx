import { motion } from 'framer-motion';
import VariantTabBar from './VariantTabBar';
import { VARIANT_LIST } from '../../sequences';

/**
 * HUD — variant identity, timer, progress. Change control when paused.
 */
export default function SequenceHud({
  variant,
  elapsedSeconds,
  progress,
  phaseLabel,
  isPaused,
  onChangeSequence,
  showVariantSwitcher = false,
  activeVariantId,
  onSelectVariant,
}) {
  const remaining = Math.max(0, Math.ceil(variant.durationSeconds - elapsedSeconds));

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
              {variant.name}
            </p>
            <p
              className="mt-0.5 font-sans text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: variant.palette.accentCalm ?? variant.palette.accent }}
            >
              {phaseLabel}
            </p>
          </div>
          <p
            className="font-sans text-2xl font-light tabular-nums tracking-tight text-[#F4F0EB]"
            style={{ opacity: isPaused ? 0.45 : 0.9 }}
          >
            {remaining}
          </p>
        </div>

        <div className="h-0.5 w-full max-w-xs overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full origin-left rounded-full"
            style={{
              background: `linear-gradient(90deg, ${variant.palette.accent}, ${variant.palette.accentCalm ?? variant.palette.accent})`,
            }}
            animate={{ scaleX: progress }}
            initial={false}
            transition={{ duration: 0.15, ease: 'linear' }}
          />
        </div>
      </div>

      {showVariantSwitcher && onSelectVariant && (
        <div className="pointer-events-auto absolute inset-x-0 top-[max(5.5rem,env(safe-area-inset-top))] z-30 px-5">
          <VariantTabBar activeId={activeVariantId} onSelect={onSelectVariant} />
        </div>
      )}

      {isPaused && onChangeSequence && (
        <div className="pointer-events-auto absolute right-5 top-[max(1rem,env(safe-area-inset-top))] z-30">
          <button
            type="button"
            onClick={onChangeSequence}
            className="border border-white/10 bg-black/40 px-3 py-2 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55 backdrop-blur-sm transition-colors hover:border-white/25 hover:text-[#F4F0EB]"
          >
            Change
          </button>
        </div>
      )}
    </>
  );
}

/** Compact in-session variant pills (paused only) — re-export list for docs */
export { VARIANT_LIST };

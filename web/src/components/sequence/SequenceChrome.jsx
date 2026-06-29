import { motion } from 'framer-motion';
import SurgeLockup from '../brand/SurgeLockup';
import { BRAND } from '../../brand/tokens';

/**
 * Always-on-top session chrome — exit, timer, progress.
 * Lives at z-50; never shares pointer capture with hold/bilateral surfaces.
 */
export default function SequenceChrome({
  variant,
  elapsedSeconds,
  progress,
  phaseLabel,
  isPaused,
  onExit,
  onChangeSequence,
}) {
  const remaining = Math.max(0, Math.ceil(variant.durationSeconds - elapsedSeconds));
  const safeProgress = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  const accent = variant.palette.accentCalm ?? variant.palette.accent;

  return (
    <header
      data-sequence-chrome
      className="pointer-events-auto absolute inset-x-0 top-0 z-50 flex flex-col gap-2.5 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/95 via-[#0A0A0A]/75 to-transparent"
        aria-hidden
      />

      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0 shrink">
          <SurgeLockup size="sm" href={null} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isPaused && onChangeSequence ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChangeSequence();
              }}
              className="min-h-[44px] min-w-[44px] border border-white/12 bg-black/50 px-3 py-2 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-white/60 backdrop-blur-sm transition-colors hover:border-white/25 hover:text-[#F4F0EB]"
            >
              Change
            </button>
          ) : null}
          {onExit ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExit();
              }}
              className="min-h-[44px] border border-[#B6502E]/55 bg-[#B6502E]/10 px-4 py-2 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-[#F4F0EB] backdrop-blur-sm transition-colors hover:border-[#B6502E] hover:bg-[#B6502E]/20"
            >
              Exit
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
            {variant.name}
          </p>
          <p
            className="mt-0.5 font-sans text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: accent }}
          >
            {phaseLabel}
          </p>
        </div>
        <p
          className="shrink-0 font-sans text-[clamp(1.75rem,5vw,2.25rem)] font-light tabular-nums tracking-tight"
          style={{ color: BRAND.bone, opacity: isPaused ? 0.45 : 0.92 }}
        >
          {remaining}
        </p>
      </div>

      <div className="relative h-0.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
        <motion.div
          className="h-full origin-left rounded-full"
          style={{
            background: `linear-gradient(90deg, ${variant.palette.accent}, ${accent})`,
          }}
          animate={{ scaleX: safeProgress }}
          initial={false}
          transition={{ duration: 0.15, ease: 'linear' }}
        />
      </div>
    </header>
  );
}

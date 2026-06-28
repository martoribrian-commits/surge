import { motion } from 'framer-motion';
import { useSequenceSession } from '../context/SequenceSessionProvider';
import { SequencePicker, SequencePreview } from '../components/sequence';
import FilmGrainOverlay from '../components/FilmGrainOverlay';
import { getVariant } from '../sequences';

/**
 * Entry — tab bar (30/60/90), live preview, interaction copy. Zero friction switching.
 */
export default function SequenceEntryView() {
  const { variantId, selectVariant, beginRegulation } = useSequenceSession();
  const variant = getVariant(variantId);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0A0A0A]">
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          background: `radial-gradient(ellipse 90% 60% at 50% 0%, ${variant.palette.accent}14 0%, transparent 55%)`,
        }}
        transition={{ duration: 0.8 }}
      />
      <FilmGrainOverlay />

      <motion.div
        className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-[max(1.5rem,env(safe-area-inset-top))] pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <header className="mb-8 text-center">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B6502E]">
            Somatic circuit breaker
          </p>
          <h1 className="mt-3 font-sans text-[clamp(1.5rem,4vw,2rem)] font-extrabold tracking-tight text-[#F4F0EB]">
            Choose your sequence
          </h1>
          <p className="mx-auto mt-2 max-w-sm font-sans text-sm leading-relaxed text-white/45">
            Tap 30, 60, or 90 above. Preview updates instantly. No account required.
          </p>
        </header>

        <div className="mb-8">
          <SequencePreview variantId={variantId} />
        </div>

        <SequencePicker activeId={variantId} onSelect={selectVariant} />

        <div className="mt-auto pt-10">
          <motion.button
            type="button"
            className="group relative w-full overflow-hidden border px-6 py-5 font-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-[#F4F0EB]"
            style={{
              borderColor: `${variant.palette.accent}66`,
              background: `linear-gradient(135deg, ${variant.palette.accent}22, ${variant.palette.accentCalm ?? variant.palette.accent}12)`,
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.985 }}
            onClick={beginRegulation}
          >
            <motion.span
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${variant.palette.accent}28 0%, transparent 70%)`,
              }}
            />
            <span className="relative">Begin {variant.durationSeconds}s cycle</span>
          </motion.button>

          <p className="mt-4 text-center font-sans text-[10px] tracking-[0.08em] text-white/30">
            Swipe durations anytime before you start
          </p>
        </div>
      </motion.div>
    </div>
  );
}

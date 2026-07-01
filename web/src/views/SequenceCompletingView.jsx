import { motion } from 'framer-motion';
import { useSequenceSession } from '../context/SequenceSessionProvider';
import { InteractionMode } from '../sequences';
import FilmGrainOverlay from '../components/FilmGrainOverlay';
import { BRAND } from '../brand/tokens';

const EASE = [0.25, 0.1, 0.25, 1];

/**
 * Completion hold — mirrors original engine finishCycle (3.2s supernova + copy).
 */
export default function SequenceCompletingView() {
  const { variant, durationSeconds } = useSequenceSession();
  const subcopy =
    variant.interactionMode === InteractionMode.HOLD
      ? `You held for ${durationSeconds} seconds. Release when ready.`
      : variant.interactionMode === InteractionMode.BILATERAL
        ? `${durationSeconds} seconds of bilateral grounding complete.`
        : `${durationSeconds} seconds complete. Steady breath.`;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[55] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0.35] }}
        transition={{ duration: 2.4, ease: EASE }}
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 45%, ${BRAND.bone}55 0%, ${BRAND.clay}22 35%, transparent 70%)`,
        }}
      />

      <FilmGrainOverlay />

      <motion.div
        className="relative z-10 px-8 text-center"
        initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1.1, delay: 0.3, ease: EASE }}
      >
        <p
          className="font-sans text-[11px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: BRAND.clay }}
        >
          {variant.name} · complete
        </p>
        <p
          className="mt-4 font-sans text-[clamp(1.5rem,5vw,2.25rem)] font-semibold tracking-tight"
          style={{ color: BRAND.bone }}
        >
          The system has reset.
        </p>
        <p className="mt-3 font-sans text-sm tracking-[0.06em]" style={{ color: BRAND.boneMuted }}>
          {subcopy}
        </p>
      </motion.div>
    </motion.div>
  );
}

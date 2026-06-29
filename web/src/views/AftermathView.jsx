import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSequenceSession } from '../context/SequenceSessionProvider';
import { useCraneOptional } from '../context/CraneProvider';
import RecoveryGrid from '../components/aftermath/RecoveryGrid';
import EphemeralInput from '../components/aftermath/EphemeralInput';
import CraneHandoff from '../components/aftermath/CraneHandoff';
import FilmGrainOverlay from '../components/FilmGrainOverlay';
import { BRAND } from '../brand/tokens';

/**
 * Post-sequence aftermath — variant-aware, on-brand clay/bone palette.
 */
export default function AftermathView() {
  const { sessionId, durationSeconds, variant, reset } = useSequenceSession();
  const crane = useCraneOptional();
  const [brainDumpText, setBrainDumpText] = useState('');

  return (
    <motion.div
      className="relative min-h-screen overflow-hidden"
      style={{ background: BRAND.void, color: BRAND.bone }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${BRAND.emberGlow} 0%, transparent 55%)`,
        }}
      />
      <FilmGrainOverlay />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-24">
        <motion.header
          className="mb-14 max-w-2xl md:mb-20"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15 }}
        >
          <p
            className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: BRAND.clay }}
          >
            After your {variant.name}
          </p>
          <h1 className="font-sans text-3xl font-extrabold tracking-tight md:text-4xl">
            You held for {durationSeconds} seconds.
          </h1>
          <p className="mt-5 font-sans text-base leading-relaxed" style={{ color: BRAND.boneMuted }}>
            {variant.whatItDoes} The cycle is behind you — these are quiet next steps when you are
            ready. Nothing here requires an account.
          </p>
        </motion.header>

        <RecoveryGrid
          brainDumpSlot={
            <EphemeralInput sessionId={sessionId} onChange={setBrainDumpText} />
          }
        />

        <div className="mt-8">
          <CraneHandoff sessionId={sessionId} brainDumpText={brainDumpText} />
        </div>

        <div className="mt-16 flex flex-col items-center gap-6 border-t border-white/[0.06] pt-12">
          <button
            type="button"
            onClick={reset}
            className="border px-6 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.24em] transition-colors hover:bg-[#B6502E]/15"
            style={{ color: BRAND.bone, borderColor: `${BRAND.clay}66` }}
          >
            Begin another cycle
          </button>
          {crane ? (
            <button
              type="button"
              onClick={crane.openCrane}
              className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hover:text-[#B6502E]"
              style={{ color: BRAND.boneDim }}
            >
              Ask Crane what just happened in your body
            </button>
          ) : null}
          <p
            className="max-w-md text-center font-sans text-[10px] leading-relaxed"
            style={{ color: BRAND.boneDim }}
          >
            For acute nervous system regulation. Not a substitute for emergency medical care.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

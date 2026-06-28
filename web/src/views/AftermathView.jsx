import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSequenceSession } from '../context/SequenceSessionProvider';
import RecoveryGrid from '../components/aftermath/RecoveryGrid';
import EphemeralInput from '../components/aftermath/EphemeralInput';
import CraneHandoff from '../components/aftermath/CraneHandoff';

/**
 * Post-surge aftermath — sparse recovery grid, ephemeral input, Crane handoff.
 */
export default function AftermathView() {
  const { sessionId, durationSeconds, reset } = useSequenceSession();
  const [brainDumpText, setBrainDumpText] = useState('');

  return (
    <motion.div
      className="min-h-screen bg-[#070b09] text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-24">
        <motion.header
          className="mb-14 max-w-2xl md:mb-20"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15 }}
        >
          <p className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7fa892]">
            The aftermath
          </p>
          <h1 className="font-sans text-3xl font-semibold tracking-tight text-[#eef4f0] md:text-4xl">
            You held for {durationSeconds} seconds.
          </h1>
          <p className="mt-5 font-sans text-base leading-relaxed text-[#9eb5a8]">
            The cycle is complete. These are quiet next steps when you are ready.
            Nothing here requires an account.
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
            className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6d8578] transition-colors hover:text-[#eef4f0]"
          >
            Begin another cycle
          </button>
          <p className="max-w-md text-center font-sans text-[10px] leading-relaxed text-[#4a5f54]">
            For acute nervous system regulation. Not a substitute for emergency medical care.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

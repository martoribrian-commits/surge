import { motion } from 'framer-motion';
import { useSequenceSession } from '../../context/SequenceSessionProvider';

/**
 * Quiet opt-in to Crane decompression — in-flow, client-only retention.
 */
export default function CraneHandoff({ sessionId: _sessionId, brainDumpText }) {
  const { enterDecompression } = useSequenceSession();

  return (
    <motion.div
      className="rounded-sm border border-white/[0.07] bg-white/[0.02] p-8 md:p-10"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B6502E]">
        04
      </p>
      <h3 className="font-sans text-xl font-semibold tracking-tight text-[#F4F0EB] md:text-2xl">
        Crane
      </h3>
      <p className="mt-4 max-w-lg font-sans text-sm leading-relaxed text-white/45">
        Offload what surfaced. Ephemeral by default. Auto-deletes in 24 hours unless you
        choose to save insights locally.
      </p>
      {brainDumpText?.trim() ? (
        <p className="mt-3 font-sans text-[10px] text-white/30">
          Your brain dump will carry into Crane.
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => enterDecompression(brainDumpText)}
        className="mt-8 border border-[#B6502E]/35 bg-[#B6502E]/08 px-6 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F4F0EB] transition-colors duration-500 hover:border-[#B6502E]/60 hover:bg-[#B6502E]/15"
      >
        Open Crane
      </button>
      <p className="mt-4 font-sans text-[10px] text-white/28">
        Optional. All data stays on this device.
      </p>
    </motion.div>
  );
}

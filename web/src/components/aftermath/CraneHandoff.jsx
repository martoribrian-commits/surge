import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useCraneOptional } from '../../context/CraneProvider';
import { useSequenceSession } from '../../context/SequenceSessionProvider';
import { fetchCraneContext, requestPostSessionCarePlan } from '../../lib/craneClient';
import { loadCarePlan, saveCarePlan } from '../../lib/craneCarePlanUtils';
import CraneCarePlan from '../crane/CraneCarePlan';

/**
 * Quiet opt-in to Crane decompression — shows care plan preview when available.
 */
export default function CraneHandoff({ sessionId, brainDumpText, variantId }) {
  const { enterDecompression } = useSequenceSession();
  const crane = useCraneOptional();
  const [carePlan, setCarePlan] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const cached = loadCarePlan(sessionId);
    if (cached?.steps?.length) {
      setCarePlan(cached);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const context = await fetchCraneContext(sessionId);
        const enriched = { ...context, variantId: variantId ?? context?.variantId };
        const inference = await requestPostSessionCarePlan({
          supabaseContext: enriched,
          sessionMeta: { advisorCallsTotal: 0, turnCount: 0 },
        });
        if (cancelled) return;
        if (inference.carePlan) {
          saveCarePlan(sessionId, inference.carePlan);
          setCarePlan(inference.carePlan);
        }
      } catch {
        /* care plan preview is optional */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, variantId]);

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
        Offload what surfaced — or ask Crane for a post-session recovery plan and plain-language
        explanation of what just happened in your body. Ephemeral by default.
      </p>

      {loading ? (
        <p className="mt-6 font-sans text-[11px] text-white/30">Preparing your recovery plan…</p>
      ) : null}

      {carePlan ? (
        <div className="mt-6">
          <CraneCarePlan carePlan={carePlan} compact />
        </div>
      ) : null}

      {brainDumpText?.trim() ? (
        <p className="mt-3 font-sans text-[10px] text-white/30">
          Your brain dump will carry into Crane.
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => enterDecompression(brainDumpText)}
          className="border border-[#B6502E]/35 bg-[#B6502E]/08 px-6 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F4F0EB] transition-colors duration-500 hover:border-[#B6502E]/60 hover:bg-[#B6502E]/15"
        >
          Open Crane
        </button>
        {crane ? (
          <button
            type="button"
            onClick={crane.openCrane}
            className="border border-white/10 px-6 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50 transition-colors hover:border-white/25 hover:text-white/80"
          >
            Quick guide
          </button>
        ) : null}
      </div>
      <p className="mt-4 font-sans text-[10px] text-white/28">
        Optional. All data stays on this device.
      </p>
    </motion.div>
  );
}

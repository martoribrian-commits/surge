import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTokenManager } from '../../hooks/useTokenManager';
import { useSequenceSession } from '../../context/SequenceSessionProvider';
import { fetchCraneContext, requestPostSessionCarePlan } from '../../lib/craneClient';
import {
  loadBodyInsight,
  loadCarePlan,
  saveBodyInsight,
  saveCarePlan,
} from '../../lib/craneCarePlanUtils';
import { useCarePlan } from '../../hooks/useCarePlan';
import CraneBodyInsight from '../crane/CraneBodyInsight';
import CraneCarePlan from '../crane/CraneCarePlan';
import CraneClinicalGate from '../crane/CraneClinicalGate';

/**
 * Quiet opt-in to Crane decompression — shows AI care plan + body debrief when token unlocked.
 */
export default function CraneHandoff({ sessionId, brainDumpText, variantId }) {
  const { enterDecompression } = useSequenceSession();
  const { isCraneUnlocked } = useTokenManager();
  const { carePlan, setPlan, toggleStep } = useCarePlan(sessionId);
  const [bodyInsight, setBodyInsight] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const cachedPlan = loadCarePlan(sessionId);
    const cachedInsight = loadBodyInsight(sessionId);
    if (cachedPlan?.steps?.length) setPlan(cachedPlan);
    if (cachedInsight) setBodyInsight(cachedInsight);
    if (cachedPlan && cachedInsight) return;

    if (!isCraneUnlocked) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const context = await fetchCraneContext(sessionId);
        const enriched = { ...context, variantId: variantId ?? context?.variantId };
        const inference = await requestPostSessionCarePlan({
          supabaseContext: enriched,
          sessionMeta: { advisorCallsTotal: 0, turnCount: 0 },
          clinicalAccess: true,
        });
        if (cancelled || inference.requiresClinicalToken) return;
        if (inference.carePlan) {
          saveCarePlan(sessionId, inference.carePlan);
          setPlan(inference.carePlan);
        }
        if (inference.bodyInsight) {
          saveBodyInsight(sessionId, inference.bodyInsight);
          setBodyInsight(inference.bodyInsight);
        }
      } catch {
        /* optional */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, variantId, isCraneUnlocked, setPlan]);

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
        Offload what surfaced — or get a clinical body debrief and recovery plan powered by
        Crane&apos;s advisor AI. Ephemeral by default.
      </p>

      {loading ? (
        <p className="mt-6 font-sans text-[11px] text-white/30">Preparing your recovery plan…</p>
      ) : null}

      {bodyInsight ? (
        <div className="mt-6">
          <CraneBodyInsight insight={bodyInsight} compact />
        </div>
      ) : null}

      {carePlan ? (
        <div className="mt-4">
          <CraneCarePlan carePlan={carePlan} compact onToggleStep={toggleStep} />
        </div>
      ) : null}

      {!isCraneUnlocked && !carePlan && !loading ? (
        <div className="mt-6">
          <CraneClinicalGate compact />
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
      </div>
      <p className="mt-4 font-sans text-[10px] text-white/28">
        Optional. All data stays on this device.
      </p>
    </motion.div>
  );
}

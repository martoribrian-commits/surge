import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSequenceSession } from '../../context/SequenceSessionProvider';
import { useTokenManager } from '../../hooks/useTokenManager';
import { useCarePlan } from '../../hooks/useCarePlan';
import { usePostSessionCarePlan } from '../../hooks/usePostSessionCarePlan';
import { isCarePlanComplete } from '../../lib/craneCarePlanUtils';
import { loadEphemeralNote } from '../../lib/ephemeralStore';
import { isCustomVariantId } from '../../sequences';
import { GROUNDING_OPTIONS, getGroundingOption } from '../../data/groundingGuide';
import { integrationCopyForVariant } from '../../data/aftermathCopy';
import EphemeralInput, { flushEphemeralNote } from './EphemeralInput';
import CraneBodyInsight from '../crane/CraneBodyInsight';
import CraneCarePlan from '../crane/CraneCarePlan';
import CraneClinicalGate from '../crane/CraneClinicalGate';
import ClinicalTokenModal from '../crane/ClinicalTokenModal';
import RecoveryHistoryPanel from './RecoveryHistoryPanel';
import { BRAND } from '../../brand/tokens';

const EASE = [0.25, 0.1, 0.25, 1];

const STEPS = [
  { id: 'complete', label: 'Complete' },
  { id: 'ground', label: 'Ground' },
  { id: 'offload', label: 'Offload' },
  { id: 'crane', label: 'Crane' },
];

function CompletionRing({ progress, accent, duration }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, progress));

  return (
    <div className="relative mx-auto h-[140px] w-[140px]">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: EASE }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-sans text-3xl font-bold tabular-nums tracking-tight" style={{ color: BRAND.bone }}>
          {duration}
        </span>
        <span className="font-sans text-[9px] uppercase tracking-[0.22em]" style={{ color: BRAND.boneDim }}>
          sec
        </span>
      </div>
    </div>
  );
}

function StepRail({ activeIndex }) {
  return (
    <div className="flex items-center justify-center gap-1 md:gap-2">
      {STEPS.map((step, i) => {
        const active = i <= activeIndex;
        const current = i === activeIndex;
        return (
          <div key={step.id} className="flex items-center gap-1 md:gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                className="flex h-7 w-7 items-center justify-center rounded-full border font-sans text-[10px] font-semibold"
                animate={{
                  borderColor: current ? BRAND.clay : active ? `${BRAND.clay}66` : 'rgba(255,255,255,0.08)',
                  backgroundColor: current ? `${BRAND.clay}22` : 'transparent',
                  color: active ? BRAND.bone : BRAND.boneDim,
                }}
                transition={{ duration: 0.4 }}
              >
                {i + 1}
              </motion.div>
              <span
                className="hidden font-sans text-[8px] uppercase tracking-[0.16em] md:block"
                style={{ color: current ? BRAND.clay : BRAND.boneDim }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 ? (
              <div
                className="h-px w-6 md:w-10"
                style={{ background: active ? `${BRAND.clay}44` : 'rgba(255,255,255,0.06)' }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Unified post-sequence funnel — visual steps, minimal copy, one Crane path.
 */
export default function PostSequenceFunnel({ onEnterCrane }) {
  const { sessionId, durationSeconds, variant, reset } = useSequenceSession();
  const { isCraneUnlocked } = useTokenManager();
  const { carePlan: managedPlan, setPlan, toggleStep } = useCarePlan(sessionId);
  const {
    carePlan: fetchedPlan,
    bodyInsight,
    loading,
    error,
    refetch,
  } = usePostSessionCarePlan({
    sessionId,
    variantId: variant.id,
    isCraneUnlocked,
  });

  const carePlan = managedPlan ?? fetchedPlan;

  useEffect(() => {
    if (fetchedPlan?.steps?.length) setPlan(fetchedPlan);
  }, [fetchedPlan, setPlan]);

  const [brainDumpText, setBrainDumpText] = useState('');
  const [activeGround, setActiveGround] = useState(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const palette = variant.palette;
  const planComplete = isCarePlanComplete(carePlan);
  const hasOffload = Boolean(brainDumpText.trim() || loadEphemeralNote(sessionId));
  const activeStep = planComplete || bodyInsight || carePlan ? 3 : hasOffload ? 2 : activeGround ? 1 : 0;
  const integrationCopy = integrationCopyForVariant(variant.id, variant.name);
  const selectedGround = getGroundingOption(activeGround);

  useEffect(() => {
    if (planComplete) setHistoryRefresh((n) => n + 1);
  }, [planComplete]);

  const handleEnterCrane = (groundingSeed) => {
    const dump =
      flushEphemeralNote(sessionId, brainDumpText.trim() || loadEphemeralNote(sessionId));
    const parts = [dump, groundingSeed].filter(Boolean);
    onEnterCrane?.(parts.join('\n\n'));
  };

  const handleTokenUnlocked = () => {
    refetch();
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ClinicalTokenModal
        open={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        onUnlocked={handleTokenUnlocked}
      />

      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          background: [
            `radial-gradient(ellipse 90% 55% at 50% 0%, ${palette.accent}18 0%, transparent 55%)`,
            `radial-gradient(ellipse 70% 50% at 50% 100%, ${palette.accentCalm ?? palette.accent}12 0%, transparent 50%)`,
            `radial-gradient(ellipse 90% 55% at 50% 0%, ${palette.accent}18 0%, transparent 55%)`,
          ],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col px-5 py-10 md:px-8 md:py-14">
        <motion.header
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <p
            className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em]"
            style={{ color: palette.accent }}
          >
            {variant.name}
            {isCustomVariantId(variant.id) ? ' · yours' : ''}
          </p>
          <h1
            className="mt-3 font-sans text-2xl font-extrabold tracking-tight md:text-3xl"
            style={{ color: BRAND.bone }}
          >
            Cycle complete
          </h1>
          <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
            {integrationCopy}
          </p>
          <div className="mt-8">
            <CompletionRing progress={1} accent={palette.accent} duration={durationSeconds} />
          </div>
          <div className="mt-8">
            <StepRail activeIndex={activeStep} />
          </div>
        </motion.header>

        <div className="mt-10 flex flex-1 flex-col gap-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
          >
            <p className="mb-3 font-sans text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: BRAND.clay }}>
              Ground · pick one
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GROUNDING_OPTIONS.map((item) => {
                const selected = activeGround === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveGround(selected ? null : item.id)}
                    className="group flex flex-col items-center rounded-sm border px-3 py-4 text-center transition-colors"
                    style={{
                      borderColor: selected ? `${palette.accent}66` : 'rgba(255,255,255,0.07)',
                      background: selected ? `${palette.accent}12` : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <span
                      className="font-sans text-xl transition-transform group-hover:scale-110"
                      style={{ color: selected ? palette.accent : BRAND.boneDim }}
                    >
                      {item.glyph}
                    </span>
                    <span className="mt-2 font-sans text-[11px] font-medium" style={{ color: BRAND.bone }}>
                      {item.label}
                    </span>
                    <span className="mt-0.5 font-sans text-[9px]" style={{ color: BRAND.boneDim }}>
                      {item.hint}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedGround ? (
              <div className="mt-4 rounded-sm border border-white/[0.08] bg-white/[0.02] p-4">
                <ol className="space-y-2">
                  {selectedGround.steps.map((step, i) => (
                    <li key={step} className="flex gap-3 font-sans text-xs leading-relaxed" style={{ color: BRAND.boneMuted }}>
                      <span className="shrink-0 font-sans text-[10px] tabular-nums" style={{ color: palette.accent }}>
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <button
                  type="button"
                  onClick={() => handleEnterCrane(selectedGround.craneSeed)}
                  className="mt-4 font-sans text-[10px] uppercase tracking-[0.16em] underline"
                  style={{ color: BRAND.boneDim }}
                >
                  Continue in Crane with this grounding
                </button>
              </div>
            ) : null}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
            className="rounded-sm border border-white/[0.07] bg-white/[0.02] p-5 md:p-6"
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: BRAND.clay }}>
                Offload
              </p>
              <span className="font-sans text-[9px]" style={{ color: BRAND.boneDim }}>
                24h · device only
              </span>
            </div>
            <EphemeralInput sessionId={sessionId} onChange={setBrainDumpText} />
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
            className="rounded-sm border border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-transparent p-5 md:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: BRAND.clay }}>
                Crane recovery
              </p>
              {loading ? (
                <motion.span
                  className="inline-block h-1.5 w-16 overflow-hidden rounded-full bg-white/10"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  <span className="block h-full w-1/2 rounded-full bg-[#B6502E]/60" />
                </motion.span>
              ) : null}
            </div>

            {error ? (
              <p className="mt-3 font-sans text-xs" style={{ color: BRAND.clay }}>
                {error}{' '}
                <button type="button" onClick={refetch} className="underline">
                  Retry
                </button>
              </p>
            ) : null}

            {bodyInsight ? (
              <div className="mt-4">
                <CraneBodyInsight insight={bodyInsight} compact />
              </div>
            ) : null}

            {carePlan ? (
              <div className="mt-3">
                <CraneCarePlan carePlan={carePlan} compact onToggleStep={toggleStep} />
              </div>
            ) : null}

            {!isCraneUnlocked && !carePlan && !loading ? (
              <div className="mt-4">
                <CraneClinicalGate compact onRequestUnlock={() => setTokenModalOpen(true)} />
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleEnterCrane()}
                className="border px-6 py-3.5 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors hover:brightness-110"
                style={{
                  color: BRAND.bone,
                  borderColor: `${BRAND.clay}55`,
                  background: `${BRAND.clay}14`,
                }}
              >
                {hasOffload ? 'Continue in Crane' : 'Open Crane'}
              </button>
              {!isCraneUnlocked ? (
                <button
                  type="button"
                  onClick={() => setTokenModalOpen(true)}
                  className="font-sans text-[10px] uppercase tracking-[0.16em] underline"
                  style={{ color: BRAND.boneDim }}
                >
                  I have a token
                </button>
              ) : null}
              {planComplete ? (
                <span className="font-sans text-[10px]" style={{ color: palette.accentCalm ?? palette.accent }}>
                  Recovery plan complete
                </span>
              ) : null}
            </div>
          </motion.section>
        </div>

        <footer className="mt-10 flex flex-col items-center gap-4 border-t border-white/[0.06] pt-8">
          <div className="w-full max-w-md">
            <RecoveryHistoryPanel compact refreshKey={`${sessionId}-${historyRefresh}`} />
          </div>
          <button
            type="button"
            onClick={reset}
            className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] transition-colors hover:text-[#B6502E]"
            style={{ color: BRAND.boneDim }}
          >
            Another sequence
          </button>
          <p className="max-w-xs text-center font-sans text-[9px] leading-relaxed" style={{ color: BRAND.boneDim }}>
            Not emergency care
          </p>
        </footer>
      </div>
    </div>
  );
}

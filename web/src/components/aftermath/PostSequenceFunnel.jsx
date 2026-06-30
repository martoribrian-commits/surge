import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSequenceSession } from '../../context/SequenceSessionProvider';
import { useTokenManager } from '../../hooks/useTokenManager';
import { useCarePlan } from '../../hooks/useCarePlan';
import { fetchCraneContext, requestPostSessionCarePlan } from '../../lib/craneClient';
import {
  isCarePlanComplete,
  loadBodyInsight,
  loadCarePlan,
  processCraneInferenceResult,
  saveBodyInsight,
  saveCarePlan,
} from '../../lib/craneCarePlanUtils';
import EphemeralInput from './EphemeralInput';
import CraneBodyInsight from '../crane/CraneBodyInsight';
import CraneCarePlan from '../crane/CraneCarePlan';
import CraneClinicalGate from '../crane/CraneClinicalGate';
import { BRAND } from '../../brand/tokens';

const EASE = [0.25, 0.1, 0.25, 1];

const GROUNDING = [
  { id: 'cold', glyph: '◐', label: 'Cold water', hint: 'Face + wrists' },
  { id: 'air', glyph: '◎', label: 'Fresh air', hint: '60 seconds outside' },
  { id: 'see', glyph: '◉', label: 'Three objects', hint: 'Name without moving' },
  { id: 'hands', glyph: '◌', label: 'Slow hands', hint: 'Tea, fold, texture' },
];

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
  const { carePlan, setPlan, toggleStep } = useCarePlan(sessionId);
  const [bodyInsight, setBodyInsight] = useState(null);
  const [brainDumpText, setBrainDumpText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeGround, setActiveGround] = useState(null);

  const palette = variant.palette;
  const planComplete = isCarePlanComplete(carePlan);
  const activeStep = planComplete ? 3 : bodyInsight || carePlan ? 3 : brainDumpText.trim() ? 2 : 1;

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
        const inference = await requestPostSessionCarePlan({
          supabaseContext: context,
          sessionMeta: { advisorCallsTotal: 0, turnCount: 0 },
          clinicalAccess: true,
        });
        if (cancelled || inference.requiresClinicalToken) return;

        processCraneInferenceResult(inference, { sessionId, variantId: variant.id });
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
  }, [sessionId, isCraneUnlocked, setPlan]);

  return (
    <div className="relative min-h-screen overflow-hidden">
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
          </p>
          <h1
            className="mt-3 font-sans text-2xl font-extrabold tracking-tight md:text-3xl"
            style={{ color: BRAND.bone }}
          >
            Cycle complete
          </h1>
          <div className="mt-8">
            <CompletionRing progress={1} accent={palette.accent} duration={durationSeconds} />
          </div>
          <div className="mt-8">
            <StepRail activeIndex={activeStep} />
          </div>
        </motion.header>

        <div className="mt-10 flex flex-1 flex-col gap-6">
          {/* Ground — visual chips */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GROUNDING.map((item) => {
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
                    <span
                      className="mt-2 font-sans text-[11px] font-medium"
                      style={{ color: BRAND.bone }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="mt-0.5 font-sans text-[9px]"
                      style={{ color: BRAND.boneDim }}
                    >
                      {item.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.section>

          {/* Offload — compact brain dump */}
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

          {/* Crane — AI recovery zone */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
            className="rounded-sm border border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-transparent p-5 md:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: BRAND.clay }}>
                Crane
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
                <CraneClinicalGate compact />
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onEnterCrane(brainDumpText)}
                className="border px-6 py-3.5 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors hover:brightness-110"
                style={{
                  color: BRAND.bone,
                  borderColor: `${BRAND.clay}55`,
                  background: `${BRAND.clay}14`,
                }}
              >
                {brainDumpText.trim() ? 'Continue in Crane' : 'Open Crane'}
              </button>
              {planComplete ? (
                <span className="font-sans text-[10px]" style={{ color: palette.accentCalm ?? palette.accent }}>
                  Recovery plan complete
                </span>
              ) : null}
            </div>
          </motion.section>
        </div>

        <footer className="mt-10 flex flex-col items-center gap-4 border-t border-white/[0.06] pt-8">
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

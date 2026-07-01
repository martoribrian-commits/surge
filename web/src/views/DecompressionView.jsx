import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import FilmGrainOverlay from '../components/FilmGrainOverlay';
import { useSequenceSession } from '../context/SequenceSessionProvider';
import { useCraneRetention } from '../hooks/useCraneRetention';
import { useCraneAutoLaunch } from '../hooks/useCraneAutoLaunch';
import { useCraneSessionMeta } from '../hooks/useCraneSessionMeta';
import { useTokenManager } from '../hooks/useTokenManager';
import { usePostSessionCarePlan } from '../hooks/usePostSessionCarePlan';
import { fetchCraneContext, requestCraneInference, buildCraneTelemetryOpener } from '../lib/craneClient';
import { DECOMPRESSION_PROMPTS } from '../lib/craneQuickPrompts';
import { BRAND } from '../brand/tokens';
import { loadBodyInsight, loadCarePlan, processCraneInferenceResult } from '../lib/craneCarePlanUtils';
import { useCarePlan } from '../hooks/useCarePlan';
import CraneAutoLaunchBanner from '../components/crane/CraneAutoLaunch';
import CraneClinicalGate from '../components/crane/CraneClinicalGate';
import ClinicalTokenModal from '../components/crane/ClinicalTokenModal';
import CraneLineInput from '../components/decompression/CraneLineInput';
import CraneThread from '../components/decompression/CraneThread';
import SaveInsightsToggle from '../components/decompression/SaveInsightsToggle';

const EASE = [0.25, 0.1, 0.25, 1];

/**
 * Post-sequence decompression — rich Crane thread with inline actions and insights.
 */
export default function DecompressionView() {
  const { sessionId, variant, exitDecompression, reset, consumeBrainDumpSeed } = useSequenceSession();
  const { isCraneUnlocked } = useTokenManager();
  const {
    messages,
    savePersistently,
    retentionLabel,
    hydrated,
    appendMessage,
    toggleSavePersistently,
  } = useCraneRetention(sessionId);

  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [tokenGateHint, setTokenGateHint] = useState(false);
  const { carePlan, setPlan, toggleStep } = useCarePlan(sessionId);
  const { bodyInsight, refetch: refetchCarePlan } = usePostSessionCarePlan({
    sessionId,
    variantId: variant.id,
    isCraneUnlocked,
  });
  const inferenceLockRef = useRef(false);
  const scrollRef = useRef(null);
  const seededRef = useRef(false);
  const carePlanSeededRef = useRef(false);
  const openerSeededRef = useRef(false);

  const { getSessionMeta, nextTurn, recordInferenceMeta } = useCraneSessionMeta();
  const autoLaunch = useCraneAutoLaunch({});

  useEffect(() => {
    if (!hydrated || seededRef.current) return;
    seededRef.current = true;

    const seed = consumeBrainDumpSeed();
    if (seed) {
      appendMessage('user', seed);
    }

    if (!sessionId) return;

    const cached = loadCarePlan(sessionId);
    const cachedInsight = loadBodyInsight(sessionId);
    if (cached?.steps?.length) setPlan(cached);

    if (cachedInsight && cached?.steps?.length && !seed) {
      appendMessage('crane', '', { bodyInsight: cachedInsight, carePlan: cached });
      carePlanSeededRef.current = true;
      openerSeededRef.current = true;
      return;
    }

    if (bodyInsight && carePlan && !seed) {
      appendMessage('crane', '', { bodyInsight, carePlan });
      carePlanSeededRef.current = true;
      openerSeededRef.current = true;
      return;
    }

    if (!openerSeededRef.current) {
      fetchCraneContext(sessionId)
        .then((context) => {
          if (openerSeededRef.current) return;
          appendMessage('crane', buildCraneTelemetryOpener(context));
          openerSeededRef.current = true;
        })
        .catch(() => {
          if (!openerSeededRef.current) {
            appendMessage('crane', 'You finished the sequence. If something came up, you can say it here.');
            openerSeededRef.current = true;
          }
        });
    }
  }, [
    hydrated,
    sessionId,
    bodyInsight,
    carePlan,
    consumeBrainDumpSeed,
    appendMessage,
    setPlan,
  ]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, submitting]);

  const handleSubmit = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || submitting || inferenceLockRef.current) return;

    setDraft('');
    appendMessage('user', trimmed);

    if (!isCraneUnlocked || !sessionId) {
      setTokenGateHint(true);
      return;
    }

    inferenceLockRef.current = true;
    setSubmitting(true);
    nextTurn();
    try {
      const context = await fetchCraneContext(sessionId);
      const inference = processCraneInferenceResult(
        await requestCraneInference({
          userMessage: trimmed,
          supabaseContext: context,
          conversationHistory: messages,
          sessionMeta: getSessionMeta(),
          clinicalAccess: isCraneUnlocked,
        }),
        {
          sessionId,
          variantId: variant.id,
          scheduleAutoLaunch: autoLaunch.schedule,
          recordMeta: recordInferenceMeta,
        },
      );
      if (inference.carePlan) setPlan(inference.carePlan);
      appendMessage('crane', inference.text ?? '', {
        actions: inference.actions,
        bodyInsight: inference.bodyInsight,
        carePlan: inference.carePlan,
      });
    } catch {
      appendMessage('crane', 'Connection issue. Your note is saved locally — try again.');
    } finally {
      inferenceLockRef.current = false;
      setSubmitting(false);
    }
  }, [
    draft,
    submitting,
    isCraneUnlocked,
    sessionId,
    appendMessage,
    messages,
    getSessionMeta,
    nextTurn,
    autoLaunch.schedule,
    recordInferenceMeta,
    setPlan,
    variant.id,
  ]);

  if (!hydrated) {
    return <div className="h-screen w-screen bg-[#0A0A0A]" />;
  }

  return (
    <motion.div
      className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#0A0A0A] text-[#F4F0EB]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.1, ease: EASE }}
    >
      <ClinicalTokenModal
        open={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        onUnlocked={() => {
          refetchCarePlan();
          setTokenGateHint(false);
        }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          background: [
            'radial-gradient(ellipse 80% 55% at 50% 35%, rgba(182,80,46,0.08) 0%, transparent 60%)',
            'radial-gradient(ellipse 70% 50% at 50% 65%, rgba(74,136,184,0.06) 0%, transparent 58%)',
            'radial-gradient(ellipse 80% 55% at 50% 35%, rgba(182,80,46,0.08) 0%, transparent 60%)',
          ],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />

      <FilmGrainOverlay />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(ellipse 75% 65% at 50% 48%, transparent 0%, rgba(0,0,0,0.65) 100%)',
        }}
      />

      <header className="relative z-20 flex items-center justify-between px-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B6502E]">
            Crane
          </p>
          <p className="mt-1 font-sans text-[10px] tracking-[0.14em] text-white/30">
            Decompression
          </p>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={exitDecompression}
            className="font-sans text-[10px] uppercase tracking-[0.22em] text-white/25 transition-colors hover:text-white/50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={reset}
            className="font-sans text-[10px] uppercase tracking-[0.22em] text-white/25 transition-colors hover:text-white/50"
          >
            Exit
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="relative z-10 flex flex-1 flex-col items-center justify-end overflow-y-auto px-6 py-12"
      >
        {autoLaunch.pending ? (
          <div className="mb-6 w-full max-w-lg">
            <CraneAutoLaunchBanner
              pending={autoLaunch.pending}
              secondsLeft={autoLaunch.secondsLeft}
              progress={autoLaunch.progress}
              onCancel={autoLaunch.cancel}
              onLaunchNow={() => autoLaunch.launchNow()}
            />
          </div>
        ) : null}

        {!isCraneUnlocked && (messages.length <= 1 || tokenGateHint) ? (
          <div className="mb-8 w-full max-w-lg">
            <CraneClinicalGate compact onRequestUnlock={() => setTokenModalOpen(true)} />
            {tokenGateHint ? (
              <p className="mt-3 font-sans text-[11px] text-white/40">
                Your note is saved on this device. Enter a clinical token for Crane to respond.
              </p>
            ) : null}
          </div>
        ) : null}

        <CraneThread messages={messages} onToggleStep={toggleStep} carePlanProgress={carePlan} />

        {messages.length <= 2 && !submitting ? (
          <div className="mb-6 flex w-full max-w-lg flex-wrap justify-center gap-2">
            {DECOMPRESSION_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setDraft(prompt);
                }}
                className="rounded-sm border border-white/[0.1] px-3 py-1.5 font-sans text-[10px] transition-colors hover:border-[#B6502E]/40"
                style={{ color: BRAND.boneDim }}
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <footer className="relative z-20 flex shrink-0 flex-col items-center gap-8 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
        <CraneLineInput
          value={draft}
          onChange={setDraft}
          onSubmit={handleSubmit}
          disabled={submitting}
          placeholder={isCraneUnlocked ? 'Speak.' : 'Write what surfaced…'}
        />

        <SaveInsightsToggle
          enabled={savePersistently}
          onToggle={toggleSavePersistently}
          retentionLabel={retentionLabel}
        />
      </footer>
    </motion.div>
  );
}

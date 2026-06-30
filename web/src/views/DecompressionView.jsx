import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import FilmGrainOverlay from '../components/FilmGrainOverlay';
import { useSequenceSession } from '../context/SequenceSessionProvider';
import { useCraneRetention } from '../hooks/useCraneRetention';
import { useCraneAutoLaunch } from '../hooks/useCraneAutoLaunch';
import { useCraneSessionMeta } from '../hooks/useCraneSessionMeta';
import { useTokenManager } from '../hooks/useTokenManager';
import { fetchCraneContext, requestCraneInference, requestPostSessionCarePlan } from '../lib/craneClient';
import { loadBodyInsight, loadCarePlan, processCraneInferenceResult } from '../lib/craneCarePlanUtils';
import { useCarePlan } from '../hooks/useCarePlan';
import CraneAutoLaunchBanner from '../components/crane/CraneAutoLaunch';
import CraneBodyInsight from '../components/crane/CraneBodyInsight';
import CraneCarePlan from '../components/crane/CraneCarePlan';
import CraneClinicalGate from '../components/crane/CraneClinicalGate';
import CraneLineInput from '../components/decompression/CraneLineInput';
import CraneThread from '../components/decompression/CraneThread';
import SaveInsightsToggle from '../components/decompression/SaveInsightsToggle';

const EASE = [0.25, 0.1, 0.25, 1];

/**
 * Post-sequence decompression — ephemeral Crane interface with hybrid local retention.
 * Client-only storage. No remote database sync.
 */
export default function DecompressionView() {
  const { sessionId, exitDecompression, reset, consumeBrainDumpSeed } = useSequenceSession();
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
  const [bodyInsight, setBodyInsight] = useState(null);
  const { carePlan, setPlan, toggleStep } = useCarePlan(sessionId);
  const inferenceLockRef = useRef(false);
  const scrollRef = useRef(null);
  const seededRef = useRef(false);
  const carePlanFetchedRef = useRef(false);

  const { getSessionMeta, nextTurn, recordInferenceMeta } = useCraneSessionMeta();
  const autoLaunch = useCraneAutoLaunch({});

  useEffect(() => {
    if (!hydrated || seededRef.current) return;
    const seed = consumeBrainDumpSeed();
    if (seed && messages.length === 0) {
      appendMessage('user', seed);
    }
    seededRef.current = true;
  }, [hydrated, messages.length, consumeBrainDumpSeed, appendMessage]);

  useEffect(() => {
    if (!hydrated || !sessionId || carePlanFetchedRef.current) return;
    const cached = loadCarePlan(sessionId);
    const cachedInsight = loadBodyInsight(sessionId);
    if (cached?.steps?.length) {
      setPlan(cached);
      carePlanFetchedRef.current = true;
    }
    if (cachedInsight) setBodyInsight(cachedInsight);
    if (cached && cachedInsight) return;

    if (!isCraneUnlocked) return;
    carePlanFetchedRef.current = true;

    (async () => {
      try {
        const context = await fetchCraneContext(sessionId);
        const inference = await requestPostSessionCarePlan({
          supabaseContext: context,
          sessionMeta: { advisorCallsTotal: 0, turnCount: 0 },
          clinicalAccess: true,
        });
        processCraneInferenceResult(inference, { sessionId, recordMeta: recordInferenceMeta });
        if (inference.carePlan) setPlan(inference.carePlan);
        if (inference.bodyInsight) setBodyInsight(inference.bodyInsight);
      } catch {
        /* optional */
      }
    })();
  }, [hydrated, sessionId, isCraneUnlocked, recordInferenceMeta, setPlan]);

  const handleSubmit = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || submitting || inferenceLockRef.current) return;

    setDraft('');
    appendMessage('user', trimmed);

    if (!isCraneUnlocked || !sessionId) return;

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
          scheduleAutoLaunch: autoLaunch.schedule,
          recordMeta: recordInferenceMeta,
        },
      );
      if (inference.carePlan) setPlan(inference.carePlan);
      if (inference.bodyInsight) setBodyInsight(inference.bodyInsight);
      appendMessage('crane', inference.text);
    } catch {
      appendMessage('crane', 'Held locally. No response sent.');
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
        {bodyInsight ? (
          <div className="mb-6 w-full max-w-lg">
            <CraneBodyInsight insight={bodyInsight} compact />
          </div>
        ) : null}
        {carePlan ? (
          <div className="mb-8 w-full max-w-lg">
            <CraneCarePlan carePlan={carePlan} compact onToggleStep={toggleStep} />
          </div>
        ) : null}
        {!isCraneUnlocked && !carePlan ? (
          <div className="mb-8 w-full max-w-lg">
            <CraneClinicalGate compact />
          </div>
        ) : null}
        <CraneThread messages={messages} />
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

        {!isCraneUnlocked && (
          <p className="max-w-sm text-center font-sans text-[10px] leading-relaxed text-white/22">
            Responses require a clinical token. Your words stay on this device only.
          </p>
        )}
      </footer>
    </motion.div>
  );
}

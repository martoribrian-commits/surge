import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCrane } from '../../context/CraneProvider';
import { useSequenceSessionOptional } from '../../context/SequenceSessionProvider';
import { useCraneAutoLaunch } from '../../hooks/useCraneAutoLaunch';
import { useCraneSessionMeta } from '../../hooks/useCraneSessionMeta';
import {
  buildCraneGuideOpener,
  buildCraneTelemetryOpener,
  fetchCraneContext,
  requestCraneGuideInference,
  requestCraneInference,
  requestPostSessionCarePlan,
} from '../../lib/craneClient';
import { CRANE_QUICK_PROMPTS } from '../../lib/craneQuickPrompts';
import { useCarePlan } from '../../hooks/useCarePlan';
import { useTokenManager } from '../../hooks/useTokenManager';
import {
  loadBodyInsight,
  loadCarePlan,
  processCraneInferenceResult,
} from '../../lib/craneCarePlanUtils';
import { getCachedSessionPayload } from '../../lib/sessionPayload';
import { VARIANT_LIST } from '../../sequences';
import CraneActions from './CraneActions';
import CraneAutoLaunchBanner from './CraneAutoLaunch';
import CraneBodyInsight from './CraneBodyInsight';
import CraneCarePlan from './CraneCarePlan';
import CraneClinicalGate from './CraneClinicalGate';

const EASE = [0.25, 0.1, 0.25, 1];

const QUICK_PROMPTS = CRANE_QUICK_PROMPTS;

function createMessage(role, content, { actions = [], carePlan = null, bodyInsight = null } = {}) {
  return { id: crypto.randomUUID(), role, content, actions, carePlan, bodyInsight };
}

function MessageBubble({ message, isLatest, autoLaunchPath, onToggleStep, onCustomSequence }) {
  const isUser = message.role === 'user';
  const visibleActions = (message.actions ?? []).filter(
    (a) => !(a.autoLaunch && a.path === autoLaunchPath),
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isLatest ? 1 : 0.55, y: 0 }}
      className={`max-w-[92%] font-sans text-[14px] leading-[1.75] tracking-[0.02em] ${
        isUser
          ? 'ml-auto rounded-sm border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#F4F0EB]'
          : 'mr-auto text-left text-white/80'
      }`}
    >
      {message.content.split('\n').map((line, i) => (
        <span key={i}>
          {line}
          {i < message.content.split('\n').length - 1 ? <br /> : null}
        </span>
      ))}
      {!isUser && message.bodyInsight ? (
        <div className="mt-3">
          <CraneBodyInsight insight={message.bodyInsight} compact />
        </div>
      ) : null}
      {!isUser && message.carePlan ? (
        <div className="mt-3">
          <CraneCarePlan carePlan={message.carePlan} compact onToggleStep={onToggleStep} />
        </div>
      ) : null}
      {!isUser && visibleActions.length ? (
        <CraneActions actions={visibleActions} compact onCustomSequence={onCustomSequence} />
      ) : null}
    </motion.div>
  );
}

/**
 * Slide-over Crane panel — guide mode site-wide, enriches with session when available.
 */
export default function CranePanel() {
  const { isOpen, closeCrane } = useCrane();
  const location = useLocation();
  const sessionCtx = useSequenceSessionOptional();
  const sessionId = sessionCtx?.sessionId ?? getCachedSessionPayload()?.sessionId ?? null;
  const applyCustomSequence = sessionCtx?.applyCustomSequence;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle');
  const [mode, setMode] = useState('guide');
  const [carePlanLoading, setCarePlanLoading] = useState(false);
  const { isCraneUnlocked } = useTokenManager();
  const [bodyInsight, setBodyInsight] = useState(null);
  const [supabaseContext, setSupabaseContext] = useState(null);

  const {
    carePlan,
    setPlan,
    toggleStep,
  } = useCarePlan(sessionId);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const lockRef = useRef(false);
  const initializedRef = useRef(false);
  const carePlanFetchedRef = useRef(false);

  const { getSessionMeta, nextTurn, recordInferenceMeta, resetSessionMeta } = useCraneSessionMeta();
  const autoLaunch = useCraneAutoLaunch({ closeCrane });

  const resetPanel = useCallback(() => {
    setMessages([]);
    setInput('');
    setStatus('idle');
    setMode('guide');
    setBodyInsight(null);
    setSupabaseContext(null);
    setCarePlanLoading(false);
    initializedRef.current = false;
    carePlanFetchedRef.current = false;
    resetSessionMeta();
    autoLaunch.cancel();
  }, [resetSessionMeta, autoLaunch]);

  const handleInferenceResult = useCallback(
    (inference) => {
      processCraneInferenceResult(inference, {
        sessionId,
        scheduleAutoLaunch: autoLaunch.schedule,
        recordMeta: recordInferenceMeta,
      });
      if (inference.carePlan) setPlan(inference.carePlan);
      if (inference.bodyInsight) setBodyInsight(inference.bodyInsight);
      return inference;
    },
    [sessionId, autoLaunch.schedule, recordInferenceMeta, setPlan],
  );

  const fetchProactiveCarePlan = useCallback(
    async (context) => {
      if (carePlanFetchedRef.current || !context || !isCraneUnlocked) return;
      carePlanFetchedRef.current = true;
      setCarePlanLoading(true);
      try {
        const cached = sessionId ? loadCarePlan(sessionId) : null;
        const cachedInsight = sessionId ? loadBodyInsight(sessionId) : null;
        if (cached?.steps?.length) {
          setPlan(cached);
          if (cachedInsight) setBodyInsight(cachedInsight);
          return;
        }
        const inference = await requestPostSessionCarePlan({
          supabaseContext: context,
          sessionMeta: getSessionMeta(),
          clinicalAccess: isCraneUnlocked,
        });
        if (inference.requiresClinicalToken) return;
        handleInferenceResult(inference);
        if (inference.carePlan) setPlan(inference.carePlan);
        if (inference.bodyInsight) setBodyInsight(inference.bodyInsight);
      } catch {
        /* optional */
      } finally {
        setCarePlanLoading(false);
      }
    },
    [sessionId, getSessionMeta, handleInferenceResult, isCraneUnlocked, setPlan],
  );

  useEffect(() => {
    if (!isOpen) {
      resetPanel();
      return;
    }

    if (initializedRef.current) return;
    initializedRef.current = true;
    setStatus('connecting');

    (async () => {
      try {
        if (sessionId) {
          const context = await fetchCraneContext(sessionId);
          setSupabaseContext(context);
          setMode('post-session');
          const cachedPlan = loadCarePlan(sessionId);
          const cachedInsight = loadBodyInsight(sessionId);
          if (cachedPlan) setPlan(cachedPlan);
          if (cachedInsight) setBodyInsight(cachedInsight);
          setMessages([createMessage('crane', buildCraneTelemetryOpener(context))]);
          setStatus('ready');
          if (isCraneUnlocked) fetchProactiveCarePlan(context);
        } else {
          setMode('guide');
          setMessages([createMessage('crane', buildCraneGuideOpener())]);
          setStatus('ready');
        }
      } catch {
        setMode('guide');
        setMessages([createMessage('crane', buildCraneGuideOpener())]);
        setStatus('ready');
      }
    })();
  }, [isOpen, sessionId, resetPanel, fetchProactiveCarePlan, isCraneUnlocked, setPlan]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen, status]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, carePlan, autoLaunch.pending]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || status !== 'ready' || lockRef.current) return;

    setInput('');
    const nextMessages = [...messages, createMessage('user', trimmed)];
    setMessages(nextMessages);
    lockRef.current = true;
    nextTurn();

    try {
      let inference;
      const sessionMeta = getSessionMeta();

      if (mode === 'post-session' && sessionId) {
        const context = supabaseContext ?? (await fetchCraneContext(sessionId));
        if (!supabaseContext) setSupabaseContext(context);
        inference = handleInferenceResult(
          await requestCraneInference({
            userMessage: trimmed,
            supabaseContext: context,
            conversationHistory: nextMessages.slice(0, -1),
            sessionMeta,
            clinicalAccess: isCraneUnlocked,
          }),
        );
      } else {
        inference = handleInferenceResult(
          await requestCraneGuideInference({
            userMessage: trimmed,
            conversationHistory: nextMessages.slice(0, -1),
            sessionMeta,
          }),
        );
      }

      setMessages((prev) => [
        ...prev,
        createMessage('crane', inference.text, {
          actions: inference.actions ?? [],
          carePlan: inference.carePlan ?? null,
          bodyInsight: inference.bodyInsight ?? null,
        }),
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        createMessage('crane', 'Connection dropped. Try again — or pick a sequence from the list below.'),
      ]);
    } finally {
      lockRef.current = false;
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const showSequenceStrip = location.pathname !== '/' && !location.pathname.startsWith('/engine');
  const showCarePlanCard = mode === 'post-session' && carePlan && !carePlanLoading;

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close Crane"
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCrane}
          />

          <motion.aside
            role="dialog"
            aria-label="Crane guide"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-[75] flex max-h-[min(88vh,720px)] flex-col overflow-hidden border-t border-white/10 bg-[#0A0A0A] shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[min(100%,420px)] sm:rounded-sm sm:border"
            initial={{ y: '100%', opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <header className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div>
                <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B6502E]">
                  Crane
                </p>
                <p className="mt-0.5 font-sans text-[11px] text-white/40">
                  {mode === 'post-session' ? 'Clinical recovery guide' : 'Clinical somatic guide'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCrane}
                className="min-h-[44px] px-3 font-sans text-[10px] uppercase tracking-[0.2em] text-white/35 transition-colors hover:text-white/70"
              >
                Close
              </button>
            </header>

            <CraneAutoLaunchBanner
              pending={autoLaunch.pending}
              secondsLeft={autoLaunch.secondsLeft}
              progress={autoLaunch.progress}
              onCancel={autoLaunch.cancel}
              onLaunchNow={() => autoLaunch.launchNow()}
            />

            <div ref={scrollRef} className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6">
              {status === 'connecting' && (
                <p className="font-sans text-sm text-white/25">Connecting…</p>
              )}
              {mode === 'post-session' && bodyInsight ? (
                <CraneBodyInsight insight={bodyInsight} compact />
              ) : null}
              {showCarePlanCard ? (
                <CraneCarePlan
                  carePlan={carePlan}
                  compact
                  onStepClick={() => closeCrane()}
                  onToggleStep={toggleStep}
                />
              ) : null}
              {mode === 'post-session' && !isCraneUnlocked && !carePlan && !carePlanLoading ? (
                <CraneClinicalGate compact />
              ) : null}
              {carePlanLoading ? (
                <p className="font-sans text-[11px] text-white/30">Building your recovery plan…</p>
              ) : null}
              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isLatest={i === messages.length - 1}
                  autoLaunchPath={autoLaunch.pending?.path}
                  onToggleStep={toggleStep}
                  onCustomSequence={applyCustomSequence}
                />
              ))}
            </div>

            {status === 'ready' && messages.length <= 1 ? (
              <div className="shrink-0 border-t border-white/[0.04] px-5 py-3">
                <p className="mb-2 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-white/30">
                  Try asking
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="rounded-sm border border-white/10 px-3 py-2 font-sans text-[10px] text-white/50 transition-colors hover:border-[#B6502E]/40 hover:text-[#F4F0EB]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {showSequenceStrip ? (
              <div className="shrink-0 border-t border-white/[0.04] px-5 py-3">
                <p className="mb-2 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-white/30">
                  Sequences
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {VARIANT_LIST.map((v) => (
                    <Link
                      key={v.id}
                      to={`/engine/${v.id}`}
                      onClick={closeCrane}
                      className="shrink-0 rounded-sm border border-white/8 px-2.5 py-1.5 font-sans text-[10px] text-white/45 transition-colors hover:border-[#B6502E]/40 hover:text-[#F4F0EB]"
                    >
                      {v.durationSeconds}s · {v.name.split(' ')[0]}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <form
              onSubmit={handleSubmit}
              className="shrink-0 border-t border-white/[0.06] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={status !== 'ready'}
                placeholder="What does your body feel like right now?"
                rows={2}
                aria-label="Message to Crane"
                className="w-full resize-none rounded-sm border border-white/10 bg-white/[0.03] px-4 py-3 font-sans text-sm leading-relaxed text-[#F4F0EB] placeholder:text-white/25 focus:border-[#B6502E]/50 focus:outline-none disabled:opacity-40"
              />
            </form>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

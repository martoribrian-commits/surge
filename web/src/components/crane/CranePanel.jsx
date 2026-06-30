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
import { loadCarePlan, processCraneInferenceResult } from '../../lib/craneCarePlanUtils';
import { getCachedSessionPayload } from '../../lib/sessionPayload';
import { VARIANT_LIST } from '../../sequences';
import CraneActions from './CraneActions';
import CraneAutoLaunchBanner from './CraneAutoLaunch';
import CraneCarePlan from './CraneCarePlan';

const EASE = [0.25, 0.1, 0.25, 1];

const QUICK_PROMPTS = [
  'Which sequence should I pick?',
  'My heart is racing',
  'I feel stuck in my head',
  'What should I do next?',
];

function createMessage(role, content, { actions = [], carePlan = null } = {}) {
  return { id: crypto.randomUUID(), role, content, actions, carePlan };
}

function MessageBubble({ message, isLatest, autoLaunchPath }) {
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
      {!isUser && message.carePlan ? (
        <div className="mt-3">
          <CraneCarePlan carePlan={message.carePlan} compact />
        </div>
      ) : null}
      {!isUser && visibleActions.length ? (
        <CraneActions actions={visibleActions} compact />
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

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle');
  const [mode, setMode] = useState('guide');
  const [carePlan, setCarePlan] = useState(null);
  const [carePlanLoading, setCarePlanLoading] = useState(false);
  const [supabaseContext, setSupabaseContext] = useState(null);

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
    setCarePlan(null);
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
      if (inference.carePlan) setCarePlan(inference.carePlan);
      return inference;
    },
    [sessionId, autoLaunch.schedule, recordInferenceMeta],
  );

  const fetchProactiveCarePlan = useCallback(
    async (context) => {
      if (carePlanFetchedRef.current || !context) return;
      carePlanFetchedRef.current = true;
      setCarePlanLoading(true);
      try {
        const cached = sessionId ? loadCarePlan(sessionId) : null;
        if (cached?.steps?.length) {
          setCarePlan(cached);
          return;
        }
        const inference = await requestPostSessionCarePlan({
          supabaseContext: context,
          sessionMeta: getSessionMeta(),
        });
        handleInferenceResult(inference);
        if (inference.carePlan) {
          setCarePlan(inference.carePlan);
        } else if (inference.text) {
          setMessages((prev) => {
            if (prev.some((m) => m.carePlan)) return prev;
            return [
              ...prev,
              createMessage('crane', inference.text, { carePlan: inference.carePlan }),
            ];
          });
        }
      } catch {
        /* care plan is optional enhancement */
      } finally {
        setCarePlanLoading(false);
      }
    },
    [sessionId, getSessionMeta, handleInferenceResult],
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
          if (cachedPlan) setCarePlan(cachedPlan);
          setMessages([createMessage('crane', buildCraneTelemetryOpener(context))]);
          setStatus('ready');
          fetchProactiveCarePlan(context);
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
  }, [isOpen, sessionId, resetPanel, fetchProactiveCarePlan]);

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
              onCancel={autoLaunch.cancel}
              onLaunchNow={() => autoLaunch.launchNow()}
            />

            <div ref={scrollRef} className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6">
              {status === 'connecting' && (
                <p className="font-sans text-sm text-white/25">Connecting…</p>
              )}
              {showCarePlanCard ? (
                <CraneCarePlan
                  carePlan={carePlan}
                  compact
                  onStepClick={() => closeCrane()}
                />
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

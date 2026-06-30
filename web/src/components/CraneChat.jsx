import { motion, LayoutGroup } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FilmGrainOverlay from './FilmGrainOverlay';
import {
  buildCraneGuideOpener,
  buildCraneTelemetryOpener,
  fetchCraneContext,
  requestCraneGuideInference,
  requestCraneInference,
  requestPostSessionCarePlan,
} from '../lib/craneClient';
import { loadBodyInsight, loadCarePlan, processCraneInferenceResult } from '../lib/craneCarePlanUtils';
import { getCachedSessionPayload } from '../lib/sessionPayload';
import { useCarePlan } from '../hooks/useCarePlan';
import { useCraneAutoLaunch } from '../hooks/useCraneAutoLaunch';
import { useCraneSessionMeta } from '../hooks/useCraneSessionMeta';
import { useTokenManager } from '../hooks/useTokenManager';
import CraneActions from './crane/CraneActions';
import CraneAutoLaunchBanner from './crane/CraneAutoLaunch';
import CraneBodyInsight from './crane/CraneBodyInsight';
import CraneCarePlan from './crane/CraneCarePlan';
import CraneClinicalGate from './crane/CraneClinicalGate';

const EASE = [0.25, 0.1, 0.25, 1];

const QUICK_PROMPTS = [
  'Which sequence should I pick?',
  'My heart is racing',
  'What should I do next?',
];

function createMessage(role, content, { reveal = false, actions = [], carePlan = null, bodyInsight = null } = {}) {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    actions,
    carePlan,
    bodyInsight,
    reveal: role === 'crane' && reveal,
  };
}

function CinematicTextReveal({ text, onComplete }) {
  const tokens = text.match(/\S+|\s+/g) ?? [text];
  const lastIndex = tokens.length - 1;

  return (
    <span aria-live="polite">
      {tokens.map((token, index) => (
        <motion.span
          key={`${index}-${token.slice(0, 8)}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55, delay: index * 0.038, ease: EASE }}
          onAnimationComplete={index === lastIndex && onComplete ? onComplete : undefined}
          className="inline"
        >
          {token}
        </motion.span>
      ))}
    </span>
  );
}

function StreamMessage({ message, isFocal, onRevealComplete, autoLaunchPath, onToggleStep }) {
  const showReveal = message.role === 'crane' && message.reveal && isFocal;
  const visibleActions = (message.actions ?? []).filter(
    (a) => !(a.autoLaunch && a.path === autoLaunchPath),
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{
        opacity: isFocal ? 1 : 0.2,
        y: 0,
        filter: isFocal ? 'blur(0px)' : 'blur(3px)',
      }}
      transition={{
        layout: { duration: 0.65, ease: EASE },
        opacity: { duration: isFocal ? 0.35 : 0.12 },
        filter: { duration: 0.12 },
        y: { duration: 0.65, ease: EASE },
      }}
      className={`font-sans text-[15px] leading-[1.85] tracking-[0.07em] text-white ${
        message.role === 'user' ? 'text-right' : 'text-left'
      }`}
    >
      {showReveal ? (
        <CinematicTextReveal text={message.content} onComplete={onRevealComplete} />
      ) : (
        message.content
      )}
      {message.role === 'crane' && message.bodyInsight ? (
        <div className="mt-8">
          <CraneBodyInsight insight={message.bodyInsight} />
        </div>
      ) : null}
      {message.role === 'crane' && message.carePlan ? (
        <div className="mt-8">
          <CraneCarePlan carePlan={message.carePlan} onToggleStep={onToggleStep} />
        </div>
      ) : null}
      {message.role === 'crane' && visibleActions.length ? (
        <div className="mt-6">
          <CraneActions actions={visibleActions} />
        </div>
      ) : null}
    </motion.div>
  );
}

export default function CraneChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedContext = location.state?.supabaseContext ?? null;
  const session = getCachedSessionPayload();
  const sessionId = session?.sessionId ?? null;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [supabaseContext, setSupabaseContext] = useState(passedContext);
  const [mode, setMode] = useState('guide');
  const [status, setStatus] = useState('connecting');
  const [carePlanLoading, setCarePlanLoading] = useState(false);
  const [bodyInsight, setBodyInsight] = useState(null);
  const { isCraneUnlocked } = useTokenManager();
  const { carePlan, setPlan, toggleStep } = useCarePlan(sessionId);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const initializedRef = useRef(false);
  const inferenceLockRef = useRef(false);
  const carePlanFetchedRef = useRef(false);

  const { getSessionMeta, nextTurn, recordInferenceMeta } = useCraneSessionMeta();
  const autoLaunch = useCraneAutoLaunch({});

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

  const scrollToPresent = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  const markRevealed = useCallback((messageId) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, reveal: false } : msg)),
    );
  }, []);

  const runInference = useCallback(
    async (trimmed, history) => {
      nextTurn();
      const sessionMeta = getSessionMeta();
      let inference;
      if (mode === 'post-session' && supabaseContext) {
        inference = handleInferenceResult(
          await requestCraneInference({
            userMessage: trimmed,
            supabaseContext,
            conversationHistory: history,
            sessionMeta,
            clinicalAccess: isCraneUnlocked,
          }),
        );
      } else {
        inference = handleInferenceResult(
          await requestCraneGuideInference({
            userMessage: trimmed,
            conversationHistory: history,
            sessionMeta,
          }),
        );
      }
      return inference;
    },
    [mode, supabaseContext, getSessionMeta, nextTurn, handleInferenceResult, isCraneUnlocked],
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
      try {
        let context = passedContext;
        if (!context && sessionId) {
          try {
            context = await fetchCraneContext(sessionId);
          } catch {
            context = null;
          }
        }

        if (context) {
          setSupabaseContext(context);
          setMode('post-session');
          const cached = sessionId ? loadCarePlan(sessionId) : null;
          const cachedInsight = sessionId ? loadBodyInsight(sessionId) : null;
          if (cached) setPlan(cached);
          if (cachedInsight) setBodyInsight(cachedInsight);
          setMessages([
            createMessage('crane', buildCraneTelemetryOpener(context), { reveal: true }),
          ]);
          setStatus('ready');

          if (isCraneUnlocked && !cached && !carePlanFetchedRef.current) {
            carePlanFetchedRef.current = true;
            setCarePlanLoading(true);
            try {
              const planResult = await requestPostSessionCarePlan({
                supabaseContext: context,
                sessionMeta: { advisorCallsTotal: 0, turnCount: 0 },
                clinicalAccess: true,
              });
              handleInferenceResult(planResult);
            } catch {
              /* optional */
            } finally {
              setCarePlanLoading(false);
            }
          }
        } else {
          setMode('guide');
          setMessages([createMessage('crane', buildCraneGuideOpener(), { reveal: true })]);
          setStatus('ready');
        }
      } catch {
        setMode('guide');
        setMessages([createMessage('crane', buildCraneGuideOpener(), { reveal: true })]);
        setStatus('ready');
      }
    })();
  }, [passedContext, sessionId, handleInferenceResult, isCraneUnlocked, setPlan]);

  useEffect(() => {
    scrollToPresent();
  }, [messages, carePlan, autoLaunch.pending, scrollToPresent]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || status !== 'ready' || inferenceLockRef.current) return;

    setInput('');
    setMessages((prev) => [...prev, createMessage('user', trimmed)]);

    inferenceLockRef.current = true;
    try {
      const inference = await runInference(trimmed, messages);
      setMessages((prev) => [
        ...prev,
        createMessage('crane', inference.text, {
          reveal: true,
          actions: inference.actions ?? [],
          carePlan: inference.carePlan ?? null,
          bodyInsight: inference.bodyInsight ?? null,
        }),
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        createMessage('crane', 'Signal lost. Try again — or pick a sequence from the home page.', {
          reveal: true,
        }),
      ]);
    } finally {
      inferenceLockRef.current = false;
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const sendQuick = async (text) => {
    if (status !== 'ready' || inferenceLockRef.current) return;
    setMessages((prev) => [...prev, createMessage('user', text)]);
    inferenceLockRef.current = true;
    try {
      const inference = await runInference(text, messages);
      setMessages((prev) => [
        ...prev,
        createMessage('crane', inference.text, {
          reveal: true,
          actions: inference.actions ?? [],
          carePlan: inference.carePlan ?? null,
          bodyInsight: inference.bodyInsight ?? null,
        }),
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        createMessage('crane', 'Connection dropped. Try again.', { reveal: true }),
      ]);
    } finally {
      inferenceLockRef.current = false;
    }
  };

  const focalIndex = messages.length - 1;

  return (
    <motion.div
      className="relative flex h-screen w-screen flex-col justify-between overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <FilmGrainOverlay />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 45%, transparent 0%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <button
        type="button"
        onClick={() => navigate('/start')}
        className="absolute right-8 top-8 z-20 font-sans text-[10px] uppercase tracking-[0.28em] text-white/15 transition-colors duration-500 hover:text-white/35"
      >
        Exit
      </button>

      {autoLaunch.pending ? (
        <div className="relative z-20 mx-auto w-full max-w-2xl px-14 pt-20">
          <CraneAutoLaunchBanner
            pending={autoLaunch.pending}
            secondsLeft={autoLaunch.secondsLeft}
            progress={autoLaunch.progress}
            onCancel={autoLaunch.cancel}
            onLaunchNow={() => autoLaunch.launchNow()}
          />
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="relative z-10 flex flex-1 flex-col justify-end overflow-y-auto overflow-x-hidden"
      >
        <LayoutGroup>
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-14 py-24">
            {status === 'connecting' && (
              <p className="font-sans text-sm tracking-[0.2em] text-white/20">Connecting.</p>
            )}
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#B6502E]/70">
              {mode === 'guide' ? 'Clinical guide' : 'Post-session recovery'}
            </p>
            {mode === 'post-session' && bodyInsight ? (
              <CraneBodyInsight insight={bodyInsight} />
            ) : null}
            {mode === 'post-session' && carePlan ? (
              <CraneCarePlan
                carePlan={carePlan}
                onStepClick={() => navigate('/start')}
                onToggleStep={toggleStep}
              />
            ) : null}
            {mode === 'post-session' && !isCraneUnlocked && !carePlan && !carePlanLoading ? (
              <CraneClinicalGate />
            ) : null}
            {carePlanLoading ? (
              <p className="font-sans text-sm text-white/25">Building your recovery plan…</p>
            ) : null}
            {messages.map((message, index) => (
              <StreamMessage
                key={message.id}
                message={message}
                isFocal={index === focalIndex}
                onRevealComplete={() => markRevealed(message.id)}
                autoLaunchPath={autoLaunch.pending?.path}
                onToggleStep={toggleStep}
              />
            ))}
          </div>
        </LayoutGroup>
      </div>

      {status === 'ready' && messages.length <= 1 ? (
        <div className="relative z-10 flex flex-wrap justify-center gap-2 px-14 pb-4">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendQuick(prompt)}
              className="rounded-sm border border-white/10 px-3 py-2 font-sans text-[10px] text-white/40 transition-colors hover:border-[#B6502E]/40 hover:text-white/70"
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="relative z-10 shrink-0 px-14 pb-14 pt-6">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={status !== 'ready'}
          placeholder="What does your body feel like right now?"
          rows={1}
          aria-label="Message to Crane"
          className="mx-auto block w-full max-w-2xl resize-none border-0 bg-transparent text-center font-sans text-sm tracking-[0.28em] text-white/35 placeholder:text-white/12 focus:outline-none focus:ring-0 disabled:opacity-30"
        />
      </form>
    </motion.div>
  );
}

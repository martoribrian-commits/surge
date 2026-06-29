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
} from '../lib/craneClient';
import { getCachedSessionPayload } from '../lib/sessionPayload';

import CraneActions from './crane/CraneActions';

const EASE = [0.25, 0.1, 0.25, 1];

const QUICK_PROMPTS = [
  'Which sequence should I pick?',
  'My heart is racing',
  'Explain all five sequences',
];

function createMessage(role, content, { reveal = false, actions = [] } = {}) {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    actions,
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
          onAnimationComplete={
            index === lastIndex && onComplete ? onComplete : undefined
          }
          className="inline"
        >
          {token}
        </motion.span>
      ))}
    </span>
  );
}

function StreamMessage({ message, isFocal, onRevealComplete }) {
  const showReveal = message.role === 'crane' && message.reveal && isFocal;

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
      {message.role === 'crane' && message.actions?.length ? (
        <div className="mt-6">
          <CraneActions actions={message.actions} />
        </div>
      ) : null}
    </motion.div>
  );
}

/**
 * Full-screen Crane — guide mode (no session) or post-session when telemetry exists.
 */
export default function CraneChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedContext = location.state?.supabaseContext ?? null;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [supabaseContext, setSupabaseContext] = useState(passedContext);
  const [mode, setMode] = useState('guide');
  const [status, setStatus] = useState('connecting');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const initializedRef = useRef(false);
  const inferenceLockRef = useRef(false);

  const scrollToPresent = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  const markRevealed = useCallback((messageId) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, reveal: false } : msg)),
    );
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const session = getCachedSessionPayload();

    (async () => {
      try {
        let context = passedContext;
        if (!context && session?.sessionId) {
          try {
            context = await fetchCraneContext(session.sessionId);
          } catch {
            context = null;
          }
        }

        if (context) {
          setSupabaseContext(context);
          setMode('post-session');
          setMessages([
            createMessage('crane', buildCraneTelemetryOpener(context), { reveal: true }),
          ]);
        } else {
          setMode('guide');
          setMessages([createMessage('crane', buildCraneGuideOpener(), { reveal: true })]);
        }
        setStatus('ready');
      } catch {
        setMode('guide');
        setMessages([createMessage('crane', buildCraneGuideOpener(), { reveal: true })]);
        setStatus('ready');
      }
    })();
  }, [passedContext]);

  useEffect(() => {
    scrollToPresent();
  }, [messages, scrollToPresent]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || status !== 'ready' || inferenceLockRef.current) {
      return;
    }

    setInput('');
    const history = [...messages, createMessage('user', trimmed)];
    setMessages(history);

    inferenceLockRef.current = true;
    try {
      let inference;
      if (mode === 'post-session' && supabaseContext) {
        inference = await requestCraneInference({
          userMessage: trimmed,
          supabaseContext,
          conversationHistory: messages,
        });
      } else {
        inference = await requestCraneGuideInference({
          userMessage: trimmed,
          conversationHistory: messages,
        });
      }
      setMessages((prev) => [
        ...prev,
        createMessage('crane', inference.text, {
          reveal: true,
          actions: inference.actions ?? [],
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

  const sendQuick = (text) => {
    setInput(text);
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} };
      setInput('');
      inferenceLockRef.current = false;
      setMessages((prev) => [...prev, createMessage('user', text)]);
      inferenceLockRef.current = true;
      (async () => {
        try {
          const inference =
            mode === 'post-session' && supabaseContext
              ? await requestCraneInference({
                  userMessage: text,
                  supabaseContext,
                  conversationHistory: messages,
                })
              : await requestCraneGuideInference({
                  userMessage: text,
                  conversationHistory: messages,
                });
          setMessages((prev) => [
            ...prev,
            createMessage('crane', inference.text, {
              reveal: true,
              actions: inference.actions ?? [],
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
      })();
    }, 0);
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
        onClick={() => navigate('/')}
        className="absolute right-8 top-8 z-20 font-sans text-[10px] uppercase tracking-[0.28em] text-white/15 transition-colors duration-500 hover:text-white/35"
      >
        Exit
      </button>

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
              {mode === 'guide' ? 'Guide mode' : 'After your sequence'}
            </p>
            {messages.map((message, index) => (
              <StreamMessage
                key={message.id}
                message={message}
                isFocal={index === focalIndex}
                onRevealComplete={() => markRevealed(message.id)}
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

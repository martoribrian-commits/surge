import { motion, LayoutGroup } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FilmGrainOverlay from './FilmGrainOverlay';
import {
  buildCraneTelemetryOpener,
  fetchCraneContext,
  requestCraneInference,
} from '../lib/craneClient';
import { getCachedSessionPayload } from '../lib/sessionPayload';

const EASE = [0.25, 0.1, 0.25, 1];

function createMessage(role, content, { reveal = false } = {}) {
  return {
    id: crypto.randomUUID(),
    role,
    content,
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
    </motion.div>
  );
}

/**
 * Immersive Crane chat — Surge's post-regulation companion (distinct from Marrow's Heron).
 */
export default function CraneChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedContext = location.state?.supabaseContext ?? null;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [supabaseContext, setSupabaseContext] = useState(passedContext);
  const [status, setStatus] = useState(passedContext ? 'ready' : 'connecting');
  const [error, setError] = useState('');
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
    if (!session?.sessionId && !passedContext) {
      setStatus('error');
      setError('No session data. Complete a Surge cycle first.');
      return;
    }

    (async () => {
      try {
        let context = passedContext;
        if (!context) {
          context = await fetchCraneContext(session.sessionId);
        }

        setSupabaseContext(context);
        setMessages([
          createMessage('crane', buildCraneTelemetryOpener(context), { reveal: true }),
        ]);
        setStatus('ready');
      } catch (err) {
        setStatus('error');
        setError(err.message ?? 'Connection failed');
      }
    })();
  }, [passedContext]);

  useEffect(() => {
    scrollToPresent();
  }, [messages, scrollToPresent]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || status !== 'ready' || !supabaseContext || inferenceLockRef.current) {
      return;
    }

    setInput('');
    setMessages((prev) => [...prev, createMessage('user', trimmed)]);

    inferenceLockRef.current = true;
    try {
      const inference = await requestCraneInference({ userMessage: trimmed, supabaseContext });
      setMessages((prev) => [
        ...prev,
        createMessage('crane', inference.text, { reveal: true }),
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        createMessage('crane', 'Signal lost. Rest. Try again when stable.', { reveal: true }),
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
              <p className="font-sans text-sm tracking-[0.2em] text-white/20">Establishing contact.</p>
            )}
            {status === 'error' && (
              <p className="font-sans text-sm tracking-[0.2em] text-white/30">{error}</p>
            )}
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

      <form onSubmit={handleSubmit} className="relative z-10 shrink-0 px-14 pb-14 pt-6">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={status !== 'ready'}
          placeholder="Speak directly."
          rows={1}
          aria-label="Message to Crane"
          className="mx-auto block w-full max-w-2xl resize-none border-0 bg-transparent text-center font-sans text-sm tracking-[0.28em] text-white/35 placeholder:text-white/12 focus:outline-none focus:ring-0 disabled:opacity-30"
        />
      </form>
    </motion.div>
  );
}

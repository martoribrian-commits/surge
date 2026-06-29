import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCrane } from '../../context/CraneProvider';
import { useSequenceSessionOptional } from '../../context/SequenceSessionProvider';
import {
  buildCraneGuideOpener,
  buildCraneTelemetryOpener,
  fetchCraneContext,
  requestCraneGuideInference,
  requestCraneInference,
} from '../../lib/craneClient';
import { getCachedSessionPayload } from '../../lib/sessionPayload';
import { VARIANT_LIST } from '../../sequences';

const EASE = [0.25, 0.1, 0.25, 1];

const QUICK_PROMPTS = [
  'Which sequence should I pick?',
  'My heart is racing',
  'I feel stuck in my head',
  'Explain all five sequences',
];

function createMessage(role, content) {
  return { id: crypto.randomUUID(), role, content };
}

function MessageBubble({ message, isLatest }) {
  const isUser = message.role === 'user';
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
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const lockRef = useRef(false);
  const initializedRef = useRef(false);

  const resetPanel = useCallback(() => {
    setMessages([]);
    setInput('');
    setStatus('idle');
    setMode('guide');
    initializedRef.current = false;
  }, []);

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
          setMode('post-session');
          setMessages([createMessage('crane', buildCraneTelemetryOpener(context))]);
        } else {
          setMode('guide');
          setMessages([createMessage('crane', buildCraneGuideOpener())]);
        }
        setStatus('ready');
      } catch {
        setMode('guide');
        setMessages([createMessage('crane', buildCraneGuideOpener())]);
        setStatus('ready');
      }
    })();
  }, [isOpen, sessionId, resetPanel]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen, status]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || status !== 'ready' || lockRef.current) return;

    setInput('');
    const nextMessages = [...messages, createMessage('user', trimmed)];
    setMessages(nextMessages);
    lockRef.current = true;

    try {
      let inference;
      if (mode === 'post-session' && sessionId) {
        const context = await fetchCraneContext(sessionId);
        inference = await requestCraneInference({
          userMessage: trimmed,
          supabaseContext: context,
          conversationHistory: nextMessages.slice(0, -1),
        });
      } else {
        inference = await requestCraneGuideInference({
          userMessage: trimmed,
          conversationHistory: nextMessages.slice(0, -1),
        });
      }
      setMessages((prev) => [...prev, createMessage('crane', inference.text)]);
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
                  {mode === 'post-session' ? 'After your sequence' : 'Plain-language guide'}
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

            <div ref={scrollRef} className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6">
              {status === 'connecting' && (
                <p className="font-sans text-sm text-white/25">Connecting…</p>
              )}
              {messages.map((msg, i) => (
                <MessageBubble key={msg.id} message={msg} isLatest={i === messages.length - 1} />
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

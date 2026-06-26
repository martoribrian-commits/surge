import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HERON_INITIAL_MESSAGE,
  initiateHeronContact,
  requestHeronInference,
} from '../lib/heronClient';
import { getCachedSessionPayload } from '../lib/sessionPayload';

/**
 * Minimal Heron chat — Slow Tech, dark-only, no gamification.
 *
 * On mount: two-step fetch (Supabase context → Netlify inference).
 */
export default function HeronChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [supabaseContext, setSupabaseContext] = useState(null);
  const [status, setStatus] = useState('connecting'); // connecting | ready | error
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const initializedRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  // Two-step contact on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (!getCachedSessionPayload()?.sessionId) {
      setStatus('error');
      setError('No session data. Complete a Surge cycle first.');
      return;
    }

    (async () => {
      try {
        const result = await initiateHeronContact(HERON_INITIAL_MESSAGE);
        setSupabaseContext(result.supabaseContext);
        setMessages([
          { role: 'user', content: HERON_INITIAL_MESSAGE, system: true },
          { role: 'heron', content: result.reply },
        ]);
        setStatus('ready');
      } catch (err) {
        setStatus('error');
        setError(err.message ?? 'Connection failed');
      }
    })();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending || status !== 'ready' || !supabaseContext) return;

    setIsSending(true);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);

    try {
      const inference = await requestHeronInference({
        userMessage: trimmed,
        supabaseContext,
      });
      setMessages((prev) => [...prev, { role: 'heron', content: inference.text }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'heron', content: 'Signal lost. Rest. Try again when stable.' },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      className="relative flex h-screen w-screen flex-col bg-[#2d2d2d] text-gray-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-5">
        <p className="font-sans text-xs uppercase tracking-[0.35em] text-gray-500">Heron</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="font-sans text-[10px] uppercase tracking-[0.2em] text-gray-600 transition-colors hover:text-gray-400"
        >
          Exit
        </button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8">
        {status === 'connecting' && (
          <p className="font-sans text-sm tracking-[0.15em] text-gray-600">
            Establishing contact.
          </p>
        )}

        {status === 'error' && (
          <p className="font-sans text-sm tracking-[0.15em] text-gray-500">{error}</p>
        )}

        <div className="flex flex-col gap-6">
          {messages.map((msg, index) => (
            <motion.div
              key={`${msg.role}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`max-w-lg ${msg.role === 'heron' ? '' : 'ml-auto text-right'}`}
            >
              {msg.system ? null : (
                <p
                  className={`font-sans text-sm leading-relaxed tracking-[0.04em] ${
                    msg.role === 'heron' ? 'text-gray-200' : 'text-gray-500'
                  }`}
                >
                  {msg.content}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-white/5 px-6 py-5"
      >
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status !== 'ready' || isSending}
            placeholder="Speak."
            className="flex-1 bg-transparent font-sans text-sm tracking-[0.08em] text-white placeholder:text-gray-600 focus:outline-none disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={status !== 'ready' || isSending || !input.trim()}
            className="font-sans text-[10px] uppercase tracking-[0.25em] text-gray-500 transition-colors hover:text-white disabled:opacity-30"
          >
            Send
          </button>
        </div>
      </form>
    </motion.div>
  );
}

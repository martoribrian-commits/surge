import { useEffect, useState } from 'react';
import { loadEphemeralNote, saveEphemeralNote } from '../../lib/ephemeralStore';

/**
 * Secure brain dump — local only, 24h TTL. Ready for Supabase opt-in later.
 */
export default function EphemeralInput({ sessionId, onChange }) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (sessionId) {
      setText(loadEphemeralNote(sessionId));
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const timer = setTimeout(() => {
      saveEphemeralNote(sessionId, text);
      onChange?.(text);
    }, 400);
    return () => clearTimeout(timer);
  }, [text, sessionId, onChange]);

  return (
    <div className="flex flex-col">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What is still here..."
        rows={4}
        className="w-full resize-none rounded-sm border border-white/[0.08] bg-black/50 px-4 py-3 font-sans text-sm leading-relaxed text-[#c9ddd2] placeholder:text-[#4a5f54] focus:border-[#f5a623]/30 focus:outline-none"
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTokenManager } from '../../hooks/useTokenManager';
import { BRAND } from '../../brand/tokens';

/**
 * In-flow clinical token entry — keeps the user on the post-sequence dashboard.
 */
export default function ClinicalTokenModal({ open, onClose, onUnlocked }) {
  const { validateToken, isLoading, error } = useTokenManager();
  const [input, setInput] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await validateToken(input);
    if (result.valid) {
      setInput('');
      onUnlocked?.();
      onClose?.();
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
          />
          <motion.form
            onSubmit={handleSubmit}
            className="relative z-10 w-full max-w-md border border-white/10 bg-[#0A0A0A] p-6 shadow-2xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
          >
            <p
              className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: BRAND.clay }}
            >
              Clinical token
            </p>
            <h2 className="mt-2 font-sans text-xl font-bold tracking-tight" style={{ color: BRAND.bone }}>
              Unlock Crane recovery
            </h2>
            <p className="mt-2 font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
              Enter the six-character code from your provider. Unlocks personalized body debrief and
              recovery plans without leaving this session.
            </p>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABC123"
              maxLength={6}
              autoComplete="off"
              autoFocus
              className="mt-5 w-full border border-white/10 bg-black/50 px-4 py-3.5 text-center font-mono text-lg tracking-[0.35em] text-[#F4F0EB] placeholder:text-white/25 focus:border-[#B6502E]/50 focus:outline-none"
            />

            {error ? (
              <p className="mt-2 font-sans text-xs" style={{ color: BRAND.clay }}>
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-white/10 px-4 py-3 font-sans text-[10px] uppercase tracking-[0.18em] text-white/45"
              >
                Not now
              </button>
              <button
                type="submit"
                disabled={isLoading || input.length < 6}
                className="flex-1 border px-4 py-3 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] disabled:opacity-40"
                style={{
                  color: BRAND.bone,
                  borderColor: `${BRAND.clay}55`,
                  background: `${BRAND.clay}14`,
                }}
              >
                {isLoading ? 'Checking…' : 'Unlock'}
              </button>
            </div>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

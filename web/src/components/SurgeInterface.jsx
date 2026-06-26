import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSurgeEngine } from '../hooks/useSurgeEngine';
import { useTokenManager } from '../hooks/useTokenManager';

const GROUNDING_LINES = [
  'You are here.',
  'Your body is slowing down.',
  'Notice the weight of your feet.',
  'Notice the air entering your lungs.',
  'You are safe in this moment.',
];

/**
 * Primary somatic de-escalation interface.
 *
 * Dead-man's switch: user must press and hold to run the cycle.
 * Releasing instantly stops procedural audio synthesis.
 */
export default function SurgeInterface() {
  const { isHeronUnlocked, submitToken } = useTokenManager();
  const { intensity, isActive, isComplete, heartbeatPhase, startSurge, stopSurge } =
    useSurgeEngine(90);

  const [isPressed, setIsPressed] = useState(false);
  const [completionView, setCompletionView] = useState(null); // 'heron' | 'grounding' | null
  const [tokenInput, setTokenInput] = useState('');
  const [visibleLines, setVisibleLines] = useState(0);
  const pointerActiveRef = useRef(false);

  const handlePointerDown = useCallback(
    (event) => {
      event.preventDefault();
      if (completionView) return;

      pointerActiveRef.current = true;
      setIsPressed(true);
      startSurge();
    },
    [startSurge, completionView],
  );

  const handlePointerUp = useCallback(() => {
    if (!pointerActiveRef.current) return;
    pointerActiveRef.current = false;
    setIsPressed(false);
    stopSurge();
  }, [stopSurge]);

  // Route to completion view when cycle finishes naturally
  useEffect(() => {
    if (!isComplete) return;

    const timer = setTimeout(() => {
      setCompletionView(isHeronUnlocked ? 'heron' : 'grounding');
    }, 500);

    return () => clearTimeout(timer);
  }, [isComplete, isHeronUnlocked]);

  // Sequentially reveal grounding lines
  useEffect(() => {
    if (completionView !== 'grounding') return;

    const timers = GROUNDING_LINES.map((_, index) =>
      setTimeout(() => setVisibleLines(index + 1), index * 1800),
    );

    return () => timers.forEach(clearTimeout);
  }, [completionView]);

  const handleTokenSubmit = (event) => {
    event.preventDefault();
    if (submitToken(tokenInput)) {
      setTokenInput('');
    }
  };

  const showStrobe = intensity > 0.3 && !completionView;
  const showBreathing = intensity <= 0.3 && intensity > 0 && !completionView;

  return (
    <div
      className="fixed inset-0 select-none touch-none bg-black overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      {/* Visual somatic layers */}
      <AnimatePresence mode="wait">
        {showStrobe && <StrobeOverlay key="strobe" intensity={intensity} />}
        {showBreathing && (
          <BreathingGradient key="breathing" phase={heartbeatPhase} intensity={intensity} />
        )}
      </AnimatePresence>

      {/* Hold indicator when idle */}
      {!isActive && isPressed && !completionView && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-28 h-28 rounded-full border border-white/10"
            animate={{ scale: isPressed ? 0.92 : 1 }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>
      )}

      {/* Completion: Heron transition */}
      <AnimatePresence>
        {completionView === 'heron' && (
          <CompletionOverlay key="heron">
            <motion.p
              className="text-2xl font-extralight tracking-[0.35em] text-white/90 uppercase"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            >
              Heron
            </motion.p>
            <motion.p
              className="mt-6 text-base font-light text-white/50 text-center max-w-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
            >
              Transitioning to your somatic guide&hellip;
            </motion.p>
          </CompletionOverlay>
        )}

        {completionView === 'grounding' && (
          <CompletionOverlay key="grounding">
            <div className="flex flex-col items-center gap-6 px-10 max-w-md">
              {GROUNDING_LINES.slice(0, visibleLines).map((line) => (
                <motion.p
                  key={line}
                  className="text-xl font-light text-white/85 text-center"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                  {line}
                </motion.p>
              ))}
            </div>

            {!isHeronUnlocked && (
              <motion.form
                onSubmit={handleTokenSubmit}
                className="mt-16 flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 0.8 }}
              >
                <label htmlFor="clinical-token" className="sr-only">
                  Clinical Token
                </label>
                <input
                  id="clinical-token"
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="Enter Clinical Token"
                  maxLength={6}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-48 bg-transparent border-b border-white/15 text-center text-2xl font-light tracking-[0.3em] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                />
                <button
                  type="submit"
                  disabled={tokenInput.length !== 6}
                  className="mt-2 px-8 py-3 text-sm tracking-widest text-white/60 border border-white/15 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white/80 hover:border-white/25 transition-colors"
                >
                  Unlock
                </button>
              </motion.form>
            )}

            <motion.button
              type="button"
              onClick={() => {
                setCompletionView(null);
                setVisibleLines(0);
              }}
              className="mt-12 px-8 py-3 text-sm tracking-widest text-white/50 border border-white/10 hover:text-white/70 transition-colors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3 }}
            >
              Done
            </motion.button>
          </CompletionOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Photosensitive-safe 1 Hz alpha strobe (~well below 3–30 Hz trigger range). */
function StrobeOverlay({ intensity }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="absolute inset-0 bg-white"
        animate={{
          opacity: [intensity * 0.08, intensity * 0.2, intensity * 0.08],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}

/** Expanding/contracting radial gradient synced to 60 BPM heartbeat. */
function BreathingGradient({ phase, intensity }) {
  const breathScale = 0.4 + 0.6 * Math.sin(phase * Math.PI);
  const opacity = (1 - intensity) * 0.15;

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="rounded-full"
        style={{
          width: '120vmax',
          height: '120vmax',
          background: `radial-gradient(circle, rgba(255,255,255,${opacity}) 0%, rgba(255,255,255,${opacity * 0.3}) 40%, transparent 70%)`,
        }}
        animate={{ scale: breathScale }}
        transition={{ duration: 1, ease: 'easeInOut', repeat: Infinity }}
      />
    </motion.div>
  );
}

function CompletionOverlay({ children }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {children}
    </motion.div>
  );
}

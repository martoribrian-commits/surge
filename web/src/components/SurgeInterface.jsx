import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSurgeEngine } from '../hooks/useSurgeEngine';
import { useTokenManager } from '../hooks/useTokenManager';

/** Photosensitive-safe modulation ceiling (~1.5 Hz, well below 3–30 Hz trigger range). */
const CHAOS_CYCLE_DURATION = 0.67;

/** 60 BPM breathing rhythm — one full expand/contract per second. */
const BREATH_CYCLE_DURATION = 1.0;

/**
 * Primary somatic interface — wires useSurgeEngine + useTokenManager.
 *
 * Dead-man's switch: press and hold to run; release aborts instantly.
 */
export default function SurgeInterface() {
  const { isHeronUnlocked, submitToken } = useTokenManager();
  const { intensity, isActive, isComplete, startSurge, stopSurge } = useSurgeEngine(90);

  const [aborted, setAborted] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [heronRouted, setHeronRouted] = useState(false);
  const pointerActiveRef = useRef(false);

  // Simulate Heron routing after 2-second stillness
  useEffect(() => {
    if (!isComplete || !isHeronUnlocked || heronRouted) return;

    const timer = setTimeout(() => {
      setHeronRouted(true);
      routeToHeron();
    }, 2000);

    return () => clearTimeout(timer);
  }, [isComplete, isHeronUnlocked, heronRouted]);

  const handlePointerDown = useCallback(
    (event) => {
      event.preventDefault();
      if (isComplete) return;

      pointerActiveRef.current = true;
      setAborted(false);
      startSurge();
    },
    [isComplete, startSurge],
  );

  const handlePointerRelease = useCallback(() => {
    if (!pointerActiveRef.current) return;

    const wasActive = isActive;
    pointerActiveRef.current = false;
    stopSurge();

    if (wasActive && !isComplete) {
      setAborted(true);
    }
  }, [isActive, isComplete, stopSurge]);

  const handleTokenSubmit = (event) => {
    event.preventDefault();
    if (submitToken(tokenInput)) {
      setTokenInput('');
    }
  };

  // Copy opacity: active phrase fades as intensity drops below 0.5
  const activeCopyOpacity = isActive ? Math.min(1, intensity / 0.5) : 0;

  // Visual mode thresholds
  const showChaos = isActive && !isComplete && intensity > 0.8;
  const showBreathing = isActive && !isComplete && intensity <= 0.8;

  // Blend factor for smooth chaos → breathing handoff
  const breathingWeight = isActive ? Math.max(0, Math.min(1, (0.8 - intensity) / 0.8)) : 0;

  return (
    <div
      className="relative bg-black h-screen w-screen flex items-center justify-center overflow-hidden select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerRelease}
      onPointerLeave={handlePointerRelease}
      onPointerCancel={handlePointerRelease}
      style={{ touchAction: 'none' }}
    >
      {/* ── Visual overlay layer (beneath text) ── */}
      <AnimatePresence>
        {isActive && !isComplete && (
          <motion.div
            key="somatic-overlay"
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {/* Chaos: high-contrast white/amber modulation at photosensitive-safe frequency */}
            {showChaos && (
              <ChaosOverlay intensity={intensity} breathingWeight={breathingWeight} />
            )}

            {/* Breathing whitespace: radial gradient at 60 BPM */}
            {showBreathing && (
              <BreathingOverlay intensity={intensity} breathingWeight={breathingWeight} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Typography layer ── */}
      <div className="relative z-10 flex flex-col items-center px-8">
        <AnimatePresence mode="wait">
          {isComplete ? (
            <CompletionCopy
              key="complete"
              isHeronUnlocked={isHeronUnlocked}
              heronRouted={heronRouted}
              tokenInput={tokenInput}
              onTokenChange={setTokenInput}
              onTokenSubmit={handleTokenSubmit}
            />
          ) : isActive ? (
            <motion.p
              key="active"
              className="font-sans text-sm tracking-[0.2em] uppercase text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: activeCopyOpacity }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ color: activeCopyOpacity > 0.6 ? '#fff' : undefined }}
            >
              The system is resetting.
            </motion.p>
          ) : aborted ? (
            <motion.p
              key="aborted"
              className="font-sans text-sm tracking-[0.2em] uppercase text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              Release when ready.
            </motion.p>
          ) : (
            <motion.p
              key="idle"
              className="font-sans text-sm tracking-[0.2em] uppercase text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              Press and hold.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Visual sub-components ───────────────────────────────────────────────────

/**
 * Chaos phase — rapid alpha modulation between amber, white, and black.
 * Cycled at ~1.5 Hz to demand focus without entering photosensitive range.
 */
function ChaosOverlay({ intensity, breathingWeight }) {
  const peakOpacity = intensity * 0.35 * (1 - breathingWeight * 0.5);

  return (
    <motion.div
      className="absolute inset-0"
      animate={{
        backgroundColor: ['#000000', '#fbbf24', '#ffffff', '#000000'],
        opacity: [peakOpacity * 0.4, peakOpacity, peakOpacity * 0.6, peakOpacity * 0.3],
      }}
      transition={{
        duration: CHAOS_CYCLE_DURATION,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

/**
 * Decay phase — slow expanding/contracting radial gradient at 60 BPM.
 */
function BreathingOverlay({ intensity, breathingWeight }) {
  const calmOpacity = (1 - intensity) * 0.18 * (0.3 + breathingWeight * 0.7);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <motion.div
        className="rounded-full"
        style={{
          width: '130vmax',
          height: '130vmax',
          background: `radial-gradient(circle, rgba(255,255,255,${calmOpacity}) 0%, rgba(255,255,255,${calmOpacity * 0.25}) 45%, transparent 72%)`,
        }}
        animate={{ scale: [0.45, 1, 0.45] }}
        transition={{
          duration: BREATH_CYCLE_DURATION,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}

// ─── Completion / Heron handoff ────────────────────────────────────────────

function CompletionCopy({
  isHeronUnlocked,
  heronRouted,
  tokenInput,
  onTokenChange,
  onTokenSubmit,
}) {
  if (isHeronUnlocked) {
    return (
      <motion.p
        className="font-sans text-sm tracking-[0.2em] uppercase text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: heronRouted ? 0.4 : 1 }}
        transition={{ duration: 0.6 }}
      >
        Transitioning to Heron.
      </motion.p>
    );
  }

  return (
    <motion.form
      onSubmit={onTokenSubmit}
      className="flex flex-col items-center gap-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <label htmlFor="clinical-token" className="sr-only">
        Clinical Token
      </label>
      <input
        id="clinical-token"
        type="text"
        value={tokenInput}
        onChange={(e) => onTokenChange(e.target.value.toUpperCase().slice(0, 6))}
        placeholder="Clinical Token"
        maxLength={6}
        autoComplete="off"
        spellCheck={false}
        className="w-44 bg-transparent text-center font-sans text-lg tracking-[0.35em] text-white placeholder:text-gray-600 focus:outline-none"
      />
      <button
        type="submit"
        disabled={tokenInput.length !== 6}
        className="font-sans text-xs tracking-[0.25em] uppercase text-gray-400 hover:text-white disabled:text-gray-700 disabled:cursor-default transition-colors duration-300"
      >
        Submit
      </button>
    </motion.form>
  );
}

/** Placeholder routing — replace with React Router / deep link when Heron module ships. */
function routeToHeron() {
  // eslint-disable-next-line no-console
  console.info('[Surge] Routing to Heron recovery engine.');
}

import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSurgeEngine } from '../hooks/useSurgeEngine';
import { useTokenManager } from '../hooks/useTokenManager';

/** Hard ceiling: 1 Hz — one full beacon cycle per second at peak intensity. */
const MAX_PULSE_HZ = 1.0;

/** Resting cadence at baseline: 0.5 Hz (60 BPM half-cycle / one breath every 2 s). */
const MIN_PULSE_HZ = 0.5;

/**
 * Primary somatic interface — wires useSurgeEngine + useTokenManager.
 *
 * Dead-man's switch: press and hold to run; release aborts instantly.
 */
export default function SurgeInterface() {
  const { isHeronUnlocked, validateToken, error } = useTokenManager();
  const { intensity, isActive, isComplete, startSurge, stopSurge } = useSurgeEngine(90);

  const [aborted, setAborted] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [heronRouted, setHeronRouted] = useState(false);
  const pointerActiveRef = useRef(false);

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

  const handleTokenSubmit = async (event) => {
    event.preventDefault();
    const result = await validateToken(tokenInput);
    if (result.valid) {
      setTokenInput('');
    }
  };

  const activeCopyOpacity = isActive ? Math.min(1, intensity / 0.5) : 0;

  // Pulse frequency: 1 Hz at peak → 0.5 Hz as intensity decays to 0
  const pulseHz = MIN_PULSE_HZ + intensity * (MAX_PULSE_HZ - MIN_PULSE_HZ);
  const pulseDuration = 1 / pulseHz;

  return (
    <motion.div
      className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#000000] select-none touch-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerRelease}
      onPointerLeave={handlePointerRelease}
      onPointerCancel={handlePointerRelease}
      style={{ touchAction: 'none' }}
    >
      {/* ── Safe emergency beacon overlay (beneath text) ── */}
      <AnimatePresence>
        {isActive && !isComplete && (
          <motion.div
            key="somatic-overlay"
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <EmergencyBeaconOverlay intensity={intensity} pulseDuration={pulseDuration} />
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
              error={error}
              onTokenChange={setTokenInput}
              onTokenSubmit={handleTokenSubmit}
            />
          ) : isActive ? (
            <motion.p
              key="active"
              className="font-sans text-sm uppercase tracking-[0.2em] text-gray-400"
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
              className="font-sans text-sm uppercase tracking-[0.2em] text-gray-400"
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
              className="font-sans text-sm uppercase tracking-[0.2em] text-gray-400"
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
    </motion.div>
  );
}

// ─── Visual sub-components ───────────────────────────────────────────────────

/**
 * Heavy, deliberate emergency beacon — true black → dark amber → soft white.
 * Never exceeds 1 Hz; frequency decays with somatic intensity.
 */
function EmergencyBeaconOverlay({ intensity, pulseDuration }) {
  const peakGlow = 0.08 + intensity * 0.22;
  const radialOpacity = (1 - intensity) * 0.14;

  return (
    <>
      {/* Full-screen beacon throb */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundColor: [
            '#000000',
            '#1a1208',
            '#2d1f0a',
            '#fbbf24',
            '#e8e0d4',
            '#2d1f0a',
            '#000000',
          ],
          opacity: [0, peakGlow * 0.5, peakGlow * 0.85, peakGlow, peakGlow * 0.7, peakGlow * 0.3, 0],
        }}
        transition={{
          duration: pulseDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Breathing whitespace — radial gradient intensifies as beacon calms */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ opacity: 1 - intensity * 0.35 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      >
        <motion.div
          className="rounded-full"
          style={{
            width: '130vmax',
            height: '130vmax',
            background: `radial-gradient(circle, rgba(255,255,255,${radialOpacity}) 0%, rgba(251,191,36,${radialOpacity * 0.2}) 40%, transparent 72%)`,
          }}
          animate={{ scale: [0.5, 1, 0.5] }}
          transition={{
            duration: pulseDuration * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
    </>
  );
}

// ─── Completion / Heron handoff ────────────────────────────────────────────

function CompletionCopy({
  isHeronUnlocked,
  heronRouted,
  tokenInput,
  error,
  onTokenChange,
  onTokenSubmit,
}) {
  if (isHeronUnlocked) {
    return (
      <motion.p
        className="font-sans text-sm uppercase tracking-[0.2em] text-white"
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
        className="font-sans text-xs uppercase tracking-[0.25em] text-gray-400 transition-colors duration-300 hover:text-white disabled:cursor-default disabled:text-gray-700"
      >
        Submit
      </button>
      {error && (
        <p className="font-sans text-xs tracking-[0.15em] text-gray-500">{error}</p>
      )}
    </motion.form>
  );
}

function routeToHeron() {
  // eslint-disable-next-line no-console
  console.info('[Surge] Routing to Heron recovery engine.');
}

import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import FilmGrainOverlay from './FilmGrainOverlay';
import CraneTransition from './CraneTransition';
import { useSurgeEngine } from '../hooks/useSurgeEngine';

const MAX_PULSE_HZ = 1.0;
const MIN_PULSE_HZ = 0.5;
const SESSION_DURATION_S = 90;

/**
 * Primary somatic interface — analog visuals, cinematic stems, heavy interaction.
 */
export default function SurgeInterface() {
  const { intensity, isActive, isComplete, startSurge, stopSurge } =
    useSurgeEngine(SESSION_DURATION_S);

  const [aborted, setAborted] = useState(false);
  const [completedDuration, setCompletedDuration] = useState(SESSION_DURATION_S);
  const pointerActiveRef = useRef(false);
  const sessionStartRef = useRef(null);

  const handlePointerDown = useCallback(
    (event) => {
      event.preventDefault();
      if (isComplete) return;

      pointerActiveRef.current = true;
      setAborted(false);
      sessionStartRef.current = performance.now();
      startSurge();
    },
    [isComplete, startSurge],
  );

  const handlePointerRelease = useCallback(() => {
    if (!pointerActiveRef.current) return;

    const wasEngaged = isActive || intensity > 0;
    pointerActiveRef.current = false;
    stopSurge();

    if (wasEngaged && !isComplete) {
      setAborted(true);
    }
  }, [isActive, isComplete, intensity, stopSurge]);

  useEffect(() => {
    if (!isComplete || sessionStartRef.current === null) return;
    const elapsed = Math.round((performance.now() - sessionStartRef.current) / 1000);
    setCompletedDuration(Math.max(1, elapsed));
  }, [isComplete]);

  const activeCopyOpacity = isActive ? Math.min(1, intensity / 0.5) : 0;
  const pulseHz = MIN_PULSE_HZ + intensity * (MAX_PULSE_HZ - MIN_PULSE_HZ);
  const pulseDuration = 1 / pulseHz;

  const showFog = isActive && !isComplete && intensity > 0;

  return (
    <motion.div
      className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#000000] select-none touch-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      onPointerDown={isComplete ? undefined : handlePointerDown}
      onPointerUp={isComplete ? undefined : handlePointerRelease}
      onPointerLeave={isComplete ? undefined : handlePointerRelease}
      onPointerCancel={isComplete ? undefined : handlePointerRelease}
      style={{ touchAction: 'none' }}
    >
      {/* ── Cinematic fog / light bleed (below grain, above black) ── */}
      <AnimatePresence>
        {showFog && (
          <motion.div
            key="fog-overlay"
            className="pointer-events-none absolute inset-0 z-[2]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <FogBeaconOverlay intensity={intensity} pulseDuration={pulseDuration} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Analog film grain (above visuals, below text) ── */}
      <FilmGrainOverlay />

      {/* ── Copy layer ── */}
      {!isComplete && (
        <div className="relative z-10 flex flex-col items-center px-8">
          <AnimatePresence mode="wait">
            {isActive ? (
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
      )}

      {isComplete && (
        <CraneTransition
          durationInSeconds={completedDuration}
          completedFullCycle
        />
      )}
    </motion.div>
  );
}

/**
 * Heavy light bleeding through dense fog — layered blurs + radial gradients.
 * Never exceeds 1 Hz; decays with somatic intensity.
 */
function FogBeaconOverlay({ intensity, pulseDuration }) {
  const fogBlur = 8 + intensity * 28;
  const innerGlow = 0.06 + intensity * 0.28;
  const outerAmber = 0.04 + intensity * 0.18;
  const deepCore = 0.02 + intensity * 0.12;

  return (
    <div className="absolute inset-0">
      {/* Base fog plate */}
      <motion.div
        className="absolute inset-0"
        style={{
          backdropFilter: `blur(${fogBlur}px)`,
          WebkitBackdropFilter: `blur(${fogBlur}px)`,
        }}
        animate={{
          opacity: [deepCore, innerGlow, deepCore * 1.2],
        }}
        transition={{
          duration: pulseDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Inner hot core — light through smoke */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ opacity: [0.5, 1, 0.55] }}
        transition={{
          duration: pulseDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <motion.div
          className="rounded-full"
          style={{
            width: '140vmax',
            height: '140vmax',
            background: `
              radial-gradient(circle at 50% 48%,
                rgba(255,248,230,${innerGlow}) 0%,
                rgba(251,191,36,${outerAmber}) 18%,
                rgba(120,80,30,${deepCore}) 42%,
                transparent 68%
              ),
              radial-gradient(circle at 50% 52%,
                rgba(255,255,255,${deepCore * 0.6}) 0%,
                transparent 55%
              )
            `,
            filter: `blur(${4 + intensity * 12}px)`,
          }}
          animate={{ scale: [0.88, 1.06, 0.92] }}
          transition={{
            duration: pulseDuration * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {/* Outer atmospheric bleed */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center,
            rgba(251,191,36,${outerAmber * 0.5}) 0%,
            rgba(0,0,0,0) 70%
          )`,
          backdropFilter: `blur(${fogBlur * 0.5}px)`,
          WebkitBackdropFilter: `blur(${fogBlur * 0.5}px)`,
        }}
        animate={{ opacity: [0.3, 0.7, 0.35] }}
        transition={{
          duration: pulseDuration,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: pulseDuration * 0.25,
        }}
      />
    </div>
  );
}

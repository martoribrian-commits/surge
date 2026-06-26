import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import FilmGrainOverlay from './FilmGrainOverlay';
import HeronTransition from './HeronTransition';
import { useSurgeEngine } from '../hooks/useSurgeEngine';
import { SURGE_DURATION_S } from '../lib/surgeCurve';
import { getSessionCache } from '../lib/sessionPayload';

/**
 * Primary somatic interface — all visuals driven from the master decay curve.
 */
export default function SurgeInterface() {
  const {
    outputs,
    isActive,
    isComplete,
    isInterrupted,
    startSurge,
    stopSurge,
    resumeSurge,
  } = useSurgeEngine(SURGE_DURATION_S);

  const [aborted, setAborted] = useState(false);
  const [completedDuration, setCompletedDuration] = useState(SURGE_DURATION_S);
  const pointerActiveRef = useRef(false);

  const handlePointerDown = useCallback(
    (event) => {
      event.preventDefault();
      if (isComplete) return;

      pointerActiveRef.current = true;
      setAborted(false);

      if (isInterrupted) {
        resumeSurge();
        return;
      }

      startSurge();
    },
    [isComplete, isInterrupted, resumeSurge, startSurge],
  );

  const handlePointerRelease = useCallback(() => {
    if (!pointerActiveRef.current) return;

    const wasEngaged = isActive || outputs.t > 0;
    pointerActiveRef.current = false;
    stopSurge();

    if (wasEngaged && !isComplete) {
      setAborted(true);
    }
  }, [isActive, isComplete, outputs.t, stopSurge]);

  useEffect(() => {
    if (!isComplete) return;
    const cache = getSessionCache();
    if (cache?.duration) {
      setCompletedDuration(Math.max(1, cache.duration));
    }
  }, [isComplete]);

  const showFog = isActive && !isComplete && outputs.t > 0;

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
            <FogBeaconOverlay outputs={outputs} />
          </motion.div>
        )}
      </AnimatePresence>

      <FilmGrainOverlay />

      {!isComplete && (
        <div className="relative z-10 flex flex-col items-center px-8">
          <AnimatePresence mode="wait">
            {isInterrupted ? (
              <motion.p
                key="interrupted"
                className="font-sans text-sm uppercase tracking-[0.2em] text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                Connection lost. Hold to resume.
              </motion.p>
            ) : isActive ? (
              <motion.p
                key="active"
                className="font-sans text-sm uppercase tracking-[0.2em] text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: outputs.copyOpacity }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{ color: outputs.copyOpacity > 0.6 ? '#fff' : undefined }}
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
        <HeronTransition
          durationInSeconds={completedDuration}
          completedFullCycle
        />
      )}
    </motion.div>
  );
}

/**
 * Fog/beacon visuals — every value derived from deriveSurgeOutputs(), no independent timers.
 */
function FogBeaconOverlay({ outputs }) {
  const {
    fogBlur,
    innerGlow,
    outerAmber,
    deepCore,
    fogOpacity,
    beaconScale,
    beaconBlur,
    outerBleedOpacity,
  } = outputs;

  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: `blur(${fogBlur}px)`,
          WebkitBackdropFilter: `blur(${fogBlur}px)`,
          opacity: fogOpacity,
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-full"
          style={{
            width: '140vmax',
            height: '140vmax',
            transform: `scale(${beaconScale})`,
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
            filter: `blur(${beaconBlur}px)`,
          }}
        />
      </div>

      <div
        className="absolute inset-0"
        style={{
          opacity: outerBleedOpacity,
          background: `radial-gradient(ellipse at center,
            rgba(251,191,36,${outerAmber * 0.5}) 0%,
            rgba(0,0,0,0) 70%
          )`,
          backdropFilter: `blur(${fogBlur * 0.5}px)`,
          WebkitBackdropFilter: `blur(${fogBlur * 0.5}px)`,
        }}
      />
    </div>
  );
}

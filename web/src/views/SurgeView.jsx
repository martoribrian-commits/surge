import { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSurgeSession } from '../context/SurgeSessionProvider';
import { SurgePhase } from '../state/surgeSessionMachine';
import FilmGrainOverlay from '../components/FilmGrainOverlay';
import RegulationField from '../components/surge/RegulationField';
import TactileAnchor from '../components/surge/TactileAnchor';

/**
 * Entry + Regulation — zero-friction circuit breaker. Opens interactive immediately.
 */
export default function SurgeView() {
  const {
    phase,
    intensity,
    progress,
    engage,
    release,
  } = useSurgeSession();

  const pointerDownRef = useRef(false);

  const handlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      if (phase === SurgePhase.COMPLETING || phase === SurgePhase.AFTERMATH) return;
      pointerDownRef.current = true;
      engage();
    },
    [engage, phase],
  );

  const handlePointerUp = useCallback(() => {
    if (!pointerDownRef.current) return;
    pointerDownRef.current = false;
    release();
  }, [release]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden' && phase === SurgePhase.REGULATION) {
        pointerDownRef.current = false;
        release();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [phase, release]);

  const copy = (() => {
    if (phase === SurgePhase.COMPLETING) return 'The system has reset.';
    if (phase === SurgePhase.PAUSED) return 'Hold to resume.';
    if (phase === SurgePhase.REGULATION) return 'The system is resetting.';
    return 'Press and hold.';
  })();

  const copyOpacity =
    phase === SurgePhase.REGULATION
      ? Math.min(1, Math.max(0.2, intensity / 0.5))
      : 1;

  return (
    <motion.div
      className="relative flex h-screen w-screen select-none touch-none items-center justify-center overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      onPointerDown={
        phase === SurgePhase.COMPLETING ? undefined : handlePointerDown
      }
      onPointerUp={phase === SurgePhase.REGULATION ? handlePointerUp : undefined}
      onPointerLeave={phase === SurgePhase.REGULATION ? handlePointerUp : undefined}
      onPointerCancel={phase === SurgePhase.REGULATION ? handlePointerUp : undefined}
      style={{ touchAction: 'none' }}
    >
      <RegulationField phase={phase} progress={progress} intensity={intensity} />
      <FilmGrainOverlay />

      <div className="relative z-10 flex flex-col items-center gap-10 px-8">
        <TactileAnchor phase={phase} intensity={intensity} />

        <AnimatePresence mode="wait">
          <motion.p
            key={copy}
            className="max-w-xs text-center font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: copyOpacity, y: 0, color: copyOpacity > 0.65 ? '#fff' : undefined }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {copy}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

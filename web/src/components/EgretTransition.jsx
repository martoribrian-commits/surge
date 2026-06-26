import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buildSessionPayload,
  cacheSessionPayload,
  getSessionCache,
  submitSessionTelemetry,
} from '../lib/sessionPayload';
import { fetchEgretContext } from '../lib/egretClient';

const PULSE_DURATION_S = 1.2;
const GRAY_FADE_DURATION_S = 1.8;
const CALMING_GRAY = '#2d2d2d';
const FINAL_PULSE_COUNT = 3;

/**
 * Completion handoff — three final pulses, gray fade, optional Egret transition.
 */
export default function EgretTransition({ durationInSeconds, completedFullCycle }) {
  const navigate = useNavigate();
  const [pulseIndex, setPulseIndex] = useState(0);
  const [phase, setPhase] = useState('pulsing');
  const [isHandoffActive, setIsHandoffActive] = useState(false);

  const sessionPayload = useMemo(() => {
    const cached = getSessionCache();
    return buildSessionPayload(
      durationInSeconds,
      completedFullCycle,
      cached?.sessionId,
    );
  }, [durationInSeconds, completedFullCycle]);

  useEffect(() => {
    cacheSessionPayload(sessionPayload);
    submitSessionTelemetry(sessionPayload);
  }, [sessionPayload]);

  useEffect(() => {
    if (phase !== 'pulsing') return;

    if (pulseIndex >= FINAL_PULSE_COUNT) {
      setPhase('fading');
      const readyTimer = setTimeout(() => setPhase('ready'), GRAY_FADE_DURATION_S * 1000);
      return () => clearTimeout(readyTimer);
    }

    const pulseTimer = setTimeout(
      () => setPulseIndex((prev) => prev + 1),
      PULSE_DURATION_S * 1000,
    );
    return () => clearTimeout(pulseTimer);
  }, [pulseIndex, phase]);

  const backgroundColor = phase === 'pulsing' ? '#000000' : CALMING_GRAY;

  const handleTransitionToEgret = async () => {
    if (isHandoffActive) return;
    setIsHandoffActive(true);

    try {
      const supabaseContext = await fetchEgretContext(sessionPayload.sessionId);
      navigate('/egret', { state: { supabaseContext } });
    } catch {
      navigate('/egret');
    } finally {
      setIsHandoffActive(false);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, backgroundColor }}
      transition={{
        opacity: { duration: 0.4, ease: 'easeOut' },
        backgroundColor: { duration: GRAY_FADE_DURATION_S, ease: [0.25, 0.1, 0.25, 1] },
      }}
    >
      <AnimatePresence mode="sync">
        {phase === 'pulsing' && pulseIndex < FINAL_PULSE_COUNT && (
          <FinalPulse key={pulseIndex} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'ready' && (
          <motion.div
            key="egret-action"
            className="relative z-10 flex flex-col items-center gap-6 px-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <p className="font-sans text-sm uppercase tracking-[0.2em] text-gray-500">
              The system has reset.
            </p>
            <motion.button
              type="button"
              onClick={handleTransitionToEgret}
              disabled={isHandoffActive}
              className="group relative overflow-hidden rounded-full px-12 py-4 font-sans text-xs uppercase tracking-[0.35em] text-gray-300 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.04] transition-colors duration-700 group-hover:border-white/20 group-hover:bg-white/[0.08]"
              />
              <span className="relative z-10 transition-colors duration-500 group-hover:text-white">
                Continue with Egret.
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FinalPulse() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, rgba(251,191,36,0.14) 0%, rgba(255,255,255,0.06) 35%, transparent 65%)',
        }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: [0, 0.55, 0.25, 0], scale: [0.85, 1.05, 1, 0.95] }}
        transition={{ duration: PULSE_DURATION_S, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/**
 * Gateway screen — safety buffer before the somatic engine.
 * Slow Tech aesthetic: minimal copy, deliberate motion, premium hardware feel.
 */
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <motion.div
      className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#000000]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Hero block — centered with breathing whitespace */}
      <div className="flex flex-col items-center gap-5 px-8">
        <motion.h1
          className="font-sans text-4xl font-light tracking-[0.55em] text-white md:text-5xl"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.2, ease: 'easeOut' }}
        >
          SURGE
        </motion.h1>

        <motion.p
          className="font-sans text-sm tracking-[0.12em] text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
        >
          A somatic circuit breaker.
        </motion.p>

        <motion.button
          type="button"
          onClick={() => navigate('/start')}
          className="group relative mt-16 overflow-hidden rounded-full px-12 py-4 font-sans text-xs uppercase tracking-[0.35em] text-gray-300"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Pill shell — geometric, not a default web button */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.03] transition-colors duration-700 group-hover:border-amber-200/25 group-hover:bg-white/[0.06]"
          />
          <span
            aria-hidden
            className="absolute inset-0 rounded-full opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100"
            style={{
              background:
                'radial-gradient(circle at center, rgba(251,191,36,0.08) 0%, transparent 70%)',
            }}
          />
          <span className="relative z-10 transition-colors duration-500 group-hover:text-white">
            Enter System
          </span>
        </motion.button>
      </div>

      {/* Medical buffer — minimal disclaimer */}
      <motion.p
        className="absolute bottom-8 left-0 right-0 px-8 text-center font-sans text-[10px] leading-relaxed tracking-[0.06em] text-gray-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 1.2, ease: 'easeOut' }}
      >
        For acute nervous system regulation. Not a substitute for emergency medical care.
        Contains slow visual pulses.
      </motion.p>
    </motion.div>
  );
}

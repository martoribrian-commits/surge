import { motion } from 'framer-motion';

const RING_DELAYS = [0, 0.9, 1.8];

/**
 * Central press-and-hold anchor — visible at entry, subtle during regulation.
 */
export default function TactileAnchor({ phase, intensity }) {
  const isEntry = phase === 'entry';
  const isPaused = phase === 'paused';
  const isRegulating = phase === 'regulation';
  const showRings = isEntry || isPaused || (isRegulating && intensity > 0.2);

  const coreScale = isEntry ? [1, 1.05, 1] : isPaused ? [1, 1.03, 1] : [1, 1.02, 1];

  return (
    <div className="pointer-events-none relative flex h-48 w-48 items-center justify-center md:h-56 md:w-56">
      {showRings &&
        RING_DELAYS.map((delay) => (
          <motion.span
            key={delay}
            className="absolute rounded-full border border-[#f5a623]/20"
            style={{ width: '78%', height: '78%' }}
            animate={{ scale: [0.88, 1.32], opacity: [0.3, 0] }}
            transition={{
              duration: 3.4,
              repeat: Infinity,
              ease: 'easeOut',
              delay,
            }}
          />
        ))}

      <motion.div
        className="relative flex h-24 w-24 items-center justify-center rounded-full md:h-28 md:w-28"
        animate={{
          scale: coreScale,
          opacity: isRegulating && intensity < 0.15 ? 0.5 : 1,
        }}
        transition={{
          duration: isEntry ? 2.6 : 2.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 via-[#f5a623]/25 to-[#8b6914]/10" />
        <span
          className="relative rounded-full bg-white/90"
          style={{
            width: isEntry ? 8 : 6,
            height: isEntry ? 8 : 6,
          }}
        />
      </motion.div>
    </div>
  );
}

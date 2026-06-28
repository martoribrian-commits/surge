import { motion } from 'framer-motion';

export default function CinematicVignette({ intensity = 0.55, pulse = false }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-[2]"
      style={{
        background:
          'radial-gradient(ellipse 75% 70% at 50% 48%, transparent 35%, rgba(0,0,0,0.92) 100%)',
      }}
      animate={
        pulse
          ? { opacity: [intensity * 0.85, intensity, intensity * 0.85] }
          : { opacity: intensity }
      }
      transition={pulse ? { duration: 3.5, repeat: Infinity, ease: 'easeInOut' } : undefined}
    />
  );
}

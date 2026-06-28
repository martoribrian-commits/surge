import { motion } from 'framer-motion';
import { EASE_IN_OUT } from './motionPresets';

/**
 * Background layer with a static CSS fallback plus optional slow crossfade.
 * Framer Motion must never be the only source of background — it starts transparent.
 */
export default function AnimatedGround({
  className = 'absolute inset-0',
  style,
  backgrounds,
  duration = 18,
}) {
  const base = backgrounds?.[0] ?? style?.background;

  if (!backgrounds || backgrounds.length < 2) {
    return <div className={className} style={{ ...style, background: base }} aria-hidden />;
  }

  return (
    <motion.div
      className={className}
      style={{ ...style, background: base }}
      animate={{ background: backgrounds }}
      transition={{ duration, repeat: Infinity, ease: EASE_IN_OUT }}
      aria-hidden
    />
  );
}

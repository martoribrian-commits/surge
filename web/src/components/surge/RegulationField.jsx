import { motion } from 'framer-motion';

const SLOW = { duration: 1.4, ease: [0.25, 0.1, 0.25, 1] };

/**
 * UI deceleration field — high contrast at entry, nature gradients as progress advances.
 */
export default function RegulationField({ phase, progress, intensity }) {
  const isEntry = phase === 'entry';
  const isRegulating =
    phase === 'regulation' || phase === 'paused' || phase === 'completing';

  const forestOpacity = isEntry ? 0 : Math.min(1, progress * 1.4);
  const oceanOpacity = isEntry ? 0 : Math.max(0, (progress - 0.25) * 1.2);
  const dawnOpacity = isEntry ? 0 : Math.max(0, (progress - 0.5) * 1.1);
  const chaosGlow = isRegulating ? intensity * 0.35 : 0;

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <motion.div
        className="absolute inset-0 bg-black"
        animate={{ opacity: isEntry ? 1 : Math.max(0.15, 1 - progress) }}
        transition={SLOW}
      />

      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-[#061008] via-[#143328] to-[#0a1812]"
        animate={{ opacity: forestOpacity }}
        transition={SLOW}
      />

      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[#081420] via-[#1a3a52] to-[#0c1a28]"
        animate={{ opacity: oceanOpacity }}
        transition={SLOW}
      />

      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-[#1a140c]/80 via-[#3d3428]/35 to-transparent"
        animate={{ opacity: dawnOpacity }}
        transition={SLOW}
      />

      {isRegulating && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: chaosGlow }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="h-[140vmax] w-[140vmax] rounded-full"
            style={{
              background: `radial-gradient(circle at 50% 48%,
                rgba(255,248,230,${0.04 + intensity * 0.2}) 0%,
                rgba(245,166,35,${0.03 + intensity * 0.12}) 22%,
                transparent 65%)`,
              filter: `blur(${8 + intensity * 20}px)`,
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

import { motion } from 'framer-motion';
import AnimatedGround from './shared/AnimatedGround';
import { coherenceAuroraGradient } from './shared/groundStyles';

/**
 * 90s Heavy Tide — slow vertical tides synced to grief-weighted breath.
 */
export default function HeavyTideVisual({
  elapsedSeconds,
  palette,
  breathCycle = { inhale: 5, exhale: 7 },
  isEngaged,
  isPaused,
  holdCharge = 1,
}) {
  const cycleSeconds = breathCycle.inhale + breathCycle.exhale;
  const t = elapsedSeconds % cycleSeconds;
  const inhaling = t < breathCycle.inhale;
  const phaseT = inhaling
    ? t / breathCycle.inhale
    : (t - breathCycle.inhale) / breathCycle.exhale;

  const tideY = inhaling ? phaseT * 18 : 18 - phaseT * 22;
  const glow = isEngaged && !isPaused ? 0.2 + phaseT * 0.35 : 0.06;

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <AnimatedGround
        backgrounds={[
          coherenceAuroraGradient(palette, 0),
          coherenceAuroraGradient(palette, 1),
          coherenceAuroraGradient(palette, 0),
        ]}
        duration={28}
      />

      {/* Vertical tide layers */}
      {[0, 1, 2, 3].map((layer) => (
        <motion.div
          key={layer}
          className="pointer-events-none absolute inset-x-0"
          style={{
            height: '45%',
            bottom: `${8 + layer * 6}%`,
            background: `linear-gradient(180deg, transparent 0%, ${palette.accent}${Math.round(30 + layer * 12).toString(16).padStart(2, '0')} 40%, ${palette.accentCalm}${Math.round(40 + layer * 10).toString(16).padStart(2, '0')} 100%)`,
            filter: 'blur(24px)',
            opacity: isEngaged && !isPaused ? 0.55 - layer * 0.1 : 0.2,
          }}
          animate={{
            y: isEngaged && !isPaused ? [tideY + layer * 4, tideY - 6 + layer * 3] : 0,
          }}
          transition={{
            duration: inhaling ? breathCycle.inhale : breathCycle.exhale,
            ease: inhaling ? [0.22, 1, 0.36, 1] : [0.55, 0, 0.45, 1],
          }}
        />
      ))}

      {/* Slow descending droplets on exhale */}
      {!inhaling &&
        isEngaged &&
        !isPaused &&
        [0, 1, 2, 3, 4].map((d) => (
          <motion.div
            key={`${Math.floor(elapsedSeconds / cycleSeconds)}-${d}`}
            className="absolute rounded-full"
            style={{
              left: `${18 + d * 14}%`,
              top: '28%',
              width: 3,
              height: 3,
              background: palette.accentCalm,
              boxShadow: `0 0 8px ${palette.accentCalm}`,
            }}
            initial={{ y: 0, opacity: 0.6 }}
            animate={{ y: 120 + d * 20, opacity: 0 }}
            transition={{ duration: breathCycle.exhale, delay: d * 0.4, ease: 'easeIn' }}
          />
        ))}

      {/* Hold charge arc */}
      <svg
        className="absolute z-[1]"
        width="min(76vmin, 25rem)"
        height="min(76vmin, 25rem)"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(240,232,244,0.06)" strokeWidth="1" />
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke={palette.accentCalm}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={578}
          strokeDashoffset={
            isEngaged ? 578 * (1 - Math.min(1, Math.max(0, holdCharge ?? 0))) : 578
          }
          opacity={isEngaged ? 0.75 : 0.18}
          transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dashoffset 0.35s ease, opacity 0.35s ease' }}
        />
      </svg>

      {/* Tide orb — rises on inhale, settles on exhale */}
      <motion.div
        className="absolute z-[2] rounded-full"
        style={{
          width: 'min(68vmin, 22rem)',
          height: 'min(68vmin, 22rem)',
          boxShadow: `0 0 ${50 + glow * 70}px rgba(122,106,173,${glow}), inset 0 0 50px ${palette.accentCalm}22`,
          border: `1px solid ${palette.accent}55`,
          background: `radial-gradient(circle at 50% 38%, ${palette.accentCalm}44 0%, ${palette.background}90 72%)`,
        }}
        animate={{
          y: isEngaged && !isPaused ? (inhaling ? -12 * phaseT : 8 * phaseT) : 0,
          scale: inhaling ? 0.92 + phaseT * 0.14 : 1.06 - phaseT * 0.12,
          opacity: isPaused ? 0.5 : 1,
        }}
        transition={{
          y: { duration: inhaling ? breathCycle.inhale : breathCycle.exhale },
          scale: {
            duration: inhaling ? breathCycle.inhale : breathCycle.exhale,
            ease: inhaling ? [0.22, 1, 0.36, 1] : [0.55, 0, 0.45, 1],
          },
          opacity: { duration: 0.4 },
        }}
      />

      <motion.div
        className="absolute z-[3] h-2 w-2 rounded-full"
        style={{
          backgroundColor: palette.copy,
          boxShadow: `0 0 16px ${palette.accentCalm}`,
        }}
        animate={{
          y: isEngaged && !isPaused ? (inhaling ? -8 : 6) : 0,
          opacity: isEngaged && !isPaused ? 0.85 : 0.3,
        }}
        transition={{ duration: cycleSeconds, repeat: Infinity, ease: 'easeInOut' }}
      />

      {isPaused && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[4] bg-[#080818]/30 backdrop-blur-[1px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
    </div>
  );
}

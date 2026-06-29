import { motion } from 'framer-motion';
import AnimatedGround from './shared/AnimatedGround';
import { coherenceAuroraGradient } from './shared/groundStyles';

/**
 * 90s Coherence Ripple — aurora depth, breath-linked ripples, hold charge ring.
 */
export default function CoherenceRippleVisual({
  elapsedSeconds,
  palette,
  breathCycle = { inhale: 4, exhale: 6 },
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

  const scale = inhaling ? 0.68 + phaseT * 0.42 : 1.14 - phaseT * 0.4;
  const glow = isEngaged && !isPaused ? 0.25 + phaseT * 0.45 : 0.08;

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <AnimatedGround
        backgrounds={[
          coherenceAuroraGradient(palette, 0),
          coherenceAuroraGradient(palette, 1),
          coherenceAuroraGradient(palette, 0),
        ]}
        duration={22}
      />

      {/* Floating motes when engaged */}
      {isEngaged && !isPaused &&
        Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full"
            style={{
              left: `${15 + (i * 7) % 70}%`,
              top: `${20 + (i * 11) % 60}%`,
              background: i % 2 ? palette.accent : palette.accentCalm,
            }}
            animate={{
              y: [0, -30 - i * 4, 0],
              opacity: [0, 0.6, 0],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 4 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.25,
            }}
          />
        ))}

      {/* Expanding ripples on exhale */}
      {!inhaling &&
        isEngaged &&
        [0, 1, 2].map((r) => (
          <motion.div
            key={`${Math.floor(elapsedSeconds / cycleSeconds)}-${r}`}
            className="absolute rounded-full border"
            style={{
              width: 'min(52vmin, 18rem)',
              height: 'min(52vmin, 18rem)',
              borderColor: `${palette.accentCalm}55`,
            }}
            initial={{ scale: 0.7, opacity: 0.5 }}
            animate={{ scale: 1.8 + r * 0.3, opacity: 0 }}
            transition={{ duration: breathCycle.exhale, delay: r * 0.35, ease: 'easeOut' }}
          />
        ))}

      {/* Hold charge ring */}
      <svg
        className="absolute z-[1]"
        width="min(78vmin, 26rem)"
        height="min(78vmin, 26rem)"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(244,240,235,0.06)" strokeWidth="1" />
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke={palette.accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={578}
          strokeDashoffset={
            isEngaged
              ? 578 * (1 - Math.min(1, Math.max(0, holdCharge ?? 0)))
              : 578
          }
          opacity={isEngaged ? 0.85 : 0.2}
          transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dashoffset 0.35s ease, opacity 0.35s ease' }}
        />
      </svg>

      {/* Primary breath orb */}
      <motion.div
        className="absolute z-[2] rounded-full"
        style={{
          width: 'min(72vmin, 24rem)',
          height: 'min(72vmin, 24rem)',
          boxShadow: `0 0 ${60 + glow * 80}px rgba(90, 143, 114, ${glow}), inset 0 0 60px ${palette.accentCalm}33`,
          border: `1px solid ${palette.accent}66`,
          background: `radial-gradient(circle at 38% 32%, ${palette.accentCalm}55 0%, ${palette.background}88 70%)`,
        }}
        animate={{
          scale,
          opacity: isPaused ? 0.55 : 1,
        }}
        transition={{
          scale: {
            duration: inhaling ? breathCycle.inhale : breathCycle.exhale,
            ease: inhaling ? [0.22, 1, 0.36, 1] : [0.55, 0, 0.45, 1],
          },
          opacity: { duration: 0.4 },
        }}
      />

      <motion.div
        className="absolute z-[3] h-2.5 w-2.5 rounded-full"
        style={{
          backgroundColor: palette.copy,
          boxShadow: `0 0 20px ${palette.copy}`,
        }}
        animate={{
          scale: isEngaged && !isPaused ? [1, 1.18, 1] : 0.85,
          opacity: isEngaged && !isPaused ? 1 : 0.35,
        }}
        transition={{ duration: cycleSeconds, repeat: Infinity }}
      />

      {isPaused && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[4] bg-[#0A0A0A]/25 backdrop-blur-[1px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
    </div>
  );
}

import { motion } from 'framer-motion';
import { curveAtElapsed } from '../../lib/surgeCurve';

/**
 * Original static engine visuals — TV static at peak, shockwave rings, sub-bass glow.
 */
export default function StaticFieldVisual({
  elapsedSeconds,
  palette,
  isEngaged,
  isPaused,
}) {
  const state = curveAtElapsed(elapsedSeconds);
  const { chaos, heartbeat, progress } = state;
  const staticOpacity = isEngaged && !isPaused ? 0.08 + chaos * 0.42 : 0.04;
  const strobeActive = chaos > 0.45 && isEngaged && !isPaused;

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{ background: palette.background }}
        animate={{
          opacity: [0.92, 1, 0.94],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: 0.35 + heartbeat * 0.45,
          background: `radial-gradient(ellipse 80% 70% at 50% 45%, ${palette.accentCalm ?? palette.accent}55 0%, transparent 58%)`,
        }}
      />

      {/* Procedural static layer — opacity tied to chaos */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-[2] mix-blend-screen"
        aria-hidden
        animate={{ opacity: staticOpacity }}
        transition={{ duration: 0.15 }}
        style={{
          backgroundImage:
            'repeating-radial-gradient(circle at 17% 32%, transparent 0, rgba(255,255,255,0.03) 1px, transparent 2px), repeating-radial-gradient(circle at 83% 68%, transparent 0, rgba(255,255,255,0.025) 1px, transparent 2px)',
          backgroundSize: '3px 3px, 4px 4px',
        }}
      />

      {strobeActive ? (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[3] bg-white"
          aria-hidden
          animate={{ opacity: [0, 0.06, 0, 0.04, 0] }}
          transition={{ duration: 0.35, repeat: Infinity }}
        />
      ) : null}

      {/* Shockwave rings on heartbeat */}
      {isEngaged &&
        !isPaused &&
        heartbeat > 0.15 &&
        [0, 1].map((i) => (
          <motion.div
            key={`${Math.floor(elapsedSeconds)}-${i}`}
            className="absolute rounded-full border border-white/20"
            style={{
              width: 'min(50vmin, 17rem)',
              height: 'min(50vmin, 17rem)',
              boxShadow: `0 0 ${24 + heartbeat * 48}px rgba(244,240,235,${0.08 + heartbeat * 0.12})`,
            }}
            initial={{ scale: 0.8, opacity: 0.35 + heartbeat * 0.4 }}
            animate={{ scale: 1.6 + i * 0.2, opacity: 0 }}
            transition={{ duration: 2.4 - heartbeat * 0.5, delay: i * 0.3, ease: 'easeOut' }}
          />
        ))}

      {/* Core beacon — clay pulse at chaos, bone at rest */}
      <motion.div
        className="absolute z-[4] rounded-full"
        style={{
          width: 'min(42vmin, 14rem)',
          height: 'min(42vmin, 14rem)',
          border: `1px solid ${chaos > 0.4 ? palette.accentCalm : palette.accent}88`,
          background: `radial-gradient(circle at 50% 42%, rgba(244,240,235,${0.08 + heartbeat * 0.18}) 0%, transparent 62%)`,
          boxShadow: `0 0 ${40 + chaos * 60}px ${palette.accentCalm ?? palette.accent}44`,
        }}
        animate={{
          scale: isEngaged && !isPaused ? [0.9 + chaos * 0.06, 1.04, 0.92] : 0.86,
          opacity: isPaused ? 0.45 : 1,
        }}
        transition={{
          duration: chaos > 0.35 ? 0.28 : 1.2,
          repeat: isEngaged && !isPaused ? Infinity : 0,
          ease: 'easeInOut',
        }}
      />

      {/* Progress arc */}
      <svg
        className="absolute z-[5]"
        width="min(52vmin, 18rem)"
        height="min(52vmin, 18rem)"
        viewBox="0 0 200 200"
        aria-hidden
      >
        <circle cx="100" cy="100" r="94" fill="none" stroke="rgba(244,240,235,0.06)" strokeWidth="1" />
        <circle
          cx="100"
          cy="100"
          r="94"
          fill="none"
          stroke={palette.accentCalm ?? palette.accent}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={590}
          strokeDashoffset={590 * (1 - progress)}
          transform="rotate(-90 100 100)"
          opacity={isEngaged ? 0.7 : 0.25}
        />
      </svg>

      {isPaused ? (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[6] bg-[#0A0A0A]/35 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      ) : null}
    </div>
  );
}

import { motion } from 'framer-motion';
import { curveAtElapsed } from '../../lib/surgeCurve';

/**
 * Classic 90s Vagal Downshift — chaos-to-heartbeat decay, fog beacon, expanding rings.
 * Visual parity with the original static engine.
 */
export default function VagalDownshiftVisual({
  elapsedSeconds,
  progress,
  palette,
  isEngaged,
  isPaused,
}) {
  const state = curveAtElapsed(elapsedSeconds);
  const { chaos, heartbeat } = state;
  const pulseHz = 0.5 + heartbeat * 0.5;
  const pulseDuration = 1 / pulseHz;
  const fogOpacity = isEngaged && !isPaused ? 0.04 + chaos * 0.28 + heartbeat * 0.12 : 0.02;
  const ringCount = 3;

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Clay / ember aurora — original landing palette */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            `radial-gradient(ellipse 90% 70% at 30% 35%, ${palette.accent}44 0%, transparent 52%), radial-gradient(ellipse 80% 60% at 72% 62%, ${palette.accentCalm}30 0%, transparent 50%), ${palette.background}`,
            `radial-gradient(ellipse 85% 65% at 68% 28%, ${palette.accentCalm}36 0%, transparent 48%), radial-gradient(ellipse 75% 55% at 32% 72%, ${palette.accent}38 0%, transparent 50%), ${palette.backgroundEnd ?? palette.background}`,
            `radial-gradient(ellipse 90% 70% at 30% 35%, ${palette.accent}44 0%, transparent 52%), radial-gradient(ellipse 80% 60% at 72% 62%, ${palette.accentCalm}30 0%, transparent 50%), ${palette.background}`,
          ],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Cinematic fog beacon — intensity linked to decay curve */}
      {isEngaged && !isPaused ? (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[1]"
          animate={{ opacity: [fogOpacity * 0.7, fogOpacity, fogOpacity * 0.75] }}
          transition={{ duration: pulseDuration, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ filter: `blur(${8 + chaos * 24}px)` }}
          >
            <motion.div
              className="rounded-full"
              style={{
                width: '140vmax',
                height: '140vmax',
                background: `radial-gradient(circle at 50% 48%,
                  rgba(255,248,230,${0.06 + heartbeat * 0.2}) 0%,
                  rgba(182,80,46,${0.04 + chaos * 0.18}) 22%,
                  transparent 68%)`,
              }}
              animate={{ scale: [0.88, 1.05 + chaos * 0.08, 0.9] }}
              transition={{ duration: pulseDuration * 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      ) : null}

      {/* Heartbeat rings */}
      {isEngaged &&
        !isPaused &&
        Array.from({ length: ringCount }).map((_, i) => (
          <motion.div
            key={`${Math.floor(elapsedSeconds * pulseHz)}-${i}`}
            className="absolute rounded-full border"
            style={{
              width: 'min(48vmin, 16rem)',
              height: 'min(48vmin, 16rem)',
              borderColor: `${palette.accent}${heartbeat > 0.2 ? '88' : '44'}`,
              boxShadow: `0 0 ${20 + heartbeat * 40}px ${palette.accent}33`,
            }}
            initial={{ scale: 0.75 + i * 0.05, opacity: 0.15 + heartbeat * 0.5 }}
            animate={{ scale: 1.5 + i * 0.15 + heartbeat * 0.2, opacity: 0 }}
            transition={{
              duration: 2.2 - heartbeat * 0.4,
              delay: i * (0.35 - heartbeat * 0.1),
              ease: 'easeOut',
              repeat: Infinity,
              repeatDelay: 0.2,
            }}
          />
        ))}

      {/* Chaos strobe core */}
      <motion.div
        className="absolute z-[2] rounded-full"
        style={{
          width: 'min(44vmin, 15rem)',
          height: 'min(44vmin, 15rem)',
          border: `1px solid ${palette.accent}${isEngaged ? '99' : '44'}`,
          background: `radial-gradient(circle at 40% 35%, ${palette.accent}55 0%, ${palette.background}cc 65%)`,
          boxShadow: `0 0 ${30 + chaos * 70}px ${palette.accent}66`,
        }}
        animate={{
          scale: isEngaged && !isPaused ? [0.92 + chaos * 0.08, 1.02, 0.94] : 0.88,
          opacity: isPaused ? 0.5 : 1,
        }}
        transition={{
          duration: chaos > 0.4 ? 0.45 : pulseDuration,
          repeat: isEngaged && !isPaused ? Infinity : 0,
          ease: 'easeInOut',
        }}
      />

      {/* Decay curve dot — brand logomark anchor */}
      <motion.div
        className="absolute z-[3] h-2 w-2 rounded-full"
        style={{
          background: palette.copy,
          boxShadow: `0 0 16px ${palette.accent}`,
        }}
        animate={{
          scale: isEngaged && !isPaused ? [1, 1.15 + heartbeat * 0.1, 1] : 0.8,
          opacity: isEngaged ? 0.9 : 0.35,
        }}
        transition={{ duration: pulseDuration, repeat: Infinity }}
      />

      {isPaused ? (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[4] bg-[#0A0A0A]/30 backdrop-blur-[1px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      ) : null}
    </div>
  );
}

import { motion } from 'framer-motion';
import StillThawCanvas from './shared/StillThawCanvas';
import { shellGradient } from './shared/groundStyles';

const PHASES = [
  { until: 20, label: 'Dormant' },
  { until: 45, label: 'Thawing' },
  { until: 60, label: 'Re-entering' },
];

/**
 * 60s Still Thaw — cold shutdown thaws into warm somatic presence.
 */
export default function StillThawVisual({ elapsedSeconds, progress, palette, transitionAtSeconds = 20 }) {
  const phase = PHASES.find((p) => elapsedSeconds < p.until)?.label ?? 'Re-entering';
  const thaw = Math.min(1, progress * 1.1 + elapsedSeconds / 60);
  const isWarming = elapsedSeconds >= transitionAtSeconds;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: shellGradient(palette) }}
    >
      <StillThawCanvas elapsedSeconds={elapsedSeconds} progress={progress} palette={palette} />

      {/* Cold vignette fades as warmth returns */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          opacity: 0.55 * (1 - thaw * 0.85),
          background: `radial-gradient(circle at 50% 45%, transparent 25%, rgba(4,8,16,0.9) 100%)`,
        }}
        transition={{ duration: 0.8 }}
      />

      {/* Warm bloom at transition */}
      {isWarming && (
        <motion.div
          className="pointer-events-none absolute inset-0 mix-blend-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.25, 0.12] }}
          transition={{ duration: 2.5 }}
          style={{
            background: `radial-gradient(circle at 50% 65%, ${palette.accentCalm}44 0%, transparent 55%)`,
          }}
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-[18%] flex justify-center">
        <motion.span
          key={phase}
          className="font-sans text-[9px] font-bold uppercase tracking-[0.32em]"
          style={{ color: `${isWarming ? palette.accentCalm : palette.accent}99` }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 0.55, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {phase}
        </motion.span>
      </div>
    </div>
  );
}

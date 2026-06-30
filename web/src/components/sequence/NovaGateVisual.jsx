import { motion } from 'framer-motion';
import NovaGateCanvas from './shared/NovaGateCanvas';
import { shellGradient } from './shared/groundStyles';

const PHASES = [
  { until: 15, label: 'Gate opening' },
  { until: 42, label: 'Warp transit' },
  { until: 60, label: 'Still point' },
];

/**
 * 60s Nova Gate — cinematic hyperspace tunnel with decelerating starfield.
 */
export default function NovaGateVisual({ elapsedSeconds, progress, palette }) {
  const phase =
    PHASES.find((p) => elapsedSeconds < p.until)?.label ?? 'Still point';
  const warpIntensity = elapsedSeconds < 42 ? Math.min(1, elapsedSeconds / 20) : Math.max(0, 1 - (elapsedSeconds - 42) / 18);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: shellGradient(palette) }}
    >
      <NovaGateCanvas
        elapsedSeconds={elapsedSeconds}
        progress={progress}
        palette={palette}
      />

      {/* Lens flare streaks at peak warp */}
      <motion.div
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        animate={{
          opacity: warpIntensity * 0.35,
          background: [
            `linear-gradient(105deg, transparent 40%, ${palette.accent}33 50%, transparent 60%)`,
            `linear-gradient(-105deg, transparent 40%, ${palette.accentCalm}33 50%, transparent 60%)`,
            `linear-gradient(105deg, transparent 40%, ${palette.accent}33 50%, transparent 60%)`,
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Phase indicator — minimal */}
      <div className="pointer-events-none absolute inset-x-0 top-[18%] flex justify-center">
        <motion.span
          key={phase}
          className="font-sans text-[9px] font-bold uppercase tracking-[0.32em]"
          style={{ color: `${palette.accent}99` }}
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

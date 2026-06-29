import { motion } from 'framer-motion';
import VagalFogCanvas from './shared/VagalFogCanvas';
import { curveAtElapsed, breathLabel } from '../../lib/surgeCurve';

/**
 * Vagal Downshift — clinical visual decay protocol.
 * Cool teal fog descent + breath diaphragm. Zero static. Zero chaos strobe.
 */
export default function VagalDownshiftVisual({
  elapsedSeconds,
  progress,
  palette,
  isEngaged,
  isPaused,
  isComplete = false,
}) {
  const state = curveAtElapsed(elapsedSeconds);
  const { heartbeat } = state;
  const breathCue = heartbeat > 0.35 ? breathLabel(elapsedSeconds) : null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <VagalFogCanvas
        elapsedSeconds={elapsedSeconds}
        isEngaged={isEngaged}
        isPaused={isPaused}
        isComplete={isComplete}
        palette={palette}
      />

      {/* Clinical modality badge — always visible when engaged */}
      {isEngaged && !isPaused ? (
        <div className="pointer-events-none absolute inset-x-0 top-[28%] z-[2] flex justify-center">
          <motion.div
            className="rounded-sm border px-4 py-2 font-sans text-[9px] font-semibold uppercase tracking-[0.28em]"
            style={{
              color: palette.accentCalm ?? '#8FB596',
              borderColor: `${palette.accent ?? '#6B9AAA'}44`,
              background: 'rgba(4, 8, 16, 0.55)',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Visual decay protocol
          </motion.div>
        </div>
      ) : null}

      {/* Breath phase label in tail */}
      {breathCue && isEngaged && !isPaused ? (
        <motion.p
          className="pointer-events-none absolute inset-x-0 bottom-[32%] z-[2] text-center font-sans text-[10px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: `${palette.accentCalm ?? '#8FB596'}99` }}
          animate={{ opacity: [0.4, 0.85, 0.4] }}
          transition={{ duration: 12, repeat: Infinity }}
        >
          Breath · {breathCue}
        </motion.p>
      ) : null}

      {/* Progress rail — clinical readout */}
      <div className="pointer-events-none absolute inset-x-8 bottom-[18%] z-[2]">
        <div className="h-px w-full bg-white/[0.06]">
          <motion.div
            className="h-full origin-left"
            style={{ background: `linear-gradient(90deg, ${palette.accent}, ${palette.accentCalm})` }}
            animate={{ scaleX: progress }}
            transition={{ duration: 0.15 }}
          />
        </div>
        <p
          className="mt-2 font-sans text-[9px] uppercase tracking-[0.22em]"
          style={{ color: 'rgba(143, 181, 150, 0.45)' }}
        >
          Arousal decay · {Math.round(progress * 100)}%
        </p>
      </div>

      {isPaused ? (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[4] bg-[#020610]/50 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      ) : null}
    </div>
  );
}

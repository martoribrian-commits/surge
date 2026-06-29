import { AnimatePresence, motion } from 'framer-motion';
import FilmGrainOverlay from '../FilmGrainOverlay';
import SequenceChrome from './SequenceChrome';
import InteractionGuide from './InteractionGuide';
import CinematicVignette from './shared/CinematicVignette';
import { shellGradient } from './shared/groundStyles';
import { BRAND } from '../../brand/tokens';
import { EASE_IN_OUT } from './shared/motionPresets';

/**
 * Unified sequence stage — fixed layers, brand ground, chrome always reachable.
 */
export default function SequenceStage({
  variant,
  elapsedSeconds,
  progress,
  phaseLabel,
  hint,
  isPaused = false,
  interactionMode,
  onExit,
  onChangeSequence,
  children,
  interactionLayer = null,
}) {
  const { palette } = variant;
  const ground = shellGradient(palette);

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none"
      style={{ background: palette.background ?? BRAND.void }}
    >
      <div className="absolute inset-0" style={{ background: ground }} aria-hidden />

      <motion.div
        className="absolute inset-0"
        style={{ background: ground }}
        animate={{ opacity: [0.94, 1, 0.94] }}
        transition={{ duration: 10, repeat: Infinity, ease: EASE_IN_OUT }}
        aria-hidden
      />

      <div className="absolute inset-0 z-0">{children}</div>

      {interactionLayer}

      <CinematicVignette intensity={0.45} pulse={progress > 0 && progress < 0.15} />
      <FilmGrainOverlay />

      <SequenceChrome
        variant={variant}
        elapsedSeconds={elapsedSeconds}
        progress={progress}
        phaseLabel={phaseLabel}
        isPaused={isPaused}
        onExit={onExit}
        onChangeSequence={onChangeSequence}
      />

      <InteractionGuide
        mode={interactionMode ?? variant.interactionMode}
        hint={hint}
        isPaused={isPaused}
        isComplete={progress >= 1}
        accent={palette.accent}
        accentCalm={palette.accentCalm}
      />

      <AnimatePresence>
        {progress >= 1 ? (
          <motion.div
            key="complete-veil"
            className="pointer-events-none absolute inset-0 z-30 bg-[#0A0A0A]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ duration: 1.6, ease: EASE_IN_OUT }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

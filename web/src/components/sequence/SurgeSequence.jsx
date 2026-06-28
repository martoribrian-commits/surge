import { AnimatePresence, motion } from 'framer-motion';
import FilmGrainOverlay from '../FilmGrainOverlay';
import SequenceHud from './SequenceHud';
import InteractionGuide from './InteractionGuide';
import CinematicVignette from './shared/CinematicVignette';
import { EASE_IN_OUT } from './shared/motionPresets';

const SHELL_TRANSITION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.9, ease: EASE_IN_OUT },
};

/**
 * Base shell — cinematic ground, vignette, HUD, bottom interaction guide.
 */
export default function SurgeSequence({
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
  containerProps = {},
}) {
  const { palette } = variant;
  const { className: containerClass, style: containerStyle, ...restContainer } = containerProps;

  return (
    <motion.div
      className={`relative h-screen w-screen select-none touch-none overflow-hidden ${containerClass ?? ''}`}
      {...SHELL_TRANSITION}
      {...restContainer}
      style={{ touchAction: 'none', ...containerStyle }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `linear-gradient(165deg, ${palette.background} 0%, ${palette.backgroundEnd ?? palette.background} 55%, ${palette.background} 100%)`,
        }}
        transition={{ duration: 2, ease: EASE_IN_OUT }}
      />

      <div className="absolute inset-0">{children}</div>

      <CinematicVignette intensity={0.5} pulse={progress > 0 && progress < 0.15} />
      <FilmGrainOverlay />

      <SequenceHud
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
            animate={{ opacity: 0.4 }}
            transition={{ duration: 1.6, ease: EASE_IN_OUT }}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

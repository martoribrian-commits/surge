import { AnimatePresence, motion } from 'framer-motion';
import FilmGrainOverlay from '../FilmGrainOverlay';
import SequenceHud from './SequenceHud';
import InteractionGuide from './InteractionGuide';
import CinematicVignette from './shared/CinematicVignette';
import { shellGradient } from './shared/groundStyles';
import { EASE_IN_OUT } from './shared/motionPresets';

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
  const ground = shellGradient(palette);

  return (
    <motion.div
      className={`relative h-screen w-screen select-none touch-none overflow-hidden ${containerClass ?? ''}`}
      initial={false}
      animate={{ opacity: 1 }}
      {...restContainer}
      style={{ touchAction: 'none', background: palette.background, ...containerStyle }}
    >
      <div className="absolute inset-0" style={{ background: ground }} aria-hidden />

      <motion.div
        className="absolute inset-0"
        style={{ background: ground }}
        animate={{ opacity: [0.92, 1, 0.92] }}
        transition={{ duration: 8, repeat: Infinity, ease: EASE_IN_OUT }}
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

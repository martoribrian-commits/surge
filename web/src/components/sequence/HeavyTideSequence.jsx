import { useCallback } from 'react';
import SequenceStage from './SequenceStage';
import HoldSurface from './HoldSurface';
import HeavyTideVisual from './HeavyTideVisual';
import { InteractionMode } from '../../sequences';

export default function HeavyTideSequence({
  variant,
  clock,
  haptics,
  isEngaged,
  onEngage,
  onRelease,
  onStarted,
  onExit,
  onChangeSequence,
}) {
  const breathCycle = variant.breathCycle ?? { inhale: 5, exhale: 7 };
  const cycleT = clock.elapsedSeconds % (breathCycle.inhale + breathCycle.exhale);
  const breathPhase =
    cycleT < breathCycle.inhale ? 'In' : cycleT < breathCycle.inhale + 0.5 ? 'Hold' : 'Out';

  const phaseLabel = clock.isPaused
    ? 'Paused'
    : clock.progress > 0.7
      ? 'Weight lifting'
      : 'Moving through';

  const hint = clock.isComplete
    ? undefined
    : clock.isPaused
      ? 'Hold to resume'
      : isEngaged
        ? breathPhase
        : 'Press and hold';

  const handleEngage = useCallback(() => {
    haptics.holdEngage(variant.id);
    onEngage?.();
    onStarted?.();
  }, [haptics, variant.id, onEngage, onStarted]);

  const handleRelease = useCallback(() => {
    haptics.holdRelease();
    onRelease?.();
  }, [haptics, onRelease]);

  return (
    <SequenceStage
      variant={variant}
      elapsedSeconds={clock.elapsedSeconds}
      progress={clock.progress}
      phaseLabel={phaseLabel}
      hint={hint}
      isPaused={clock.isPaused}
      interactionMode={InteractionMode.HOLD}
      onExit={onExit}
      onChangeSequence={onChangeSequence}
      interactionLayer={<HoldSurface onEngage={handleEngage} onRelease={handleRelease} />}
    >
      <HeavyTideVisual
        elapsedSeconds={clock.elapsedSeconds}
        palette={variant.palette}
        breathCycle={breathCycle}
        isEngaged={isEngaged}
        isPaused={clock.isPaused}
        holdCharge={isEngaged ? 1 : clock.progress}
      />
    </SequenceStage>
  );
}

HeavyTideSequence.interactionMode = InteractionMode.HOLD;

import { useCallback } from 'react';
import SequenceStage from './SequenceStage';
import HoldSurface from './HoldSurface';
import FlashFreezeVisual from './FlashFreezeVisual';
import { InteractionMode } from '../../sequences';

export default function FlashFreezeSequence({
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
  const freezeLevel = isEngaged ? Math.min(1, clock.progress * 1.1) : 0;

  const phaseLabel = clock.isPaused
    ? 'Paused'
    : freezeLevel > 0.55
      ? 'Crystal lock'
      : freezeLevel > 0.2
        ? 'Time slowing'
        : 'Thermal surge';

  const hint = clock.isComplete
    ? undefined
    : clock.isPaused
      ? 'Hold to resume'
      : isEngaged
        ? 'Freeze'
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
      <FlashFreezeVisual
        elapsedSeconds={clock.elapsedSeconds}
        progress={clock.progress}
        palette={variant.palette}
        isEngaged={isEngaged}
        isPaused={clock.isPaused}
      />
    </SequenceStage>
  );
}

FlashFreezeSequence.interactionMode = InteractionMode.HOLD;

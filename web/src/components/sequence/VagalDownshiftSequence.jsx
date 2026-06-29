import { useCallback } from 'react';
import SequenceStage from './SequenceStage';
import HoldSurface from './HoldSurface';
import VagalDownshiftVisual from './VagalDownshiftVisual';
import { InteractionMode } from '../../sequences';
import { curveAtElapsed, phaseAt } from '../../lib/surgeCurve';

export default function VagalDownshiftSequence({
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
  const state = curveAtElapsed(clock.elapsedSeconds);
  const phase = phaseAt(state);

  const phaseLabel = clock.isPaused ? 'Paused' : phase.label;

  const hint = clock.isComplete
    ? undefined
    : clock.isPaused
      ? 'Hold to resume'
      : isEngaged
        ? phase.hint
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
      <VagalDownshiftVisual
        elapsedSeconds={clock.elapsedSeconds}
        progress={clock.progress}
        palette={variant.palette}
        isEngaged={isEngaged}
        isPaused={clock.isPaused}
      />
    </SequenceStage>
  );
}

VagalDownshiftSequence.interactionMode = InteractionMode.HOLD;

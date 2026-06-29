import { useCallback } from 'react';
import SequenceStage from './SequenceStage';
import HoldSurface from './HoldSurface';
import StaticFieldVisual from './StaticFieldVisual';
import { InteractionMode } from '../../sequences';
import { curveAtElapsed, phaseAt } from '../../lib/surgeCurve';
import { useStaticFieldHaptics } from '../../hooks/useStaticFieldHaptics';

export default function StaticFieldSequence({
  variant,
  clock,
  isEngaged,
  onEngage,
  onRelease,
  onStarted,
  onExit,
  onChangeSequence,
}) {
  const phase = phaseAt(curveAtElapsed(clock.elapsedSeconds));

  useStaticFieldHaptics({
    elapsedMs: clock.elapsedMs,
    isEngaged,
    isComplete: clock.isComplete,
    enabled: true,
  });

  const phaseLabel = clock.isPaused ? 'Paused' : phase.label;

  const hint = clock.isComplete
    ? undefined
    : clock.isPaused
      ? 'Hold to resume'
      : isEngaged
        ? phase.hint
        : 'Press and hold';

  const handleEngage = useCallback(() => {
    onEngage?.();
    onStarted?.();
  }, [onEngage, onStarted]);

  const handleRelease = useCallback(() => {
    onRelease?.();
  }, [onRelease]);

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
      <StaticFieldVisual
        elapsedSeconds={clock.elapsedSeconds}
        palette={variant.palette}
        isEngaged={isEngaged}
        isPaused={clock.isPaused}
      />
    </SequenceStage>
  );
}

StaticFieldSequence.interactionMode = InteractionMode.HOLD;

import { useEffect, useRef } from 'react';
import SequenceStage from './SequenceStage';
import NovaGateVisual from './NovaGateVisual';
import { InteractionMode } from '../../sequences';

export default function NovaGateSequence({
  variant,
  clock,
  haptics,
  onStarted,
  onExit,
  onChangeSequence,
}) {
  const startedRef = useRef(false);

  const decelRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    clock.start();
    onStarted?.();
  }, [clock, onStarted]);

  useEffect(() => {
    if (clock.elapsedSeconds >= 42 && !decelRef.current) {
      decelRef.current = true;
      haptics.decelerationTail?.();
    }
  }, [clock.elapsedSeconds, haptics]);

  const phaseLabel =
    clock.elapsedSeconds < 15
      ? 'Gate opening'
      : clock.elapsedSeconds < 42
        ? 'Warp transit'
        : 'Still point';

  const hint = clock.isComplete ? undefined : 'Ride the tunnel';

  return (
    <SequenceStage
      variant={variant}
      elapsedSeconds={clock.elapsedSeconds}
      progress={clock.progress}
      phaseLabel={phaseLabel}
      hint={hint}
      interactionMode={InteractionMode.AUTO}
      onExit={onExit}
      onChangeSequence={onChangeSequence}
    >
      <NovaGateVisual
        elapsedSeconds={clock.elapsedSeconds}
        progress={clock.progress}
        palette={variant.palette}
      />
    </SequenceStage>
  );
}

NovaGateSequence.interactionMode = InteractionMode.AUTO;

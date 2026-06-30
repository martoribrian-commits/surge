import { useCallback, useEffect, useRef } from 'react';
import SequenceStage from './SequenceStage';
import StillThawVisual from './StillThawVisual';
import { InteractionMode } from '../../sequences';

export default function StillThawSequence({
  variant,
  clock,
  haptics,
  onStarted,
  onExit,
  onChangeSequence,
}) {
  const startedRef = useRef(false);
  const transitionRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    clock.start();
    onStarted?.();
  }, [clock, onStarted]);

  const handleTransition = useCallback(() => {
    if (transitionRef.current) return;
    transitionRef.current = true;
    haptics.decelerationTail?.();
  }, [haptics]);

  useEffect(() => {
    const transitionAt = variant.transitionAtSeconds ?? 20;
    if (clock.elapsedSeconds >= transitionAt && !transitionRef.current) {
      handleTransition();
    }
  }, [clock.elapsedSeconds, variant.transitionAtSeconds, handleTransition]);

  const transitionAt = variant.transitionAtSeconds ?? 20;
  const phaseLabel =
    clock.elapsedSeconds < transitionAt
      ? 'Shutdown field'
      : clock.elapsedSeconds < 45
        ? 'Warmth returning'
        : 'Sensation online';

  const hint = clock.isComplete ? undefined : 'Let thaw happen';

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
      <StillThawVisual
        elapsedSeconds={clock.elapsedSeconds}
        progress={clock.progress}
        palette={variant.palette}
        transitionAtSeconds={transitionAt}
      />
    </SequenceStage>
  );
}

StillThawSequence.interactionMode = InteractionMode.AUTO;

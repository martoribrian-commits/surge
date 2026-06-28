import { useCallback, useEffect, useRef } from 'react';
import SurgeSequence from './SurgeSequence';
import InstantResetVisual from './InstantResetVisual';
import { InteractionMode } from '../../sequences';

export default function InstantResetSequence({
  variant,
  clock,
  haptics,
  onStarted,
  onExit,
  onChangeSequence,
}) {
  const startedRef = useRef(false);
  const transitionFiredRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    clock.start();
    onStarted?.();
  }, [clock, onStarted]);

  const handleTransition = useCallback(() => {
    if (transitionFiredRef.current) return;
    transitionFiredRef.current = true;
    haptics.decelerationTail();
  }, [haptics]);

  const transitionAt = variant.transitionAtSeconds ?? 10;
  const phaseLabel =
    clock.elapsedSeconds < transitionAt ? 'Acute tension' : 'Parasympathetic release';

  const hint =
    clock.isComplete
      ? undefined
      : clock.elapsedSeconds < transitionAt
        ? clock.elapsedSeconds < 3
          ? 'Double inhale'
          : 'Long exhale'
        : 'Rest';

  return (
    <SurgeSequence
      variant={variant}
      elapsedSeconds={clock.elapsedSeconds}
      progress={clock.progress}
      phaseLabel={phaseLabel}
      hint={hint}
      interactionMode={InteractionMode.AUTO}
      onExit={onExit}
      onChangeSequence={onChangeSequence}
    >
      <InstantResetVisual
        elapsedSeconds={clock.elapsedSeconds}
        transitionAtSeconds={transitionAt}
        palette={variant.palette}
        onTransition={handleTransition}
      />
    </SurgeSequence>
  );
}

InstantResetSequence.interactionMode = InteractionMode.AUTO;

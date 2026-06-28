import { useCallback, useRef } from 'react';
import SurgeSequence from './SurgeSequence';
import CoherenceRippleVisual from './CoherenceRippleVisual';
import { InteractionMode } from '../../sequences';

export default function CoherenceRippleSequence({
  variant,
  clock,
  haptics,
  isEngaged,
  onEngage,
  onRelease,
  onStarted,
  onChangeSequence,
}) {
  const pointerDownRef = useRef(false);

  const handlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      pointerDownRef.current = true;
      haptics.holdEngage(variant.id);
      onEngage?.();
      onStarted?.();
    },
    [haptics, onEngage, onStarted],
  );

  const handlePointerUp = useCallback(() => {
    if (!pointerDownRef.current) return;
    pointerDownRef.current = false;
    haptics.holdRelease();
    onRelease?.();
  }, [haptics, onRelease]);

  const breathCycle = variant.breathCycle ?? { inhale: 4, exhale: 6 };
  const cycleT = clock.elapsedSeconds % (breathCycle.inhale + breathCycle.exhale);
  const breathPhase =
    cycleT < breathCycle.inhale ? 'In' : cycleT < breathCycle.inhale + 0.5 ? 'Hold' : 'Out';

  const phaseLabel = clock.isPaused
    ? 'Paused'
    : clock.progress > 0.65
      ? 'Vagal restitution'
      : 'Coherence building';

  const hint = clock.isComplete
    ? undefined
    : clock.isPaused
      ? 'Hold to resume'
      : isEngaged
        ? breathPhase
        : 'Press and hold';

  return (
    <SurgeSequence
      variant={variant}
      elapsedSeconds={clock.elapsedSeconds}
      progress={clock.progress}
      phaseLabel={phaseLabel}
      hint={hint}
      isPaused={clock.isPaused}
      interactionMode={InteractionMode.HOLD}
      onChangeSequence={onChangeSequence}
      containerProps={{
        onPointerDown: handlePointerDown,
        onPointerUp: handlePointerUp,
        onPointerLeave: handlePointerUp,
        onPointerCancel: handlePointerUp,
        style: { touchAction: 'none' },
      }}
    >
      <CoherenceRippleVisual
        elapsedSeconds={clock.elapsedSeconds}
        palette={variant.palette}
        breathCycle={breathCycle}
        isEngaged={isEngaged}
        isPaused={clock.isPaused}
        holdCharge={isEngaged ? 1 : clock.progress}
      />
    </SurgeSequence>
  );
}

CoherenceRippleSequence.interactionMode = InteractionMode.HOLD;

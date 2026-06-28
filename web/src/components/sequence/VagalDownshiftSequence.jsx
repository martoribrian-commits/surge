import { useCallback, useRef } from 'react';
import SurgeSequence from './SurgeSequence';
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
  const pointerDownRef = useRef(false);
  const state = curveAtElapsed(clock.elapsedSeconds);
  const phase = phaseAt(state);

  const handlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      pointerDownRef.current = true;
      haptics.holdEngage(variant.id);
      onEngage?.();
      onStarted?.();
    },
    [haptics, variant.id, onEngage, onStarted],
  );

  const handlePointerUp = useCallback(() => {
    if (!pointerDownRef.current) return;
    pointerDownRef.current = false;
    haptics.holdRelease();
    onRelease?.();
  }, [haptics, onRelease]);

  const phaseLabel = clock.isPaused ? 'Paused' : phase.label;

  const hint = clock.isComplete
    ? undefined
    : clock.isPaused
      ? 'Hold to resume'
      : isEngaged
        ? phase.hint
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
      onExit={onExit}
      onChangeSequence={onChangeSequence}
      containerProps={{
        onPointerDown: handlePointerDown,
        onPointerUp: handlePointerUp,
        onPointerLeave: handlePointerUp,
        onPointerCancel: handlePointerUp,
        style: { touchAction: 'none' },
      }}
    >
      <VagalDownshiftVisual
        elapsedSeconds={clock.elapsedSeconds}
        progress={clock.progress}
        palette={variant.palette}
        isEngaged={isEngaged}
        isPaused={clock.isPaused}
      />
    </SurgeSequence>
  );
}

VagalDownshiftSequence.interactionMode = InteractionMode.HOLD;

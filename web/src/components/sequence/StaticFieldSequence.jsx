import { useCallback, useRef } from 'react';
import SurgeSequence from './SurgeSequence';
import StaticFieldVisual from './StaticFieldVisual';
import { InteractionMode } from '../../sequences';
import { curveAtElapsed, phaseAt } from '../../lib/surgeCurve';
import { useStaticFieldHaptics } from '../../hooks/useStaticFieldHaptics';

/**
 * Original 90s Surge — procedural pink noise, static haptics, decay curve hold.
 */
export default function StaticFieldSequence({
  variant,
  clock,
  onEngage,
  onRelease,
  onStarted,
  onChangeSequence,
  isEngaged,
}) {
  const pointerDownRef = useRef(false);
  const state = curveAtElapsed(clock.elapsedSeconds);
  const phase = phaseAt(state);

  useStaticFieldHaptics({
    elapsedMs: clock.elapsedMs,
    isEngaged,
    isComplete: clock.isComplete,
    enabled: true,
  });

  const handlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      pointerDownRef.current = true;
      onEngage?.();
      onStarted?.();
    },
    [onEngage, onStarted],
  );

  const handlePointerUp = useCallback(() => {
    if (!pointerDownRef.current) return;
    pointerDownRef.current = false;
    onRelease?.();
  }, [onRelease]);

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
      onChangeSequence={onChangeSequence}
      containerProps={{
        onPointerDown: handlePointerDown,
        onPointerUp: handlePointerUp,
        onPointerLeave: handlePointerUp,
        onPointerCancel: handlePointerUp,
        style: { touchAction: 'none' },
      }}
    >
      <StaticFieldVisual
        elapsedSeconds={clock.elapsedSeconds}
        palette={variant.palette}
        isEngaged={isEngaged}
        isPaused={clock.isPaused}
      />
    </SurgeSequence>
  );
}

StaticFieldSequence.interactionMode = InteractionMode.HOLD;

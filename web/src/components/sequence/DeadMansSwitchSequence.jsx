import { useCallback, useEffect, useRef, useState } from 'react';
import SequenceStage from './SequenceStage';
import HoldSurface from './HoldSurface';
import DeadMansSwitchVisual, { dispatchDeadMansRipple } from './DeadMansSwitchVisual';
import { InteractionMode } from '../../sequences';
import { curveAtElapsed, phaseAt } from '../../lib/surgeCurve';
import { useStaticFieldHaptics } from '../../hooks/useStaticFieldHaptics';

/**
 * Dead-Man's Switch — 90s hold curve. Release pauses; resume from elapsed time.
 * No streaks, badges, or congratulations — physical relief is the reward.
 */
export default function DeadMansSwitchSequence({
  variant,
  clock,
  isEngaged,
  onEngage,
  onRelease,
  onStarted,
  onExit,
  onChangeSequence,
}) {
  const [completeFade, setCompleteFade] = useState(0);
  const completeFadeRef = useRef(null);

  const state = curveAtElapsed(clock.elapsedSeconds);
  const phase = phaseAt(state);

  useStaticFieldHaptics({
    elapsedMs: clock.elapsedMs,
    isEngaged,
    isComplete: clock.isComplete,
    enabled: true,
  });

  useEffect(() => {
    if (!clock.isComplete) {
      setCompleteFade(0);
      return undefined;
    }

    const start = performance.now();
    const tick = () => {
      const k = Math.min(1, (performance.now() - start) / 3200);
      setCompleteFade(k);
      if (k < 1) completeFadeRef.current = requestAnimationFrame(tick);
    };
    completeFadeRef.current = requestAnimationFrame(tick);

    return () => {
      if (completeFadeRef.current) cancelAnimationFrame(completeFadeRef.current);
    };
  }, [clock.isComplete]);

  const phaseLabel = clock.isPaused ? 'Paused' : clock.isComplete ? 'Complete' : phase.label;

  const hint = clock.isComplete
    ? 'Release when ready'
    : clock.isPaused
      ? 'Hold to resume'
      : isEngaged
        ? phase.hint
        : 'Press and hold';

  const handleEngage = useCallback(
    (coords) => {
      if (coords) dispatchDeadMansRipple(coords.x, coords.y);
      onEngage?.();
      onStarted?.();
    },
    [onEngage, onStarted],
  );

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
      interactionLayer={<HoldSurface onEngage={handleEngage} onRelease={handleRelease} ripple />}
    >
      <DeadMansSwitchVisual
        elapsedSeconds={clock.elapsedSeconds}
        isEngaged={isEngaged}
        isPaused={clock.isPaused}
        isComplete={clock.isComplete}
        completeFade={completeFade}
        onRipple
      />
    </SequenceStage>
  );
}

DeadMansSwitchSequence.interactionMode = InteractionMode.HOLD;

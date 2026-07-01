import { useCallback, useEffect, useRef } from 'react';
import SequenceStage from './SequenceStage';
import HoldSurface from './HoldSurface';
import BilateralSurface from './BilateralSurface';
import CustomSequenceVisual from './CustomSequenceVisual';
import { InteractionMode } from '../../sequences';
import { phaseAtElapsed } from '../../sequences/customSequence';

export default function CustomSequence({
  variant,
  clock,
  haptics,
  audio,
  isEngaged,
  onEngage,
  onRelease,
  onStarted,
  onExit,
  onChangeSequence,
}) {
  const startedRef = useRef(false);
  const mode = variant.interactionMode;
  const breathCycle = variant.breathCycle;
  const phase = phaseAtElapsed(variant, clock.elapsedSeconds);

  useEffect(() => {
    if (mode !== InteractionMode.AUTO) return;
    if (startedRef.current) return;
    startedRef.current = true;
    clock.start();
    onStarted?.();
  }, [clock, mode, onStarted]);

  const handleBilateralTap = useCallback(
    (side) => {
      if (clock.registerBilateralTap(side)) {
        haptics.bilateralTap?.(side);
        audio?.playBilateralTick?.(side === 'left' ? -0.7 : 0.7);
      }
    },
    [clock, haptics, audio],
  );

  const handleEngage = useCallback(() => {
    haptics.holdEngage?.('custom-sequence');
    onEngage?.();
    onStarted?.();
  }, [haptics, onEngage, onStarted]);

  const handleRelease = useCallback(() => {
    haptics.holdRelease?.();
    onRelease?.();
  }, [haptics, onRelease]);

  let hint = phase.hint;
  if (clock.isComplete) hint = undefined;
  else if (mode === InteractionMode.HOLD && clock.isPaused) hint = 'Press and hold to resume';
  else if (mode === InteractionMode.BILATERAL) hint = 'Tap left, then right';

  let interactionLayer = null;
  if (mode === InteractionMode.HOLD) {
    interactionLayer = <HoldSurface onEngage={handleEngage} onRelease={handleRelease} />;
  } else if (mode === InteractionMode.BILATERAL) {
    interactionLayer = <BilateralSurface onTap={handleBilateralTap} />;
  }

  return (
    <SequenceStage
      variant={variant}
      elapsedSeconds={clock.elapsedSeconds}
      progress={clock.progress}
      phaseLabel={phase.label}
      hint={hint}
      isPaused={clock.isPaused}
      interactionMode={mode}
      onExit={onExit}
      onChangeSequence={onChangeSequence}
      interactionLayer={interactionLayer}
    >
      <CustomSequenceVisual
        visualType={variant.visualType ?? 'pulse'}
        palette={variant.palette}
        elapsedSeconds={clock.elapsedSeconds}
        progress={clock.progress}
        isEngaged={mode === InteractionMode.HOLD ? isEngaged : true}
        breathCycle={breathCycle}
      />
    </SequenceStage>
  );
}

CustomSequence.interactionMode = null;

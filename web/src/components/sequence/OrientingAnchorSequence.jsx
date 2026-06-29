import { useCallback, useState } from 'react';
import SequenceStage from './SequenceStage';
import BilateralSurface from './BilateralSurface';
import OrientingAnchorVisual from './OrientingAnchorVisual';
import { unlockAudioContext } from '../../lib/proceduralAudio/shared';
import { InteractionMode } from '../../sequences';

export default function OrientingAnchorSequence({
  variant,
  clock,
  haptics,
  audio,
  onStarted,
  onExit,
  onChangeSequence,
}) {
  const [activeSide, setActiveSide] = useState(null);
  const [tapFlash, setTapFlash] = useState(null);

  const handleSideTap = useCallback(
    (side) => {
      unlockAudioContext();
      const accepted = clock.registerBilateralTap(side);
      if (!accepted) return;
      onStarted?.();
      haptics.bilateralTap(side);
      audio?.playBilateralTick?.(side === 'right' ? 0.85 : -0.85);
      setActiveSide(side);
      setTapFlash(side);
      window.setTimeout(() => setTapFlash(null), 650);
    },
    [clock, haptics, audio, onStarted],
  );

  const phaseLabel = clock.progress < 0.5 ? 'Sensory orienting' : 'Hemisphere integration';

  const hint = clock.isComplete
    ? undefined
    : clock.elapsedSeconds < 0.5
      ? 'Tap left'
      : activeSide === 'left'
        ? 'Now right'
        : activeSide === 'right'
          ? 'Now left'
          : 'Alternate';

  return (
    <SequenceStage
      variant={variant}
      elapsedSeconds={clock.elapsedSeconds}
      progress={clock.progress}
      phaseLabel={phaseLabel}
      hint={hint}
      interactionMode={InteractionMode.BILATERAL}
      onExit={onExit}
      onChangeSequence={onChangeSequence}
      interactionLayer={
        <BilateralSurface
          onLeftTap={() => handleSideTap('left')}
          onRightTap={() => handleSideTap('right')}
        />
      }
    >
      <OrientingAnchorVisual
        elapsedSeconds={clock.elapsedSeconds}
        palette={variant.palette}
        activeSide={activeSide}
        tapFlash={tapFlash}
        bpm={variant.bilateralBpm ?? 60}
      />
    </SequenceStage>
  );
}

OrientingAnchorSequence.interactionMode = InteractionMode.BILATERAL;

import { useCallback, useState } from 'react';
import SurgeSequence from './SurgeSequence';
import OrientingAnchorVisual from './OrientingAnchorVisual';
import { InteractionMode } from '../../sequences';

export default function OrientingAnchorSequence({
  variant,
  clock,
  haptics,
  audio,
  onStarted,
  onChangeSequence,
}) {
  const [activeSide, setActiveSide] = useState(null);
  const [tapFlash, setTapFlash] = useState(null);

  const handleSideTap = useCallback(
    (side) => {
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
    <SurgeSequence
      variant={variant}
      elapsedSeconds={clock.elapsedSeconds}
      progress={clock.progress}
      phaseLabel={phaseLabel}
      hint={hint}
      interactionMode={InteractionMode.BILATERAL}
      onChangeSequence={onChangeSequence}
    >
      <OrientingAnchorVisual
        elapsedSeconds={clock.elapsedSeconds}
        palette={variant.palette}
        activeSide={activeSide}
        tapFlash={tapFlash}
        bpm={variant.bilateralBpm ?? 60}
      />

      {/* Touch zones with subtle edge affordance */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[8] w-1/2 border-r border-white/[0.04]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-[8] w-1/2 border-l border-white/[0.04]" />

      <button
        type="button"
        aria-label="Left anchor"
        className="absolute inset-y-0 left-0 z-10 w-1/2 cursor-default border-0 bg-transparent outline-none"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        onPointerDown={(e) => {
          e.preventDefault();
          handleSideTap('left');
        }}
      />
      <button
        type="button"
        aria-label="Right anchor"
        className="absolute inset-y-0 right-0 z-10 w-1/2 cursor-default border-0 bg-transparent outline-none"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        onPointerDown={(e) => {
          e.preventDefault();
          handleSideTap('right');
        }}
      />
    </SurgeSequence>
  );
}

OrientingAnchorSequence.interactionMode = InteractionMode.BILATERAL;

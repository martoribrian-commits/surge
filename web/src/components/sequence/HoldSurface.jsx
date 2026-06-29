import { useCallback, useRef } from 'react';
import { unlockAudioContext } from '../../lib/proceduralAudio/shared';
import { CHROME_HEIGHT } from '../../brand/tokens';

/**
 * Full-screen hold target below chrome — does not intercept chrome taps.
 */
export default function HoldSurface({ onEngage, onRelease, ripple = false }) {
  const pointerDownRef = useRef(false);

  const handlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      if (pointerDownRef.current) return;
      pointerDownRef.current = true;
      unlockAudioContext();
      if (ripple) {
        onEngage?.({ x: e.clientX, y: e.clientY });
      } else {
        onEngage?.();
      }
    },
    [onEngage, ripple],
  );

  const handlePointerUp = useCallback(() => {
    if (!pointerDownRef.current) return;
    pointerDownRef.current = false;
    onRelease?.();
  }, [onRelease]);

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-10"
      style={{ top: CHROME_HEIGHT, touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-hidden
    />
  );
}

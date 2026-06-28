import { useCallback } from 'react';

/**
 * Haptic cue placeholders — wire to native APIs or Capacitor later.
 * Zero gamification: cues mark phase shifts only, never scores.
 */
export function useSequenceHaptics() {
  const vibrate = useCallback((pattern) => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      /* iOS Safari */
    }
  }, []);

  /** 30s Instant Reset: sharp double pulse at sigh initiation. */
  const physiologicalSighPulse = useCallback(() => {
    vibrate([40, 60, 40, 120]);
  }, [vibrate]);

  /** Long smooth deceleration tail after acute phase. */
  const decelerationTail = useCallback(() => {
    vibrate([80, 100, 60, 140, 40, 180]);
  }, [vibrate]);

  /** 60s bilateral: single soft acknowledgment per valid side tap. */
  const bilateralTap = useCallback(() => {
    vibrate(28);
  }, [vibrate]);

  /** 90s hold: subtle engagement lock. */
  const holdEngage = useCallback(() => {
    vibrate(18);
  }, [vibrate]);

  const holdRelease = useCallback(() => {
    vibrate(12);
  }, [vibrate]);

  const sequenceComplete = useCallback(() => {
    vibrate([100, 80, 100]);
  }, [vibrate]);

  return {
    physiologicalSighPulse,
    decelerationTail,
    bilateralTap,
    holdEngage,
    holdRelease,
    sequenceComplete,
  };
}

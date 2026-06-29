import { useCallback, useEffect, useRef } from 'react';
import { createSequenceAudioEngine } from '../lib/proceduralAudio/engines';
import { unlockAudioContext } from '../lib/proceduralAudio/shared';
import { InteractionMode } from '../sequences';

/**
 * Procedural Web Audio for all Release 1.33 sequences.
 * Native bridge stems remain available via haptics profile on iOS/Android;
 * web runs full nervous-system sonic beds from proceduralAudio engines.
 */
export function useSequenceAudio({
  variantId,
  interactionMode,
  clock,
  isEngaged,
  breathCycle,
  enabled = true,
}) {
  const engineRef = useRef(null);
  const rafRef = useRef(null);
  const clockRef = useRef(clock);
  const completedRef = useRef(false);
  const wasEngagedRef = useRef(false);
  const startedRef = useRef(false);

  clockRef.current = clock;

  useEffect(() => {
    engineRef.current?.stop?.();
    engineRef.current = createSequenceAudioEngine(variantId);
    startedRef.current = false;
    wasEngagedRef.current = false;
    completedRef.current = false;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      engineRef.current?.stop?.();
      engineRef.current = null;
    };
  }, [variantId]);

  const unlockAudio = useCallback(() => {
    unlockAudioContext();
    engineRef.current?.prime?.();
  }, []);

  const prime = useCallback(() => {
    unlockAudio();
  }, [unlockAudio]);

  const killAll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    engineRef.current?.stop?.();
    startedRef.current = false;
    wasEngagedRef.current = false;
    completedRef.current = false;
  }, []);

  /** 60s — panned tick on valid bilateral tap. */
  const playBilateralTick = useCallback((pan = 0) => {
    unlockAudio();
    engineRef.current?.triggerTick?.(pan);
  }, [unlockAudio]);

  /** @deprecated driven by sync loop */
  const playPhysiologicalSigh = useCallback(() => {
    prime();
  }, [prime]);

  /** @deprecated driven by sync loop */
  const playBreathTone = useCallback(() => {}, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const isHold = interactionMode === InteractionMode.HOLD;

    const loop = () => {
      const engine = engineRef.current;
      const c = clockRef.current;
      if (!engine) return;

      if (c.isComplete) {
        if (!completedRef.current) {
          completedRef.current = true;
          engine.complete?.();
        }
        return;
      }

      if (isHold) {
        if (!isEngaged) {
          if (!startedRef.current) {
            engine.start?.();
            startedRef.current = true;
            engine.pause?.();
          } else if (wasEngagedRef.current) {
            engine.pause?.();
          }
          wasEngagedRef.current = false;
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        if (!startedRef.current) {
          engine.start?.();
          startedRef.current = true;
        } else if (!wasEngagedRef.current) {
          engine.resume?.();
        }
        wasEngagedRef.current = true;
      } else if (!startedRef.current) {
        engine.start?.();
        startedRef.current = true;
      }

      if (variantId === 'instant-reset') {
        engine.sync?.(c.elapsedSeconds, c.progress);
      } else if (variantId === 'orienting-anchor') {
        engine.sync?.(c.elapsedSeconds, c.progress);
      } else if (variantId === 'coherence-ripple') {
        engine.sync?.(c.elapsedSeconds, breathCycle ?? { inhale: 4, exhale: 6 });
      } else if (variantId === 'vagal-downshift' || variantId === 'static-field') {
        engine.sync?.(c.elapsedMs);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [enabled, variantId, interactionMode, isEngaged, breathCycle]);

  useEffect(() => {
    if (!clock.isComplete) completedRef.current = false;
  }, [clock.isComplete]);

  return {
    prime,
    unlockAudio,
    killAll,
    playBilateralTick,
    playPhysiologicalSigh,
    playBreathTone,
  };
}

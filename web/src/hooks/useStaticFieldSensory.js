import { useEffect, useRef } from 'react';
import { SonicFieldEngine } from '../lib/sonicFieldEngine';
import { StaticFieldHaptics } from '../lib/staticFieldHaptics';
import { curveAtElapsed, VAGAL_DURATION_MS } from '../lib/surgeCurve';

/**
 * Original Surge sensory stack — procedural static/noise audio + chaotic haptics.
 */
export function useStaticFieldSensory({
  elapsedMs,
  isEngaged,
  isComplete,
  enabled = true,
}) {
  const audioRef = useRef(null);
  const hapticsRef = useRef(null);
  const wasEngagedRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    audioRef.current = new SonicFieldEngine();
    hapticsRef.current = new StaticFieldHaptics();
    audioRef.current.prime();

    return () => {
      hapticsRef.current?.stop();
      audioRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const audio = audioRef.current;
    const haptics = hapticsRef.current;
    if (!audio || !haptics) return;

    const getState = () => curveAtElapsed(elapsedMs / 1000);

    if (isComplete && !completedRef.current) {
      completedRef.current = true;
      audio.complete();
      haptics.complete();
      return;
    }

    if (!isEngaged) {
      if (wasEngagedRef.current && audio.master) {
        audio.pause();
        haptics.pause();
      }
      wasEngagedRef.current = false;
      return;
    }

    const state = getState();

    if (!audio.master) {
      audio.start(VAGAL_DURATION_MS);
      audio.ignite();
      haptics.ack();
      haptics.start(getState);
    } else if (!wasEngagedRef.current) {
      audio.resume();
      audio.ignite();
      haptics.resume();
    }

    wasEngagedRef.current = true;
    audio.sync(state, elapsedMs);
  }, [elapsedMs, isEngaged, isComplete, enabled]);

  useEffect(() => {
    if (!isComplete) completedRef.current = false;
  }, [isComplete]);
}

import { useCallback, useRef } from 'react';
import { killAllSensoryOutput, playAudioCue, stopAudioCue } from '../lib/nativeBridge';

/**
 * Audio cue orchestration for Release 1.33 sequences.
 * Native bridge plays stems via AVAudioEngine / ExoPlayer; web is silent until wired.
 */
export function useSequenceAudio() {
  const primedRef = useRef(false);

  const prime = useCallback(() => {
    if (primedRef.current) return;
    primedRef.current = true;
    playAudioCue({ cueId: 'prime-audio-session', volume: 0, loop: false });
  }, []);

  /** 30s — sharp inhale stinger then long exhale bed fade. */
  const playPhysiologicalSigh = useCallback(() => {
    prime();
    playAudioCue({ cueId: 'instant-reset-inhale-stinger', volume: 0.9, loop: false });
    playAudioCue({ cueId: 'instant-reset-exhale-bed', volume: 0.75, loop: true });
  }, [prime]);

  /** 60s — soft stereo tick aligned to bilateral BPM. */
  const playBilateralTick = useCallback((pan = 0) => {
    prime();
    playAudioCue({ cueId: 'orienting-bilateral-tick', pan, volume: 0.55, loop: false });
  }, [prime]);

  /** 90s — sub-bass breath swell linked to 4/6 respiration. */
  const playBreathTone = useCallback(
    (phase) => {
      prime();
      const volume = phase === 'In' ? 0.8 : phase === 'Out' ? 0.45 : 0.55;
      playAudioCue({ cueId: 'coherence-breath-bed', volume, loop: true });
    },
    [prime],
  );

  const killAll = useCallback(() => {
    stopAudioCue({});
    killAllSensoryOutput();
  }, []);

  return {
    playPhysiologicalSigh,
    playBilateralTick,
    playBreathTone,
    prime,
    killAll,
  };
}

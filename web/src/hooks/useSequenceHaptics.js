import { useCallback, useEffect, useRef } from 'react';
import {
  killAllSensoryOutput,
  playAudioCue,
  setHapticPan,
  startContinuousHaptic,
  stopAllHaptics,
  stopAudioCue,
  triggerLightThud,
  triggerTransientHaptic,
  updateContinuousIntensity,
} from '../lib/nativeBridge';
import { getHapticProfile } from '../lib/hapticProfiles';

/**
 * Schedules tracked timers/intervals/RAF handles for deterministic cleanup.
 */
function createScheduler() {
  const timeouts = new Set();
  const intervals = new Set();
  let rafId = null;

  return {
    setTimeout(fn, ms) {
      const id = window.setTimeout(() => {
        timeouts.delete(id);
        fn();
      }, ms);
      timeouts.add(id);
      return id;
    },
    setInterval(fn, ms) {
      const id = window.setInterval(fn, ms);
      intervals.add(id);
      return id;
    },
    requestAnimationFrame(fn) {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(fn);
      return rafId;
    },
    clearAll() {
      for (const id of timeouts) window.clearTimeout(id);
      for (const id of intervals) window.clearInterval(id);
      if (rafId != null) cancelAnimationFrame(rafId);
      timeouts.clear();
      intervals.clear();
      rafId = null;
    },
  };
}

/**
 * Native-calibrated haptic + audio orchestration for Release 1.33 sequences.
 * Zero gamification — cues mark phase shifts and somatic anchors only.
 */
export function useSequenceHaptics() {
  const schedulerRef = useRef(createScheduler());
  const activeProfileRef = useRef(null);
  const breathRunningRef = useRef(false);
  const rhythmSideRef = useRef('left');

  const killAll = useCallback(() => {
    schedulerRef.current.clearAll();
    breathRunningRef.current = false;
    activeProfileRef.current = null;
    killAllSensoryOutput();
  }, []);

  useEffect(() => () => killAll(), [killAll]);

  const runTransientPhase = useCallback((phase) => {
    triggerTransientHaptic({
      intensity: phase.intensity ?? 1,
      sharpness: phase.sharpness ?? 1,
      pattern: phase.pattern,
    });
  }, []);

  const runContinuousPhase = useCallback((phase) => {
    startContinuousHaptic({
      id: phase.id ?? 'continuous',
      intensity: phase.intensity ?? 0.8,
      durationMs: phase.durationMs ?? 20_000,
      decay: phase.decay ?? 'linear',
    });
  }, []);

  const runRhythmPhase = useCallback(
    (phase) => {
      const intervalMs = Math.round(60_000 / (phase.bpm ?? 60));
      const endAt = phase.durationMs ? Date.now() + phase.durationMs : null;
      let beat = 0;

      const tick = () => {
        if (endAt != null && Date.now() >= endAt) return;

        if (phase.panMode === 'alternating-pan') {
          const pan = beat % 2 === 0 ? -0.85 : 0.85;
          rhythmSideRef.current = beat % 2 === 0 ? 'left' : 'right';
          setHapticPan({ pan, intensity: phase.intensity ?? 0.35 });
          triggerLightThud({ pan });
        } else {
          triggerLightThud({ pan: 0 });
        }
        beat += 1;
      };

      tick();
      schedulerRef.current.setInterval(tick, intervalMs);
    },
    [],
  );

  const runBreathPhase = useCallback(
    (phase) => {
      breathRunningRef.current = true;
      const swellMs = phase.swellMs ?? 4_000;
      const ebbMs = phase.ebbMs ?? 6_000;
      const cycleMs = swellMs + ebbMs;
      const minI = phase.minIntensity ?? 0.12;
      const maxI = phase.maxIntensity ?? 0.72;
      const id = phase.id ?? 'breath';
      const start = performance.now();

      startContinuousHaptic({ id, intensity: minI, durationMs: cycleMs * 20, decay: 'none' });

      const animate = (now) => {
        if (!breathRunningRef.current) return;

        const elapsed = (now - start) % cycleMs;
        let intensity;

        if (elapsed < swellMs) {
          const t = elapsed / swellMs;
          intensity = minI + (maxI - minI) * (0.5 - 0.5 * Math.cos(Math.PI * t));
        } else {
          const t = (elapsed - swellMs) / ebbMs;
          intensity = maxI - (maxI - minI) * (0.5 - 0.5 * Math.cos(Math.PI * t));
        }

        updateContinuousIntensity({ id, intensity });
        schedulerRef.current.requestAnimationFrame(animate);
      };

      schedulerRef.current.requestAnimationFrame(animate);
    },
    [],
  );

  const executePhase = useCallback(
    (phase) => {
      switch (phase.type) {
        case 'transient':
          runTransientPhase(phase);
          break;
        case 'continuous':
          runContinuousPhase(phase);
          break;
        case 'rhythm':
          runRhythmPhase(phase);
          break;
        case 'breath':
          runBreathPhase(phase);
          break;
        default:
          break;
      }
    },
    [runTransientPhase, runContinuousPhase, runRhythmPhase, runBreathPhase],
  );

  /** Start full variant profile — clears prior sensory output first. */
  const startProfile = useCallback(
    (variantId) => {
      killAll();
      const profile = getHapticProfile(variantId);
      if (!profile) return;

      activeProfileRef.current = profile.id;

      if (profile.audioCueId) {
        playAudioCue({ cueId: profile.audioCueId, loop: true, volume: 0.85 });
      }

      for (const phase of profile.phases) {
        const delay = phase.delayMs ?? 0;
        if (delay <= 0) {
          executePhase(phase);
        } else {
          schedulerRef.current.setTimeout(() => executePhase(phase), delay);
        }
      }
    },
    [killAll, executePhase],
  );

  const stopProfile = useCallback(() => {
    killAll();
  }, [killAll]);

  /** 30s Instant Reset: sharp double pulse at sigh initiation. */
  const physiologicalSighPulse = useCallback(() => {
    triggerTransientHaptic({ intensity: 1, sharpness: 1, pattern: [45, 55, 45, 120] });
    schedulerRef.current.setTimeout(
      () => triggerTransientHaptic({ intensity: 1, sharpness: 0.95, pattern: [45, 55, 45] }),
      120,
    );
  }, []);

  /** Long smooth deceleration tail after acute phase. */
  const decelerationTail = useCallback(() => {
    startContinuousHaptic({
      id: 'instant-reset-tail',
      intensity: 0.7,
      durationMs: 8_000,
      decay: 'linear',
    });
  }, []);

  /** 60s bilateral: soft acknowledgment per valid side tap with pan. */
  const bilateralTap = useCallback((side = rhythmSideRef.current) => {
    const pan = side === 'right' ? 0.85 : -0.85;
    setHapticPan({ pan, intensity: 0.35 });
    triggerLightThud({ pan });
    playAudioCue({ cueId: 'orienting-bilateral-tick', pan, volume: 0.5, loop: false });
  }, []);

  /** 90s hold: subtle engagement lock. */
  const holdEngage = useCallback(() => {
    triggerTransientHaptic({ intensity: 0.45, sharpness: 0.5, pattern: [18] });
    startProfile('coherence-ripple');
  }, [startProfile]);

  const holdRelease = useCallback(() => {
    triggerTransientHaptic({ intensity: 0.25, sharpness: 0.3, pattern: [12] });
    stopProfile();
  }, [stopProfile]);

  const sequenceComplete = useCallback(() => {
    stopAllHaptics();
    stopAudioCue({});
    triggerTransientHaptic({ intensity: 0.6, sharpness: 0.4, pattern: [100, 80, 100] });
  }, []);

  return {
    startProfile,
    stopProfile,
    killAll,
    physiologicalSighPulse,
    decelerationTail,
    bilateralTap,
    holdEngage,
    holdRelease,
    sequenceComplete,
  };
}

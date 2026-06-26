import { useState, useEffect, useRef, useCallback } from 'react';
import {
  SPIN_UP_MS,
  SPIN_DOWN_MS,
  easeOutCubic,
  intensityAtElapsed,
  deriveSurgeOutputs,
} from '../lib/surgeCurve';
import { createSessionId, writeSessionCache } from '../lib/sessionPayload';

const CHAOS_FILE = '/chaosNoise.wav';
const HEARTBEAT_FILE = '/heartbeat.wav';

async function fetchDecode(ctx, url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  const arrayBuffer = await response.arrayBuffer();
  return ctx.decodeAudioData(arrayBuffer);
}

function elapsedDurationSeconds(sessionStartMs, nowMs) {
  if (sessionStartMs === null) return 0;
  return Math.max(0, Math.round((nowMs - sessionStartMs) / 1000));
}

/**
 * Cinematic somatic engine — single decay curve drives visuals, audio, and haptics.
 */
export const useSurgeEngine = (duration = 90) => {
  const [intensity, setIntensity] = useState(0);
  const [outputs, setOutputs] = useState(() => deriveSurgeOutputs(0, 0));
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);

  const audioCtxRef = useRef(null);
  const chaosBufferRef = useRef(null);
  const heartbeatBufferRef = useRef(null);

  const chaosSourceRef = useRef(null);
  const heartbeatSourceRef = useRef(null);
  const chaosFilterRef = useRef(null);
  const chaosGainRef = useRef(null);
  const heartbeatGainRef = useRef(null);
  const masterGainRef = useRef(null);

  const rafRef = useRef(null);
  const phaseRef = useRef('idle');
  const spinUpStartRef = useRef(null);
  const decayStartRef = useRef(null);
  const decayElapsedRef = useRef(0);
  const spinDownStartRef = useRef(null);
  const spinDownFromRef = useRef(0);
  const intensityRef = useRef(0);
  const lastVibrateRef = useRef(0);
  const sessionIdRef = useRef(null);
  const sessionStartRef = useRef(null);
  const interruptedAtRef = useRef(null);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  const publishOutputs = useCallback((t, elapsedMs = 0) => {
    const derived = deriveSurgeOutputs(t, elapsedMs);
    setIntensity(derived.t);
    setOutputs(derived);
    return derived;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const [chaos, heartbeat] = await Promise.all([
          fetchDecode(ctx, CHAOS_FILE),
          fetchDecode(ctx, HEARTBEAT_FILE),
        ]);

        if (cancelled) return;
        chaosBufferRef.current = chaos;
        heartbeatBufferRef.current = heartbeat;
        setIsPreloaded(true);
      } catch {
        // Stems unavailable — visuals-only fallback
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const pulseVibration = useCallback((derived) => {
    if (!navigator.vibrate || derived.t <= 0) return;
    const now = performance.now();
    if (now - lastVibrateRef.current < derived.vibrateInterval) return;
    lastVibrateRef.current = now;
    try {
      navigator.vibrate(derived.vibratePattern);
    } catch {
      // iOS Safari
    }
  }, []);

  const applyAudio = useCallback((derived, masterMul = 1) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !chaosGainRef.current) return;

    const now = ctx.currentTime;
    chaosGainRef.current.gain.setTargetAtTime(derived.chaosVol * masterMul, now, 0.04);
    heartbeatGainRef.current.gain.setTargetAtTime(
      derived.heartbeatVol * masterMul,
      now,
      0.06,
    );
    chaosFilterRef.current.frequency.setTargetAtTime(derived.filterFreq, now, 0.08);
    masterGainRef.current.gain.setTargetAtTime(masterMul, now, 0.05);
  }, []);

  const stopSources = useCallback(() => {
    try {
      chaosSourceRef.current?.stop();
      heartbeatSourceRef.current?.stop();
    } catch {
      // Already stopped
    }
    chaosSourceRef.current = null;
    heartbeatSourceRef.current = null;
  }, []);

  const wireAudioGraph = useCallback((ctx) => {
    const chaosGain = ctx.createGain();
    const heartbeatGain = ctx.createGain();
    const chaosFilter = ctx.createBiquadFilter();
    const masterGain = ctx.createGain();
    const delay = ctx.createDelay(2.5);
    const feedback = ctx.createGain();

    chaosFilter.type = 'lowpass';
    chaosFilter.Q.value = 0.85;
    chaosFilter.frequency.value = 9000;

    delay.delayTime.value = 0.38;
    feedback.gain.value = 0.42;

    chaosGain.gain.value = 0;
    heartbeatGain.gain.value = 0;
    masterGain.gain.value = 0;

    chaosGain.connect(chaosFilter);
    chaosFilter.connect(masterGain);
    heartbeatGain.connect(masterGain);

    masterGain.connect(ctx.destination);
    masterGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(ctx.destination);

    chaosGainRef.current = chaosGain;
    heartbeatGainRef.current = heartbeatGain;
    chaosFilterRef.current = chaosFilter;
    masterGainRef.current = masterGain;
  }, []);

  const startSources = useCallback((ctx) => {
    if (!chaosBufferRef.current || !heartbeatBufferRef.current) return;

    const chaos = ctx.createBufferSource();
    chaos.buffer = chaosBufferRef.current;
    chaos.loop = true;
    chaos.connect(chaosGainRef.current);

    const heartbeat = ctx.createBufferSource();
    heartbeat.buffer = heartbeatBufferRef.current;
    heartbeat.loop = true;
    heartbeat.connect(heartbeatGainRef.current);

    chaos.start(0);
    heartbeat.start(0);

    chaosSourceRef.current = chaos;
    heartbeatSourceRef.current = heartbeat;
  }, []);

  const persistSession = useCallback((completionState) => {
    const now = performance.now();
    writeSessionCache({
      sessionId: sessionIdRef.current ?? createSessionId(),
      duration: elapsedDurationSeconds(sessionStartRef.current, now),
      completionState,
      timestamp: Date.now(),
    });
  }, []);

  const pauseForInterruption = useCallback(() => {
    if (phaseRef.current !== 'spin_up' && phaseRef.current !== 'decay') return;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    interruptedAtRef.current = performance.now();

    if (phaseRef.current === 'decay' && decayStartRef.current !== null) {
      decayElapsedRef.current = performance.now() - decayStartRef.current;
    }

    phaseRef.current = 'interrupted_paused';
    setIsActive(false);
    setIsInterrupted(true);

    const ctx = audioCtxRef.current;
    if (ctx?.state === 'running') {
      ctx.suspend().catch(() => {});
    }

    persistSession('interrupted');
  }, [persistSession]);

  const completeSurge = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    phaseRef.current = 'complete';

    persistSession('complete');

    const ctx = audioCtxRef.current;
    if (ctx && masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    }

    setTimeout(stopSources, 400);

    setIsActive(false);
    setIsComplete(true);
    setIsInterrupted(false);
    publishOutputs(0, 0);
  }, [stopSources, persistSession, publishOutputs]);

  const tick = useCallback(
    function updateLoop(now) {
      const phase = phaseRef.current;

      if (phase === 'spin_up' && spinUpStartRef.current !== null) {
        const elapsed = now - spinUpStartRef.current;
        const progress = Math.min(elapsed / SPIN_UP_MS, 1);
        const t = easeOutCubic(progress);
        const derived = publishOutputs(t, 0);
        applyAudio(derived, t);

        if (progress >= 1) {
          phaseRef.current = 'decay';
          decayStartRef.current = now;
          decayElapsedRef.current = 0;
        }
      } else if (phase === 'decay' && decayStartRef.current !== null) {
        const elapsed = now - decayStartRef.current;
        const t = intensityAtElapsed(elapsed, duration);
        const derived = publishOutputs(t, elapsed);
        applyAudio(derived, 1);
        pulseVibration(derived);

        if (elapsed >= duration * 1000) {
          completeSurge();
          return;
        }
      } else if (phase === 'spin_down' && spinDownStartRef.current !== null) {
        const elapsed = now - spinDownStartRef.current;
        const progress = Math.min(elapsed / SPIN_DOWN_MS, 1);
        const fade = 1 - easeOutCubic(progress);
        const t = spinDownFromRef.current * fade;
        const derived = publishOutputs(t, decayElapsedRef.current);
        applyAudio(derived, fade * 0.85);

        if (progress >= 1) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
          phaseRef.current = 'idle';
          stopSources();
          setIsActive(false);
          publishOutputs(0, 0);
          return;
        }
      }

      rafRef.current = requestAnimationFrame(updateLoop);
    },
    [duration, applyAudio, pulseVibration, completeSurge, stopSources, publishOutputs],
  );

  const ensureAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      audioCtxRef.current = new AudioCtx();
    }

    const audioCtx = audioCtxRef.current;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }, []);

  const startSurge = useCallback(() => {
    if (phaseRef.current === 'spin_up' || phaseRef.current === 'decay') return;

    cancelAnimationFrame(rafRef.current);

    const audioCtx = ensureAudioContext();
    if (!audioCtx) return;

    stopSources();
    wireAudioGraph(audioCtx);
    startSources(audioCtx);

    if (!sessionIdRef.current) {
      sessionIdRef.current = createSessionId();
      sessionStartRef.current = performance.now();
    }

    setIsActive(true);
    setIsComplete(false);
    setIsInterrupted(false);
    publishOutputs(0, 0);
    phaseRef.current = 'spin_up';
    spinUpStartRef.current = performance.now();
    decayStartRef.current = null;
    spinDownStartRef.current = null;

    rafRef.current = requestAnimationFrame(tick);
  }, [
    ensureAudioContext,
    stopSources,
    wireAudioGraph,
    startSources,
    tick,
    publishOutputs,
  ]);

  const resumeSurge = useCallback(() => {
    if (phaseRef.current !== 'interrupted_paused') return;

    const audioCtx = ensureAudioContext();
    if (!audioCtx) return;

    if (!chaosSourceRef.current) {
      wireAudioGraph(audioCtx);
      startSources(audioCtx);
    }

    setIsActive(true);
    setIsInterrupted(false);
    interruptedAtRef.current = null;

    if (decayStartRef.current !== null || decayElapsedRef.current > 0) {
      phaseRef.current = 'decay';
      decayStartRef.current = performance.now() - decayElapsedRef.current;
    } else {
      phaseRef.current = 'spin_up';
      spinUpStartRef.current = performance.now();
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [ensureAudioContext, wireAudioGraph, startSources, tick]);

  const stopSurge = useCallback(() => {
    if (
      phaseRef.current === 'idle' ||
      phaseRef.current === 'spin_down' ||
      phaseRef.current === 'complete' ||
      phaseRef.current === 'interrupted_paused'
    ) {
      return;
    }

    cancelAnimationFrame(rafRef.current);
    persistSession('interrupted');
    spinDownFromRef.current = intensityRef.current;
    phaseRef.current = 'spin_down';
    spinDownStartRef.current = performance.now();

    rafRef.current = requestAnimationFrame(tick);
  }, [tick, persistSession]);

  // Interruption recovery — page visibility (lock screen, tab switch)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        pauseForInterruption();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [pauseForInterruption]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      stopSources();
      if (audioCtxRef.current?.state !== 'closed') {
        audioCtxRef.current?.close();
      }
    };
  }, [stopSources]);

  return {
    intensity,
    outputs,
    isActive,
    isComplete,
    isInterrupted,
    isPreloaded,
    sessionId: sessionIdRef.current,
    startSurge,
    stopSurge,
    resumeSurge,
  };
};

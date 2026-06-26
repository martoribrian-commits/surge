import { useState, useEffect, useRef, useCallback } from 'react';

const SPIN_UP_MS = 500;
const SPIN_DOWN_MS = 1800;
const CHAOS_FILE = '/chaosNoise.wav';
const HEARTBEAT_FILE = '/heartbeat.wav';

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function decayIntensity(progress) {
  if (progress <= 0.15) return 1.0;
  return Math.pow((1.0 - progress) / 0.85, 2);
}

async function fetchDecode(ctx, url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  const arrayBuffer = await response.arrayBuffer();
  return ctx.decodeAudioData(arrayBuffer);
}

/**
 * Cinematic somatic engine — pre-loaded WAV stems, spin-up/down weight,
 * crossfade + low-pass sweep linked to intensity.
 */
export const useSurgeEngine = (duration = 90) => {
  const [intensity, setIntensity] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
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
  const spinDownStartRef = useRef(null);
  const spinDownFromRef = useRef(0);
  const intensityRef = useRef(0);
  const lastVibrateRef = useRef(0);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  // Pre-load stems on mount — zero touch latency
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

  const pulseVibration = useCallback((t) => {
    if (!navigator.vibrate || t <= 0) return;
    const now = performance.now();
    try {
      if (t > 0.15) {
        const interval = 80 + (1 - t) * 120;
        if (now - lastVibrateRef.current < interval) return;
        lastVibrateRef.current = now;
        navigator.vibrate(Math.round(t * 180 + 30));
      } else {
        if (now - lastVibrateRef.current < 1000) return;
        lastVibrateRef.current = now;
        navigator.vibrate([120, 80]);
      }
    } catch {
      // iOS Safari
    }
  }, []);

  const applyAudio = useCallback((t, masterMul = 1) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !chaosGainRef.current) return;

    const now = ctx.currentTime;

    const chaosVol = Math.max(0, Math.min(1, (t - 0.15) / 0.85)) * 0.85;
    chaosGainRef.current.gain.setTargetAtTime(chaosVol * masterMul, now, 0.04);

    const heartbeatVol = Math.max(0, Math.min(0.9, (0.75 - t) / 0.75));
    heartbeatGainRef.current.gain.setTargetAtTime(heartbeatVol * masterMul, now, 0.06);

    const filterFreq = 120 + t * 9000;
    chaosFilterRef.current.frequency.setTargetAtTime(filterFreq, now, 0.08);

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

  const completeSurge = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    phaseRef.current = 'complete';

    const ctx = audioCtxRef.current;
    if (ctx && masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    }

    setTimeout(stopSources, 400);

    setIsActive(false);
    setIsComplete(true);
    setIntensity(0);
  }, [stopSources]);

  const tick = useCallback(
    function updateLoop(now) {
      const phase = phaseRef.current;

      if (phase === 'spin_up' && spinUpStartRef.current !== null) {
        const elapsed = now - spinUpStartRef.current;
        const progress = Math.min(elapsed / SPIN_UP_MS, 1);
        const t = easeOutCubic(progress);

        setIntensity(t);
        applyAudio(t, t);

        if (progress >= 1) {
          phaseRef.current = 'decay';
          decayStartRef.current = now;
        }
      } else if (phase === 'decay' && decayStartRef.current !== null) {
        const elapsed = now - decayStartRef.current;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        const t = decayIntensity(progress);

        setIntensity(t);
        applyAudio(t, 1);
        pulseVibration(t);

        if (progress >= 1) {
          completeSurge();
          return;
        }
      } else if (phase === 'spin_down' && spinDownStartRef.current !== null) {
        const elapsed = now - spinDownStartRef.current;
        const progress = Math.min(elapsed / SPIN_DOWN_MS, 1);
        const fade = 1 - easeOutCubic(progress);
        const t = spinDownFromRef.current * fade;

        setIntensity(t);
        applyAudio(t, fade * 0.85);

        if (progress >= 1) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
          phaseRef.current = 'idle';
          stopSources();
          setIsActive(false);
          setIntensity(0);
          return;
        }
      }

      rafRef.current = requestAnimationFrame(updateLoop);
    },
    [duration, applyAudio, pulseVibration, completeSurge, stopSources],
  );

  const startSurge = useCallback(() => {
    if (phaseRef.current === 'spin_up' || phaseRef.current === 'decay') return;

    cancelAnimationFrame(rafRef.current);

    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioCtxRef.current = new AudioCtx();
    }

    const audioCtx = audioCtxRef.current;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    stopSources();
    wireAudioGraph(audioCtx);
    startSources(audioCtx);

    setIsActive(true);
    setIsComplete(false);
    setIntensity(0);
    phaseRef.current = 'spin_up';
    spinUpStartRef.current = performance.now();
    decayStartRef.current = null;
    spinDownStartRef.current = null;

    rafRef.current = requestAnimationFrame(tick);
  }, [stopSources, wireAudioGraph, startSources, tick]);

  const stopSurge = useCallback(() => {
    if (
      phaseRef.current === 'idle' ||
      phaseRef.current === 'spin_down' ||
      phaseRef.current === 'complete'
    ) {
      return;
    }

    cancelAnimationFrame(rafRef.current);
    spinDownFromRef.current = intensityRef.current;
    phaseRef.current = 'spin_down';
    spinDownStartRef.current = performance.now();

    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

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
    isActive,
    isComplete,
    isPreloaded,
    startSurge,
    stopSurge,
  };
};

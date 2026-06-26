import { useState, useEffect, useRef } from 'react';

/**
 * Core somatic state machine with procedurally synthesized Web Audio.
 *
 * Implements a "Bottom-Up" neurobiological intervention:
 * - Pink noise chaos bed (no asset loading)
 * - 55 Hz sub-bass heartbeat oscillator (Iso Principle crossfade)
 * - 90-second intensity curve with 15 s sustained overload plateau
 *
 * AudioContext initialization requires a user gesture — call `startSurge()`
 * from a pointer-down handler.
 */
export const useSurgeEngine = (duration = 90) => {
  const [intensity, setIntensity] = useState(1.0);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [heartbeatPhase, setHeartbeatPhase] = useState(0);

  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastVibrateRef = useRef(0);

  // Audio Nodes
  const noiseNodeRef = useRef(null);
  const noiseFilterRef = useRef(null);
  const noiseGainRef = useRef(null);
  const heartbeatOscRef = useRef(null);
  const heartbeatGainRef = useRef(null);

  // 1. Procedural Pink Noise Generation (Bypasses asset loading)
  const createPinkNoiseNode = (ctx) => {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Pink noise coefficient math
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      output[i] = pink * 0.11; // Normalize volume rough estimate
    }

    const bufferSource = ctx.createBufferSource();
    bufferSource.buffer = noiseBuffer;
    bufferSource.loop = true;
    return bufferSource;
  };

  const pulseVibration = (currentIntensity) => {
    if (!navigator.vibrate) return;

    const now = performance.now();

    try {
      if (currentIntensity > 0.15) {
        const interval = 80 + (1 - currentIntensity) * 120;
        if (now - lastVibrateRef.current < interval) return;
        lastVibrateRef.current = now;
        navigator.vibrate(Math.round(currentIntensity * 180 + 30));
      } else if (currentIntensity > 0) {
        const beatInterval = 1000; // 60 BPM
        if (now - lastVibrateRef.current < beatInterval) return;
        lastVibrateRef.current = now;
        navigator.vibrate([120, 80]);
      }
    } catch {
      // iOS Safari — vibrate unavailable
    }
  };

  const cleanupAudioNodes = () => {
    try {
      if (noiseNodeRef.current) {
        noiseNodeRef.current.stop();
        noiseNodeRef.current.disconnect();
      }
      if (noiseFilterRef.current) {
        noiseFilterRef.current.disconnect();
      }
      if (noiseGainRef.current) {
        noiseGainRef.current.disconnect();
      }
      if (heartbeatOscRef.current) {
        heartbeatOscRef.current.stop();
        heartbeatOscRef.current.disconnect();
      }
      if (heartbeatGainRef.current) {
        heartbeatGainRef.current.disconnect();
      }
    } catch {
      // Handle edge cases where audio nodes weren't initialized or already stopped
    }

    noiseNodeRef.current = null;
    noiseFilterRef.current = null;
    noiseGainRef.current = null;
    heartbeatOscRef.current = null;
    heartbeatGainRef.current = null;
  };

  const completeSurge = () => {
    cancelAnimationFrame(timerRef.current);
    timerRef.current = null;
    setIsActive(false);
    setIsComplete(true);
    setIntensity(0);
    cleanupAudioNodes();
  };

  // 2. Initialize and Start the Somatic Circuit Breaker
  const startSurge = () => {
    if (isActive) return;

    cleanupAudioNodes();
    cancelAnimationFrame(timerRef.current);

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    setIsActive(true);
    setIsComplete(false);
    setIntensity(1.0);
    startTimeRef.current = performance.now();

    // Setup Pink Noise (Chaos)
    noiseNodeRef.current = createPinkNoiseNode(ctx);
    noiseFilterRef.current = ctx.createBiquadFilter();
    noiseFilterRef.current.type = 'lowpass';
    // Crisp, overwhelming high frequencies initially
    noiseFilterRef.current.frequency.setValueAtTime(8000, ctx.currentTime);

    noiseGainRef.current = ctx.createGain();
    noiseGainRef.current.gain.setValueAtTime(0.8, ctx.currentTime);

    // Connect Chaos Chain
    noiseNodeRef.current.connect(noiseFilterRef.current);
    noiseFilterRef.current.connect(noiseGainRef.current);
    noiseGainRef.current.connect(ctx.destination);
    noiseNodeRef.current.start(0);

    // Setup Sub-Bass Heartbeat (Anchor)
    // 55 Hz sine wave oscillator to simulate physical resonance
    heartbeatOscRef.current = ctx.createOscillator();
    heartbeatOscRef.current.type = 'sine';
    heartbeatOscRef.current.frequency.setValueAtTime(55, ctx.currentTime);

    heartbeatGainRef.current = ctx.createGain();
    // Start silent, crossfades in later
    heartbeatGainRef.current.gain.setValueAtTime(0.0, ctx.currentTime);

    // Connect Heartbeat Chain
    heartbeatOscRef.current.connect(heartbeatGainRef.current);
    heartbeatGainRef.current.connect(ctx.destination);
    heartbeatOscRef.current.start(0);

    // Dynamic 90-Second Decay Loop
    const updateLoop = (now) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      const progress = Math.min(elapsed / duration, 1.0);

      // Somatic Intensity Curve — sustains max chaos for 15 s, then drops exponentially
      let currentIntensity = 1.0;
      if (progress > 0.15) {
        currentIntensity = Math.pow((1.0 - progress) / 0.85, 2);
      }

      setIntensity(currentIntensity);

      // Map curve to live audio synthesis parameters
      const audioTime = ctx.currentTime;

      // 1. Chaos Modulation: sweep low-pass filter down and cut volume
      const filterFreq = Math.max(120, currentIntensity * 8000);
      noiseFilterRef.current.frequency.setValueAtTime(filterFreq, audioTime);
      noiseGainRef.current.gain.setValueAtTime(currentIntensity * 0.8, audioTime);

      // 2. Heartbeat Modulation (Iso Principle):
      // As chaos drops, introduce a deep rhythmic sub pulse stabilizing at 60 BPM
      const heartbeatVolume = (1.0 - currentIntensity) * 0.9;

      // Procedural pulsing gain envelope — fast at peak, decays to 1.0 Hz (60 BPM)
      const pulseRate = 1.0 + currentIntensity * 1.5;
      const pulseWave = Math.max(0, Math.sin(audioTime * Math.PI * 2 * pulseRate));
      heartbeatGainRef.current.gain.setValueAtTime(pulseWave * heartbeatVolume, audioTime);

      // Visual sync phase for breathing gradient
      setHeartbeatPhase((audioTime * pulseRate) % 1);

      pulseVibration(currentIntensity);

      if (progress < 1.0) {
        timerRef.current = requestAnimationFrame(updateLoop);
      } else {
        completeSurge();
      }
    };

    timerRef.current = requestAnimationFrame(updateLoop);
  };

  // 3. Clean Stop Logic (The Dead-Man's Switch Release)
  const stopSurge = () => {
    cancelAnimationFrame(timerRef.current);
    timerRef.current = null;
    setIsActive(false);
    setIntensity(0);
    cleanupAudioNodes();
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(timerRef.current);
      cleanupAudioNodes();
      if (audioCtxRef.current?.state !== 'closed') {
        audioCtxRef.current?.close();
      }
      audioCtxRef.current = null;
    };
  }, []);

  return { intensity, isActive, isComplete, heartbeatPhase, startSurge, stopSurge };
};

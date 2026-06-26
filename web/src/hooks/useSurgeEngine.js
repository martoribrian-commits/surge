import { useState, useRef, useCallback, useEffect } from 'react';

/** Cycle phases */
export const SURGE_STATES = {
  IDLE: 'idle',
  OVERLOAD: 'overload',
  DECAYING: 'decaying',
  COOLDOWN: 'cooldown',
};

const DECAY_DURATION_MS = 90_000;
const OVERLOAD_DURATION_MS = 300;
const COOLDOWN_DURATION_MS = 3_000;
const FADE_OUT_DURATION_MS = 500;
const TARGET_BPM = 60;

/**
 * Core somatic state machine and Web Audio API hook.
 *
 * AudioContext initialization requires a user gesture — call `activate()`
 * from a pointer-down handler. All nodes are torn down on unmount.
 */
export function useSurgeEngine() {
  const [state, setState] = useState(SURGE_STATES.IDLE);
  const [intensity, setIntensity] = useState(0);
  const [heartbeatPhase, setHeartbeatPhase] = useState(0);
  const [isAudioReady, setIsAudioReady] = useState(false);

  const audioContextRef = useRef(null);
  const chaosSourceRef = useRef(null);
  const heartbeatSourceRef = useRef(null);
  const chaosGainRef = useRef(null);
  const heartbeatGainRef = useRef(null);
  const chaosFilterRef = useRef(null);
  const masterGainRef = useRef(null);

  const rafRef = useRef(null);
  const decayStartRef = useRef(null);
  const overloadTimeoutRef = useRef(null);
  const cooldownTimeoutRef = useRef(null);
  const fadeRafRef = useRef(null);
  const lastVibrateRef = useRef(0);
  const intensityRef = useRef(0);
  const stateRef = useRef(SURGE_STATES.IDLE);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const loadAudioBuffer = useCallback(async (context, filename) => {
    const response = await fetch(`/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return context.decodeAudioData(arrayBuffer);
  }, []);

  const createLoopSource = useCallback((context, buffer, gainNode) => {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gainNode);
    return source;
  }, []);

  const initAudio = useCallback(async () => {
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      return audioContextRef.current;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    const context = new AudioCtx();

    const [chaosBuffer, heartbeatBuffer] = await Promise.all([
      loadAudioBuffer(context, 'chaosNoise.mp3'),
      loadAudioBuffer(context, 'heartbeat.mp3'),
    ]);

    const chaosGain = context.createGain();
    const heartbeatGain = context.createGain();
    const chaosFilter = context.createBiquadFilter();
    const masterGain = context.createGain();

    chaosFilter.type = 'lowpass';
    chaosFilter.frequency.value = 20_000;
    chaosFilter.Q.value = 0.7;

    chaosGain.gain.value = 0;
    heartbeatGain.gain.value = 0;
    masterGain.gain.value = 1;

    chaosGain.connect(chaosFilter);
    chaosFilter.connect(masterGain);
    heartbeatGain.connect(masterGain);
    masterGain.connect(context.destination);

    const chaosSource = createLoopSource(context, chaosBuffer, chaosGain);
    const heartbeatSource = createLoopSource(context, heartbeatBuffer, heartbeatGain);

    chaosSource.start(0);
    heartbeatSource.start(0);

    audioContextRef.current = context;
    chaosSourceRef.current = chaosSource;
    heartbeatSourceRef.current = heartbeatSource;
    chaosGainRef.current = chaosGain;
    heartbeatGainRef.current = heartbeatGain;
    chaosFilterRef.current = chaosFilter;
    masterGainRef.current = masterGain;

    setIsAudioReady(true);
    return context;
  }, [loadAudioBuffer, createLoopSource]);

  const pulseVibration = useCallback((t) => {
    if (!navigator.vibrate) return;

    const now = performance.now();

    try {
      if (t > 0.15) {
        const interval = 80 + (1 - t) * 120;
        if (now - lastVibrateRef.current < interval) return;
        lastVibrateRef.current = now;
        navigator.vibrate(Math.round(t * 180 + 30));
      } else if (t > 0) {
        const beatInterval = 60_000 / TARGET_BPM;
        if (now - lastVibrateRef.current < beatInterval) return;
        lastVibrateRef.current = now;
        navigator.vibrate([120, 80]);
      }
    } catch {
      // iOS Safari — vibrate unavailable
    }
  }, []);

  const applySensoryOutput = useCallback(
    (t) => {
      const context = audioContextRef.current;
      if (!context) return;

      const now = context.currentTime;

      const chaosVolume = Math.max(0, Math.min(1, (t - 0.2) / 0.8));
      chaosGainRef.current?.gain.setTargetAtTime(chaosVolume, now, 0.05);

      const heartbeatVolume = Math.max(0, Math.min(0.85, (0.7 - t) / 0.7));
      heartbeatGainRef.current?.gain.setTargetAtTime(heartbeatVolume, now, 0.08);

      const filterFreq = 200 + t * 12_000;
      chaosFilterRef.current?.frequency.setTargetAtTime(filterFreq, now, 0.1);

      pulseVibration(t);
    },
    [pulseVibration],
  );

  const cancelFadeOut = useCallback(() => {
    cancelAnimationFrame(fadeRafRef.current);
    fadeRafRef.current = null;
  }, []);

  const completeCycle = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    decayStartRef.current = null;

    setState(SURGE_STATES.COOLDOWN);
    setIntensity(0);
    applySensoryOutput(0);

    cooldownTimeoutRef.current = setTimeout(() => {
      setState(SURGE_STATES.IDLE);
    }, COOLDOWN_DURATION_MS);
  }, [applySensoryOutput]);

  const tick = useCallback(() => {
    if (stateRef.current === SURGE_STATES.DECAYING && decayStartRef.current) {
      const elapsed = performance.now() - decayStartRef.current;
      const progress = Math.min(elapsed / DECAY_DURATION_MS, 1);
      const eased = 1 - Math.pow(progress, 0.65);
      const nextIntensity = Math.max(0, eased);

      setIntensity(nextIntensity);
      applySensoryOutput(nextIntensity);

      // 60 BPM phase synced to wall clock
      const beatPhase = (elapsed * TARGET_BPM) / 60_000;
      setHeartbeatPhase(beatPhase % 1);

      if (progress >= 1) {
        completeCycle();
        return;
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [applySensoryOutput, completeCycle]);

  const startDecayLoop = useCallback(() => {
    decayStartRef.current = performance.now();
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const activate = useCallback(async () => {
    if (
      stateRef.current !== SURGE_STATES.IDLE &&
      stateRef.current !== SURGE_STATES.COOLDOWN
    ) {
      return;
    }

    cancelFadeOut();

    try {
      await initAudio();
    } catch {
      // Audio init failed — visual/haptic-only fallback
    }

    setState(SURGE_STATES.OVERLOAD);
    setIntensity(1);
    applySensoryOutput(1);

    overloadTimeoutRef.current = setTimeout(() => {
      if (stateRef.current !== SURGE_STATES.OVERLOAD) return;
      setState(SURGE_STATES.DECAYING);
      startDecayLoop();
    }, OVERLOAD_DURATION_MS);
  }, [initAudio, applySensoryOutput, startDecayLoop, cancelFadeOut]);

  const release = useCallback(() => {
    if (stateRef.current === SURGE_STATES.IDLE) return;

    clearTimeout(overloadTimeoutRef.current);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    decayStartRef.current = null;

    setState(SURGE_STATES.IDLE);

    const startIntensity = intensityRef.current;
    const fadeStart = performance.now();

    const fadeTick = () => {
      const progress = Math.min((performance.now() - fadeStart) / FADE_OUT_DURATION_MS, 1);
      const faded = startIntensity * (1 - progress);

      setIntensity(faded);
      applySensoryOutput(faded);

      if (progress < 1) {
        fadeRafRef.current = requestAnimationFrame(fadeTick);
      } else {
        setIntensity(0);
        applySensoryOutput(0);
        fadeRafRef.current = null;
      }
    };

    fadeRafRef.current = requestAnimationFrame(fadeTick);
  }, [applySensoryOutput]);

  const dispose = useCallback(() => {
    clearTimeout(overloadTimeoutRef.current);
    clearTimeout(cooldownTimeoutRef.current);
    cancelAnimationFrame(rafRef.current);
    cancelAnimationFrame(fadeRafRef.current);

    try {
      chaosSourceRef.current?.stop();
      heartbeatSourceRef.current?.stop();
    } catch {
      // Already stopped
    }

    chaosSourceRef.current = null;
    heartbeatSourceRef.current = null;
    chaosGainRef.current = null;
    heartbeatGainRef.current = null;
    chaosFilterRef.current = null;
    masterGainRef.current = null;

    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
    }
    audioContextRef.current = null;
    setIsAudioReady(false);
  }, []);

  useEffect(() => dispose, [dispose]);

  return {
    state,
    intensity,
    heartbeatPhase,
    isAudioReady,
    activate,
    release,
    dispose,
  };
}

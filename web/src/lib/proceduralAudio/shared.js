/**
 * Shared Web Audio utilities for all Surge sequences.
 */

let sharedContext = null;

export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;

  if (!sharedContext || sharedContext.state === 'closed') {
    sharedContext = new Ctor();
  }

  return sharedContext;
}

/**
 * Call synchronously inside click / pointerdown handlers so browsers allow playback.
 */
export function unlockAudioContext() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
}

export function isAudioUnlocked() {
  return sharedContext?.state === 'running';
}

export function releaseAudioContext() {
  if (sharedContext?.state !== 'closed') {
    void sharedContext?.close();
  }
  sharedContext = null;
}

export function makePinkNoiseBuffer(ctx, seconds = 2) {
  const length = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }

  return buffer;
}

export function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** @param {AudioContext} ctx */
export function createMasterChain(ctx, initialGain = 0.0001) {
  const master = ctx.createGain();
  const panner = ctx.createStereoPanner();
  master.gain.setValueAtTime(initialGain, ctx.currentTime);
  panner.connect(master);
  master.connect(ctx.destination);
  return { master, panner };
}

export function rampGain(param, target, now, timeConstant = 0.08) {
  param.setTargetAtTime(Math.max(0.0001, target), now, timeConstant);
}

export function fadeInMaster(master, ctx, peak = 0.88, attack = 0.45) {
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(peak, now + attack);
}

export function fadeOutMaster(master, ctx, release = 0.4) {
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
  master.gain.exponentialRampToValueAtTime(0.0001, now + release);
}

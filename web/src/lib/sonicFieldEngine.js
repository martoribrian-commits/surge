/**
 * Procedural sonic field — pink noise carve, sub-bass, breath layer.
 * Ported from site/js/engine-audio.js (original Surge static engine).
 */

import { SUB_BASS_HZ, BREATH_HZ } from './surgeCurve';

function createContext() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  return new Ctor();
}

function makePinkNoiseBuffer(ctx) {
  const seconds = 2;
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

export class SonicFieldEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noise = null;
    this.noiseGain = null;
    this.noiseFilter = null;
    this.sub = null;
    this.subGain = null;
    this.lfo = null;
    this.lfoGain = null;
    this.breathOsc = null;
    this.breathGain = null;
    this.panner = null;
    this.lastPan = 0;
  }

  prime() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const ctx = createContext();
    if (!ctx) return;
    this.ctx = ctx;
    void ctx.resume();
  }

  ignite() {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(0.0001, now);
    this.master.gain.exponentialRampToValueAtTime(1, now + 0.12);
    this.master.gain.exponentialRampToValueAtTime(0.92, now + 0.55);
  }

  /** @param {number} durationMs */
  start(durationMs) {
    if (this.master) return;

    let ctx = this.ctx;
    if (!ctx) {
      ctx = createContext();
      if (!ctx) return;
      this.ctx = ctx;
    }
    void ctx.resume();

    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.92, now + 0.45);
    master.connect(ctx.destination);
    this.master = master;

    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(0, now);
    panner.connect(master);
    this.panner = panner;

    const noise = ctx.createBufferSource();
    noise.buffer = makePinkNoiseBuffer(ctx);
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(14000, now);
    filter.Q.setValueAtTime(0.65, now);
    this.noiseFilter = filter;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.62, now);
    this.noiseGain = noiseGain;

    noise.connect(filter).connect(noiseGain).connect(panner);
    noise.start(now);
    this.noise = noise;

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(SUB_BASS_HZ, now);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.04, now);
    this.subGain = subGain;

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(1, now);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.035, now);
    lfo.connect(lfoGain).connect(subGain.gain);
    this.lfoGain = lfoGain;

    sub.connect(subGain).connect(panner);
    sub.start(now);
    lfo.start(now);
    this.sub = sub;
    this.lfo = lfo;

    const breathOsc = ctx.createOscillator();
    breathOsc.type = 'sine';
    breathOsc.frequency.setValueAtTime(196, now);
    const breathGain = ctx.createGain();
    breathGain.gain.setValueAtTime(0, now);
    breathOsc.connect(breathGain).connect(panner);
    breathOsc.start(now);
    this.breathOsc = breathOsc;
    this.breathGain = breathGain;

    void durationMs;
  }

  /** @param {{ progress: number, chaos: number, heartbeat: number }} state @param {number} elapsedMs */
  sync(state, elapsedMs) {
    if (!this.ctx || !this.noiseGain || !this.noiseFilter || !this.subGain || !this.breathGain) {
      return;
    }

    const now = this.ctx.currentTime;
    const { chaos, heartbeat } = state;

    const noiseVol = 0.08 + chaos * 0.58;
    this.noiseGain.gain.setTargetAtTime(noiseVol, now, 0.08);

    const cutoff = 120 + (1 - chaos) * 8200 + heartbeat * 400;
    this.noiseFilter.frequency.setTargetAtTime(Math.max(140, cutoff), now, 0.12);

    const subVol = 0.04 + heartbeat * 0.52;
    this.subGain.gain.setTargetAtTime(subVol, now, 0.1);

    const lfoDepth = 0.02 + heartbeat * 0.38;
    if (this.lfoGain) {
      this.lfoGain.gain.setTargetAtTime(lfoDepth, now, 0.1);
    }

    const breathVol = heartbeat > 0.4 ? (heartbeat - 0.4) * 0.22 : 0;
    this.breathGain.gain.setTargetAtTime(breathVol, now, 0.15);

    if (this.panner && chaos > 0.2) {
      const panTarget = Math.sin(elapsedMs * 0.0022) * chaos * 0.35;
      if (Math.abs(panTarget - this.lastPan) > 0.02) {
        this.panner.pan.setTargetAtTime(panTarget, now, 0.06);
        this.lastPan = panTarget;
      }
    } else if (this.panner) {
      this.panner.pan.setTargetAtTime(0, now, 0.1);
      this.lastPan = 0;
    }

    if (this.breathOsc && heartbeat > 0.35) {
      const breathMod = 0.5 + 0.5 * Math.sin(2 * Math.PI * BREATH_HZ * (elapsedMs / 1000));
      const breathFreq = 180 + breathMod * 40;
      this.breathOsc.frequency.setTargetAtTime(breathFreq, now, 0.08);
    }
  }

  pause() {
    if (!this.ctx || !this.master) return;
    void this.ctx.resume();
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
    this.master.gain.exponentialRampToValueAtTime(0.1, now + 0.35);
  }

  resume() {
    if (!this.ctx || !this.master) return;
    void this.ctx.resume();
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
    this.master.gain.exponentialRampToValueAtTime(0.92, now + 0.35);
  }

  complete() {
    if (!this.ctx || !this.master || !this.noiseGain || !this.subGain) return;
    const now = this.ctx.currentTime;

    this.noiseGain.gain.cancelScheduledValues(now);
    this.noiseGain.gain.setValueAtTime(Math.max(this.noiseGain.gain.value, 0.0001), now);
    this.noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    if (this.breathGain) {
      this.breathGain.gain.setTargetAtTime(0.0001, now, 0.2);
    }

    const sub = this.subGain.gain;
    sub.cancelScheduledValues(now);
    const base = 0.0001;
    for (let i = 0; i < 3; i++) {
      const beat = now + i;
      sub.setValueAtTime(base, beat);
      sub.exponentialRampToValueAtTime(0.75, beat + 0.16);
      sub.exponentialRampToValueAtTime(base, beat + 0.88);
    }

    if (this.panner) {
      this.panner.pan.setTargetAtTime(0, now, 0.2);
    }

    const fadeEnd = now + 3.6;
    this.master.gain.cancelScheduledValues(now + 3);
    this.master.gain.setValueAtTime(0.92, now + 3);
    this.master.gain.exponentialRampToValueAtTime(0.0001, fadeEnd);

    window.setTimeout(() => this.stop(), 3800);
  }

  stop() {
    if (!this.ctx) return;
    try {
      this.noise?.stop();
      this.sub?.stop();
      this.lfo?.stop();
      this.breathOsc?.stop();
    } catch {
      /* already stopped */
    }
    void this.ctx.close();
    this.ctx = null;
    this.master = null;
    this.noise = null;
    this.noiseGain = null;
    this.noiseFilter = null;
    this.sub = null;
    this.subGain = null;
    this.lfo = null;
    this.lfoGain = null;
    this.breathOsc = null;
    this.breathGain = null;
    this.panner = null;
  }
}

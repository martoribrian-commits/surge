/**
 * Procedural sonic field — pink noise carve, sub-bass, breath layer.
 * Ported from site/js/engine-audio.js (original Surge static engine).
 */

import { SUB_BASS_HZ, BREATH_HZ } from './surgeCurve';
import { getAudioContext, makePinkNoiseBuffer, unlockAudioContext } from './proceduralAudio/shared';

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
    unlockAudioContext();
    const ctx = getAudioContext();
    if (!ctx) return;
    this.ctx = ctx;
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

    unlockAudioContext();
    const ctx = getAudioContext();
    if (!ctx) return;
    this.ctx = ctx;

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
    unlockAudioContext();
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
    this.master.gain.exponentialRampToValueAtTime(0.1, now + 0.35);
  }

  resume() {
    if (!this.ctx || !this.master) return;
    unlockAudioContext();
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

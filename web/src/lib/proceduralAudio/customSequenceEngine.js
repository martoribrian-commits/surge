/**
 * Procedural Web Audio for AI-generated custom sequences.
 * Parameters come from Crane's audioProfile on the custom spec.
 */

import {
  clamp01,
  createMasterChain,
  fadeInMaster,
  fadeOutMaster,
  getAudioContext,
  makePinkNoiseBuffer,
  rampGain,
  unlockAudioContext,
} from './shared';

function stopSource(source) {
  try {
    source?.stop();
  } catch {
    /* already stopped */
  }
}

const TEMPO_HZ = { slow: 0.35, medium: 0.55, fast: 0.85 };
const WARMTH_CUTOFF = { cool: 2400, neutral: 5200, warm: 8800 };

export class CustomSequenceAudioEngine {
  /** @param {object} audioProfile */
  constructor(audioProfile = {}) {
    this.profile = {
      baseFreq: Number(audioProfile.baseFreq ?? 110),
      toneType: audioProfile.toneType === 'triangle' ? 'triangle' : 'sine',
      noiseLevel: clamp01(Number(audioProfile.noiseLevel ?? 0.35)),
      tempo: TEMPO_HZ[audioProfile.tempo] ? audioProfile.tempo : 'medium',
      warmth: WARMTH_CUTOFF[audioProfile.warmth] ? audioProfile.warmth : 'neutral',
    };
    this.running = false;
    this.nodes = null;
  }

  prime() {
    getAudioContext();
  }

  start() {
    if (this.running) return;
    unlockAudioContext();
    const ctx = getAudioContext();
    if (!ctx) return;

    this.stop();
    const { master, panner } = createMasterChain(ctx);
    fadeInMaster(master, ctx, 1.2, 0.4);

    const noise = ctx.createBufferSource();
    noise.buffer = makePinkNoiseBuffer(ctx);
    noise.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = WARMTH_CUTOFF[this.profile.warmth];
    noiseFilter.Q.value = 0.6;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0;

    const tone = ctx.createOscillator();
    tone.type = this.profile.toneType;
    tone.frequency.value = this.profile.baseFreq;

    const toneGain = ctx.createGain();
    toneGain.gain.value = 0;

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = this.profile.baseFreq * 0.5;

    const subGain = ctx.createGain();
    subGain.gain.value = 0;

    noise.connect(noiseFilter).connect(noiseGain).connect(panner);
    tone.connect(toneGain).connect(panner);
    sub.connect(subGain).connect(panner);

    noise.start();
    tone.start();
    sub.start();

    this.nodes = { ctx, master, noiseFilter, noiseGain, tone, toneGain, sub, subGain };
    this.running = true;
  }

  pause() {
    if (!this.nodes) return;
    const { ctx, noiseGain, toneGain, subGain } = this.nodes;
    const now = ctx.currentTime;
    rampGain(noiseGain.gain, 0, now, 0.15);
    rampGain(toneGain.gain, 0, now, 0.12);
    rampGain(subGain.gain, 0, now, 0.12);
  }

  resume() {
    /* sync loop restores levels */
  }

  /**
   * @param {number} elapsedSeconds
   * @param {number} progress
   * @param {boolean} [isEngaged]
   * @param {{ inhale: number, exhale?: number } | null} [breathCycle]
   */
  sync(elapsedSeconds, progress, isEngaged = true, breathCycle = null) {
    if (!this.running || !this.nodes) return;
    const { ctx, noiseFilter, noiseGain, tone, toneGain, subGain } = this.nodes;
    const now = ctx.currentTime;
    const t = elapsedSeconds;
    const tempoHz = TEMPO_HZ[this.profile.tempo];
    const lfo = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * tempoHz);

    const engage = isEngaged ? 1 : 0.12;
    const tail = 1 - clamp01((progress - 0.85) / 0.15);

    if (breathCycle) {
      const cycleLen = breathCycle.inhale + (breathCycle.exhale ?? 6);
      const cycleT = t % cycleLen;
      const inhale = cycleT < breathCycle.inhale;
      const breath = inhale
        ? clamp01(cycleT / breathCycle.inhale)
        : 1 - clamp01((cycleT - breathCycle.inhale) / (breathCycle.exhale ?? 6));

      rampGain(noiseGain.gain, this.profile.noiseLevel * (0.35 + breath * 0.55) * engage * tail, now, 0.08);
      rampGain(toneGain.gain, (0.04 + breath * 0.12) * engage * tail, now, 0.06);
      rampGain(subGain.gain, (0.03 + (1 - breath) * 0.1) * engage * tail, now, 0.08);
      tone.frequency.setTargetAtTime(this.profile.baseFreq * (0.92 + breath * 0.16), now, 0.1);
    } else {
      const arc = Math.sin(progress * Math.PI);
      rampGain(
        noiseGain.gain,
        this.profile.noiseLevel * (0.4 + lfo * 0.35) * arc * engage * tail,
        now,
        0.06,
      );
      rampGain(toneGain.gain, (0.05 + lfo * 0.1) * arc * engage * tail, now, 0.05);
      rampGain(subGain.gain, (0.04 + lfo * 0.08) * arc * engage * tail, now, 0.06);
      tone.frequency.setTargetAtTime(this.profile.baseFreq * (0.95 + lfo * 0.1), now, 0.08);
    }

    noiseFilter.frequency.setTargetAtTime(
      WARMTH_CUTOFF[this.profile.warmth] * (0.85 + lfo * 0.2),
      now,
      0.12,
    );
  }

  /** @param {number} [pan] */
  triggerTick(pan = 0) {
    if (!this.nodes) return;
    const { ctx, master } = this.nodes;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    osc.type = this.profile.toneType;
    osc.frequency.value = this.profile.baseFreq * 1.4;
    gain.gain.value = 0.22;
    panner.pan.value = clamp01((pan + 1) / 2) * 2 - 1;
    osc.connect(gain).connect(panner).connect(master);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  }

  complete() {
    if (!this.nodes) return;
    fadeOutMaster(this.nodes.master, this.nodes.ctx, 1.8);
    window.setTimeout(() => this.stop(), 1900);
  }

  stop() {
    if (!this.nodes) {
      this.running = false;
      return;
    }
    const n = this.nodes;
    stopSource(n.noise);
    stopSource(n.tone);
    stopSource(n.sub);
    this.nodes = null;
    this.running = false;
  }
}

/**
 * Procedural Web Audio engines — one per sequence variant.
 * Designed for nervous-system entrainment without external assets.
 */

import { curveAtElapsed } from '../surgeCurve';
import { SonicFieldEngine } from '../sonicFieldEngine';
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

/** 30s Instant Reset — double-inhale stinger, exhale carve, parasympathetic tail. */
export class InstantResetAudioEngine {
  constructor() {
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
    fadeInMaster(master, ctx, 1, 0.35);

    const noise = ctx.createBufferSource();
    noise.buffer = makePinkNoiseBuffer(ctx);
    noise.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 9000;
    noiseFilter.Q.value = 0.7;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0;

    const tone = ctx.createOscillator();
    tone.type = 'sine';
    tone.frequency.value = 196;

    const toneGain = ctx.createGain();
    toneGain.gain.value = 0;

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 55;

    const subGain = ctx.createGain();
    subGain.gain.value = 0;

    noise.connect(noiseFilter).connect(noiseGain).connect(panner);
    tone.connect(toneGain).connect(panner);
    sub.connect(subGain).connect(panner);

    noise.start();
    tone.start();
    sub.start();

    this.nodes = { ctx, master, panner, noise, noiseFilter, noiseGain, tone, toneGain, sub, subGain };
    this.running = true;
  }

  /** @param {number} elapsedSeconds @param {number} progress */
  sync(elapsedSeconds, progress) {
    if (!this.running || !this.nodes) return;
    const { ctx, noiseFilter, noiseGain, tone, toneGain, subGain } = this.nodes;
    const now = ctx.currentTime;
    const t = elapsedSeconds;
    const transitionAt = 10;

    if (t < 1.2) {
      const inhale1 = clamp01(t / 1.2);
      rampGain(noiseGain.gain, 0.28 + inhale1 * 0.78, now, 0.05);
      rampGain(toneGain.gain, inhale1 * 0.16, now, 0.04);
      tone.frequency.setTargetAtTime(180 + inhale1 * 80, now, 0.06);
      noiseFilter.frequency.setTargetAtTime(12000 - inhale1 * 2000, now, 0.08);
    } else if (t < 2.4) {
      const hitch = clamp01((t - 1.2) / 1.2);
      rampGain(noiseGain.gain, 0.55 + hitch * 0.25, now, 0.04);
      rampGain(toneGain.gain, 0.12 + hitch * 0.08, now, 0.04);
      tone.frequency.setTargetAtTime(260 + hitch * 40, now, 0.05);
    } else if (t < transitionAt) {
      const exhale = clamp01((t - 2.4) / (transitionAt - 2.4));
      rampGain(noiseGain.gain, 0.65 * (1 - exhale * 0.85), now, 0.12);
      rampGain(toneGain.gain, 0.14 * (1 - exhale), now, 0.1);
      noiseFilter.frequency.setTargetAtTime(8000 - exhale * 6500, now, 0.15);
      rampGain(subGain.gain, exhale * 0.08, now, 0.12);
    } else {
      const tail = clamp01((t - transitionAt) / (30 - transitionAt));
      rampGain(noiseGain.gain, 0.06 * (1 - tail * 0.8), now, 0.2);
      rampGain(toneGain.gain, 0, now, 0.08);
      noiseFilter.frequency.setTargetAtTime(400 + tail * 300, now, 0.2);
      const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 0.5);
      rampGain(subGain.gain, 0.06 + pulse * 0.14 * (1 - tail * 0.3), now, 0.08);
    }

    void progress;
  }

  complete() {
    if (!this.nodes) return;
    fadeOutMaster(this.nodes.master, this.nodes.ctx, 1.2);
    window.setTimeout(() => this.stop(), 1300);
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

/** 60s Orienting Anchor — ambient bilateral bed + panned ticks on tap. */
export class OrientingAnchorAudioEngine {
  constructor() {
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
    fadeInMaster(master, ctx, 0.95, 0.6);

    const leftOsc = ctx.createOscillator();
    leftOsc.type = 'sine';
    leftOsc.frequency.value = 72;

    const rightOsc = ctx.createOscillator();
    rightOsc.type = 'sine';
    rightOsc.frequency.value = 74;

    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    leftGain.gain.value = 0.05;
    rightGain.gain.value = 0.05;

    const leftPan = ctx.createStereoPanner();
    const rightPan = ctx.createStereoPanner();
    leftPan.pan.value = -0.65;
    rightPan.pan.value = 0.65;

    leftOsc.connect(leftGain).connect(leftPan).connect(master);
    rightOsc.connect(rightGain).connect(rightPan).connect(master);
    leftOsc.start();
    rightOsc.start();

    const bedNoise = ctx.createBufferSource();
    bedNoise.buffer = makePinkNoiseBuffer(ctx);
    bedNoise.loop = true;
    const bedFilter = ctx.createBiquadFilter();
    bedFilter.type = 'lowpass';
    bedFilter.frequency.value = 320;
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0.07;
    bedNoise.connect(bedFilter).connect(bedGain).connect(panner);

    bedNoise.start();

    this.nodes = {
      ctx,
      master,
      panner,
      leftOsc,
      rightOsc,
      leftGain,
      rightGain,
      bedNoise,
      bedGain,
    };
    this.running = true;
  }

  /** @param {number} elapsedSeconds @param {number} progress */
  sync(elapsedSeconds, progress) {
    if (!this.running || !this.nodes) return;
    const { ctx, leftGain, rightGain, bedGain } = this.nodes;
    const now = ctx.currentTime;
    const bpm = 60;
    const beatPhase = (elapsedSeconds * bpm) / 60;
    const swell = 0.5 + 0.5 * Math.sin(beatPhase * Math.PI * 2);

    rampGain(leftGain.gain, 0.028 + swell * 0.022, now, 0.12);
    rampGain(rightGain.gain, 0.028 + (1 - swell) * 0.022, now, 0.12);
    rampGain(bedGain.gain, 0.03 + progress * 0.02, now, 0.15);
  }

  /** @param {number} pan -1 to 1 */
  triggerTick(pan = 0) {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const tickPan = ctx.createStereoPanner();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.42, ctx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);

    tickPan.pan.value = clamp01((pan + 1) / 2) * 2 - 1;

    osc.connect(gain).connect(tickPan).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  }

  complete() {
    if (!this.nodes) return;
    fadeOutMaster(this.nodes.master, this.nodes.ctx, 1.4);
    window.setTimeout(() => this.stop(), 1500);
  }

  stop() {
    if (!this.nodes) {
      this.running = false;
      return;
    }
    const n = this.nodes;
    stopSource(n.leftOsc);
    stopSource(n.rightOsc);
    stopSource(n.bedNoise);
    this.nodes = null;
    this.running = false;
  }
}

/** 90s Coherence Ripple — 4/6 breath-linked sub swell while holding. */
export class CoherenceRippleAudioEngine {
  constructor() {
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
    fadeInMaster(master, ctx, 1, 0.5);

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 58;

    const subGain = ctx.createGain();
    subGain.gain.value = 0.04;

    const pad = ctx.createOscillator();
    pad.type = 'triangle';
    pad.frequency.value = 220;

    const padGain = ctx.createGain();
    padGain.gain.value = 0;

    const shimmer = ctx.createBufferSource();
    shimmer.buffer = makePinkNoiseBuffer(ctx, 1);
    shimmer.loop = true;
    const shimmerFilter = ctx.createBiquadFilter();
    shimmerFilter.type = 'bandpass';
    shimmerFilter.frequency.value = 420;
    shimmerFilter.Q.value = 2;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.015;

    sub.connect(subGain).connect(panner);
    pad.connect(padGain).connect(panner);
    shimmer.connect(shimmerFilter).connect(shimmerGain).connect(panner);

    sub.start();
    pad.start();
    shimmer.start();

    this.nodes = { ctx, master, panner, sub, subGain, pad, padGain, shimmerGain };
    this.running = true;
  }

  pause() {
    if (!this.nodes) return;
    fadeOutMaster(this.nodes.master, this.nodes.ctx, 0.35);
  }

  resume() {
    if (!this.nodes) {
      this.start();
      return;
    }
    fadeInMaster(this.nodes.master, this.nodes.ctx, 0.82, 0.35);
  }

  /**
   * @param {number} elapsedSeconds
   * @param {{ inhale: number, exhale: number }} breathCycle
   */
  sync(elapsedSeconds, breathCycle = { inhale: 4, exhale: 6 }) {
    if (!this.running || !this.nodes) return;
    const { ctx, sub, subGain, pad, padGain, shimmerGain } = this.nodes;
    const now = ctx.currentTime;
    const cycle = breathCycle.inhale + breathCycle.exhale;
    const t = elapsedSeconds % cycle;

    let breathAmount;
    if (t < breathCycle.inhale) {
      breathAmount = 0.5 - 0.5 * Math.cos((Math.PI * t) / breathCycle.inhale);
    } else {
      const exhaleT = t - breathCycle.inhale;
      breathAmount = 1 - (0.5 - 0.5 * Math.cos((Math.PI * exhaleT) / breathCycle.exhale));
    }

    rampGain(subGain.gain, 0.1 + breathAmount * 0.48, now, 0.1);
    rampGain(padGain.gain, breathAmount * 0.08, now, 0.12);
    rampGain(shimmerGain.gain, 0.01 + breathAmount * 0.03, now, 0.1);
    sub.frequency.setTargetAtTime(52 + breathAmount * 14, now, 0.12);
    pad.frequency.setTargetAtTime(196 + breathAmount * 48, now, 0.15);
  }

  complete() {
    if (!this.nodes) return;
    fadeOutMaster(this.nodes.master, this.nodes.ctx, 1.6);
    window.setTimeout(() => this.stop(), 1700);
  }

  stop() {
    if (!this.nodes) {
      this.running = false;
      return;
    }
    const n = this.nodes;
    stopSource(n.sub);
    stopSource(n.pad);
    stopSource(n.shimmer);
    this.nodes = null;
    this.running = false;
  }
}

/** 90s Vagal Downshift — clinical warm drone + breath tone. No harsh static. */
export class VagalDownshiftAudioEngine {
  constructor() {
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
    fadeInMaster(master, ctx, 0.88, 0.65);

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 55;

    const subGain = ctx.createGain();
    subGain.gain.value = 0.06;

    const harmonic = ctx.createOscillator();
    harmonic.type = 'sine';
    harmonic.frequency.value = 110;

    const harmonicGain = ctx.createGain();
    harmonicGain.gain.value = 0.02;

    const breathOsc = ctx.createOscillator();
    breathOsc.type = 'triangle';
    breathOsc.frequency.value = 174;

    const breathGain = ctx.createGain();
    breathGain.gain.value = 0;

    // Very soft filtered bed — warmth without static harshness
    const bed = ctx.createBufferSource();
    bed.buffer = makePinkNoiseBuffer(ctx);
    bed.loop = true;
    const bedFilter = ctx.createBiquadFilter();
    bedFilter.type = 'bandpass';
    bedFilter.frequency.value = 280;
    bedFilter.Q.value = 0.8;
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0.04;

    sub.connect(subGain).connect(panner);
    harmonic.connect(harmonicGain).connect(panner);
    breathOsc.connect(breathGain).connect(panner);
    bed.connect(bedFilter).connect(bedGain).connect(panner);

    sub.start();
    harmonic.start();
    breathOsc.start();
    bed.start();

    this.nodes = {
      ctx,
      master,
      panner,
      sub,
      subGain,
      harmonic,
      harmonicGain,
      breathOsc,
      breathGain,
      bed,
      bedFilter,
      bedGain,
    };
    this.running = true;
  }

  pause() {
    if (!this.nodes) return;
    fadeOutMaster(this.nodes.master, this.nodes.ctx, 0.45);
  }

  resume() {
    if (!this.nodes) {
      this.start();
      return;
    }
    fadeInMaster(this.nodes.master, this.nodes.ctx, 0.82, 0.45);
  }

  /** @param {number} elapsedMs */
  sync(elapsedMs) {
    if (!this.running || !this.nodes) return;
    const state = curveAtElapsed(elapsedMs / 1000);
    const { ctx, subGain, harmonicGain, breathOsc, breathGain, bedFilter, bedGain } = this.nodes;
    const now = ctx.currentTime;
    const { chaos, heartbeat } = state;
    const t = elapsedMs / 1000;

    // Bed fades OUT as chaos drops — inverse of static field
    rampGain(bedGain.gain, 0.02 + chaos * 0.12, now, 0.14);
    bedFilter.frequency.setTargetAtTime(220 + (1 - chaos) * 180, now, 0.18);

    const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 0.5);
    rampGain(subGain.gain, 0.05 + heartbeat * 0.32 + pulse * 0.1, now, 0.12);
    rampGain(harmonicGain.gain, heartbeat * 0.08, now, 0.15);

    if (heartbeat > 0.3) {
      const breathMod = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * (5 / 60));
      rampGain(breathGain.gain, (heartbeat - 0.3) * 0.18, now, 0.12);
      breathOsc.frequency.setTargetAtTime(160 + breathMod * 30, now, 0.1);
    } else {
      rampGain(breathGain.gain, 0, now, 0.1);
    }
  }

  complete() {
    if (!this.nodes) return;
    fadeOutMaster(this.nodes.master, this.nodes.ctx, 2.2);
    window.setTimeout(() => this.stop(), 2300);
  }

  stop() {
    if (!this.nodes) {
      this.running = false;
      return;
    }
    const n = this.nodes;
    stopSource(n.sub);
    stopSource(n.harmonic);
    stopSource(n.breathOsc);
    stopSource(n.bed);
    this.nodes = null;
    this.running = false;
  }
}

/** 30s Flash Freeze — crackle heat bed crystallizes to glass tone on hold. */
export class FlashFreezeAudioEngine {
  constructor() {
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
    fadeInMaster(master, ctx, 0.9, 0.4);

    const crackle = ctx.createBufferSource();
    crackle.buffer = makePinkNoiseBuffer(ctx);
    crackle.loop = true;
    const crackleFilter = ctx.createBiquadFilter();
    crackleFilter.type = 'highpass';
    crackleFilter.frequency.value = 800;
    const crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.12;

    const glass = ctx.createOscillator();
    glass.type = 'sine';
    glass.frequency.value = 880;
    const glassGain = ctx.createGain();
    glassGain.gain.value = 0;

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 48;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.04;

    crackle.connect(crackleFilter).connect(crackleGain).connect(panner);
    glass.connect(glassGain).connect(panner);
    sub.connect(subGain).connect(panner);

    crackle.start();
    glass.start();
    sub.start();

    this.nodes = { ctx, master, panner, crackle, crackleFilter, crackleGain, glass, glassGain, sub, subGain };
    this.running = true;
  }

  pause() {
    if (!this.nodes) return;
    fadeOutMaster(this.nodes.master, this.nodes.ctx, 0.35);
  }

  resume() {
    if (!this.nodes) {
      this.start();
      return;
    }
    fadeInMaster(this.nodes.master, this.nodes.ctx, 0.85, 0.35);
  }

  /** @param {number} elapsed @param {number} progress @param {boolean} [engaged] */
  sync(elapsed, progress, engaged = true) {
    if (!this.running || !this.nodes) return;
    const { ctx, crackleFilter, crackleGain, glass, glassGain, subGain } = this.nodes;
    const now = ctx.currentTime;
    const freeze = engaged ? Math.min(1, progress * 1.1 + elapsed / 30) : Math.max(0, progress * 0.3);

    rampGain(crackleGain.gain, 0.14 * (1 - freeze * 0.92), now, 0.08);
    crackleFilter.frequency.setTargetAtTime(800 + freeze * 4200, now, 0.12);
    rampGain(glassGain.gain, freeze * 0.1, now, 0.1);
    glass.frequency.setTargetAtTime(880 - freeze * 320, now, 0.15);
    rampGain(subGain.gain, 0.04 + freeze * 0.06, now, 0.1);
  }

  complete() {
    if (!this.nodes) return;
    fadeOutMaster(this.nodes.master, this.nodes.ctx, 1);
    window.setTimeout(() => this.stop(), 1100);
  }

  stop() {
    if (!this.nodes) {
      this.running = false;
      return;
    }
    const n = this.nodes;
    stopSource(n.crackle);
    stopSource(n.glass);
    stopSource(n.sub);
    this.nodes = null;
    this.running = false;
  }
}

/** 60s Nova Gate — warp whoosh builds, peaks, settles to hum. */
export class NovaGateAudioEngine {
  constructor() {
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
    fadeInMaster(master, ctx, 1, 0.55);

    const sweep = ctx.createBufferSource();
    sweep.buffer = makePinkNoiseBuffer(ctx);
    sweep.loop = true;
    const sweepFilter = ctx.createBiquadFilter();
    sweepFilter.type = 'bandpass';
    sweepFilter.frequency.value = 200;
    sweepFilter.Q.value = 1.2;
    const sweepGain = ctx.createGain();
    sweepGain.gain.value = 0.02;

    const hum = ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = 72;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.03;

    const shimmer = ctx.createOscillator();
    shimmer.type = 'triangle';
    shimmer.frequency.value = 144;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0;

    sweep.connect(sweepFilter).connect(sweepGain).connect(panner);
    hum.connect(humGain).connect(panner);
    shimmer.connect(shimmerGain).connect(panner);

    sweep.start();
    hum.start();
    shimmer.start();

    this.nodes = { ctx, master, panner, sweep, sweepFilter, sweepGain, hum, humGain, shimmer, shimmerGain };
    this.running = true;
  }

  /** @param {number} elapsed @param {number} progress */
  sync(elapsed, progress) {
    if (!this.running || !this.nodes) return;
    const { ctx, sweepFilter, sweepGain, hum, humGain, shimmerGain, panner } = this.nodes;
    const now = ctx.currentTime;

    let warp = 0;
    if (elapsed < 12) warp = elapsed / 12;
    else if (elapsed < 42) warp = 1;
    else warp = Math.max(0, 1 - (elapsed - 42) / 18);

    rampGain(sweepGain.gain, 0.02 + warp * 0.16, now, 0.06);
    sweepFilter.frequency.setTargetAtTime(180 + warp * 2400, now, 0.08);
    sweepFilter.Q.value = 1.2 + warp * 2;
    rampGain(humGain.gain, 0.03 + (1 - warp) * 0.05 + progress * 0.04, now, 0.08);
    hum.frequency.setTargetAtTime(72 - warp * 12, now, 0.1);
    rampGain(shimmerGain.gain, warp * 0.06 * (1 - progress * 0.5), now, 0.06);
    panner.pan.setTargetAtTime(Math.sin(elapsed * 0.9) * warp * 0.35, now, 0.05);
  }

  complete() {
    if (!this.nodes) return;
    fadeOutMaster(this.nodes.master, this.nodes.ctx, 1.3);
    window.setTimeout(() => this.stop(), 1400);
  }

  stop() {
    if (!this.nodes) {
      this.running = false;
      return;
    }
    const n = this.nodes;
    stopSource(n.sweep);
    stopSource(n.hum);
    stopSource(n.shimmer);
    this.nodes = null;
    this.running = false;
  }
}

/** Static field — original pink-noise engine. Starts only on engage (lazy). */
export class StaticFieldAudioAdapter {
  constructor() {
    this.engine = new SonicFieldEngine();
  }

  prime() {
    this.engine.prime();
  }

  /** First engage — build graph and ignite like site/js/engine.js */
  start() {
    if (!this.engine.master) {
      unlockAudioContext();
      this.engine.start(90_000);
    }
    this.engine.resume();
    this.engine.ignite();
  }

  pause() {
    this.engine.pause();
  }

  resume() {
    this.engine.resume();
    this.engine.ignite();
  }

  sync(elapsedMs) {
    const state = curveAtElapsed(elapsedMs / 1000);
    this.engine.sync(state, elapsedMs);
  }

  complete() {
    this.engine.complete();
  }

  stop() {
    this.engine.stop();
  }
}

const ENGINE_FACTORIES = {
  'instant-reset': () => new InstantResetAudioEngine(),
  'flash-freeze': () => new FlashFreezeAudioEngine(),
  'orienting-anchor': () => new OrientingAnchorAudioEngine(),
  'nova-gate': () => new NovaGateAudioEngine(),
  'coherence-ripple': () => new CoherenceRippleAudioEngine(),
  'vagal-downshift': () => new VagalDownshiftAudioEngine(),
  'static-field': () => new StaticFieldAudioAdapter(),
};

export function createSequenceAudioEngine(variantId) {
  const factory = ENGINE_FACTORIES[variantId];
  return factory ? factory() : null;
}

/*
 * The Sonic Brand.
 *
 * Starts as dense, overwhelming white noise (the internal roar of
 * dysregulation), then slowly carves out the high frequencies until all
 * that remains is a deep, warm, sub-bass pulse at 60 BPM.
 *
 * All scheduling is anchored to the AudioContext clock so the audio,
 * visual, and haptic channels stay phase-locked.
 */

import { SUB_BASS_HZ } from "./curve";

type WindowWithWebkit = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function createContext(): AudioContext | null {
  const Ctor =
    window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext;
  if (!Ctor) return null;
  return new Ctor();
}

function makeNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const seconds = 2;
  const length = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  private noise: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;

  private sub: OscillatorNode | null = null;
  private subGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;

  get isRunning(): boolean {
    return this.ctx !== null;
  }

  /** Build and start the full sonic journey. Must be called from a gesture. */
  start(durationMs: number): void {
    if (this.ctx) return;
    const ctx = createContext();
    if (!ctx) return;
    this.ctx = ctx;
    void ctx.resume();

    const now = ctx.currentTime;
    const end = now + durationMs / 1000;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.9, now + 0.4);
    master.connect(ctx.destination);
    this.master = master;

    // --- White noise: dense roar -> carved away ---
    const noise = ctx.createBufferSource();
    noise.buffer = makeNoiseBuffer(ctx);
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(16000, now);
    // Carve the high frequencies out over the whole session.
    filter.frequency.exponentialRampToValueAtTime(140, end);
    filter.Q.setValueAtTime(0.7, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.04, end);

    noise.connect(filter).connect(noiseGain).connect(master);
    noise.start(now);

    this.noise = noise;
    this.noiseGain = noiseGain;

    // --- Sub-bass heartbeat: emerges and dominates the tail ---
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(SUB_BASS_HZ, now);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.05, now);
    subGain.gain.linearRampToValueAtTime(0.6, end);

    // 60 BPM amplitude pulse via a 1Hz LFO modulating the sub gain.
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(1, now); // 60 BPM
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.045, now);
    lfoGain.gain.linearRampToValueAtTime(0.4, end);
    lfo.connect(lfoGain).connect(subGain.gain);

    sub.connect(subGain).connect(master);
    sub.start(now);
    lfo.start(now);

    this.sub = sub;
    this.subGain = subGain;
    this.lfo = lfo;
  }

  /** Dead-man's switch: duck the audio while the user is away. */
  pause(): void {
    if (!this.ctx || !this.master) return;
    void this.ctx.resume();
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
    this.master.gain.exponentialRampToValueAtTime(0.12, now + 0.3);
  }

  /** Return to the curve. */
  resume(): void {
    if (!this.ctx || !this.master) return;
    void this.ctx.resume();
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
    this.master.gain.exponentialRampToValueAtTime(0.9, now + 0.3);
  }

  /** Three final heartbeats, then fade to silence. */
  complete(): void {
    if (!this.ctx || !this.master || !this.noiseGain || !this.subGain) return;
    const now = this.ctx.currentTime;

    // Drop the noise entirely; let the sub-bass speak.
    this.noiseGain.gain.cancelScheduledValues(now);
    this.noiseGain.gain.setValueAtTime(Math.max(this.noiseGain.gain.value, 0.0001), now);
    this.noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    // Three deliberate pulses, one second apart.
    const sub = this.subGain.gain;
    sub.cancelScheduledValues(now);
    const base = 0.0001;
    for (let i = 0; i < 3; i++) {
      const t = now + i * 1;
      sub.setValueAtTime(base, t);
      sub.exponentialRampToValueAtTime(0.7, t + 0.18);
      sub.exponentialRampToValueAtTime(base, t + 0.9);
    }

    const fadeEnd = now + 3.4;
    this.master!.gain.cancelScheduledValues(now + 3);
    this.master!.gain.setValueAtTime(0.9, now + 3);
    this.master!.gain.exponentialRampToValueAtTime(0.0001, fadeEnd);
    window.setTimeout(() => this.stop(), 3600);
  }

  stop(): void {
    if (!this.ctx) return;
    try {
      this.noise?.stop();
      this.sub?.stop();
      this.lfo?.stop();
    } catch {
      // Already stopped.
    }
    void this.ctx.close();
    this.ctx = null;
    this.master = null;
    this.noise = null;
    this.noiseGain = null;
    this.sub = null;
    this.subGain = null;
    this.lfo = null;
  }
}

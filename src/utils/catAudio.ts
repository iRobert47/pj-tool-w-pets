/**
 * Web Audio API synthesizer for illustrated interactive cat sounds.
 * Generates cozy purring, cute meows, bell chimes, and munching sounds
 * without external audio file dependencies.
 */

class CatAudioManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private purrOsc: OscillatorNode | null = null;
  private purrGain: GainNode | null = null;
  private isPurring: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleSound(enabled?: boolean) {
    if (enabled !== undefined) {
      this.soundEnabled = enabled;
    } else {
      this.soundEnabled = !this.soundEnabled;
    }
    if (!this.soundEnabled) {
      this.stopPurr();
    }
    return this.soundEnabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Play a cute kitten meow using frequency modulation
   */
  public playMeow(tone: 'happy' | 'gentle' | 'curious' = 'happy') {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);

      osc.type = 'triangle';

      if (tone === 'happy') {
        // High playful meow: rises then falls
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(820, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.35);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (tone === 'gentle') {
        // Soft short chirp
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.22);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.start(now);
        osc.stop(now + 0.25);
      } else {
        // Curious mew
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.linearRampToValueAtTime(720, now + 0.18);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.32);
      }

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
    } catch {
      // audio error handled gracefully
    }
  }

  /**
   * Play sweet collar bell chime
   */
  public playBell() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      // Two metal chime harmonics
      [1800, 2400].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.36);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Start soft, cozy rhythmic cat purr (continuous while stroking)
   */
  public startPurr() {
    if (!this.soundEnabled || this.isPurring) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      // Low frequency rumble with AM modulation (approx 25Hz cat purr cycle)
      const carrier = ctx.createOscillator();
      const carrierGain = ctx.createGain();

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      carrier.type = 'sawtooth';
      carrier.frequency.setValueAtTime(55, now);

      // Low pass to make it soft and warm
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);

      // LFO for rhythmic purr vibrato (24 vibrations per second)
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(24, now);
      lfoGain.gain.setValueAtTime(0.05, now);

      carrierGain.gain.setValueAtTime(0.01, now);
      carrierGain.gain.linearRampToValueAtTime(0.07, now + 0.2);

      lfo.connect(carrierGain.gain);
      carrier.connect(filter);
      filter.connect(carrierGain);
      carrierGain.connect(ctx.destination);

      carrier.start(now);
      lfo.start(now);

      this.purrOsc = carrier;
      this.purrGain = carrierGain;
      this.isPurring = true;
    } catch {
      // ignore
    }
  }

  /**
   * Play temporary purr burst
   */
  public playPurr(durationMs: number = 1500) {
    this.startPurr();
    setTimeout(() => {
      this.stopPurr();
    }, durationMs);
  }

  /**
   * Stop purring sound smoothly
   */
  public stopPurr() {
    if (!this.isPurring || !this.purrGain || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.purrGain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
      setTimeout(() => {
        if (this.purrOsc) {
          try {
            this.purrOsc.stop();
            this.purrOsc.disconnect();
          } catch {
            // ignore
          }
        }
        this.purrOsc = null;
        this.purrGain = null;
        this.isPurring = false;
      }, 300);
    } catch {
      this.isPurring = false;
    }
  }

  /**
   * Play snack munching / crunch sound
   */
  public playMunch() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;

      // 3 tiny sequential crunches
      [0, 0.1, 0.22].forEach((offset) => {
        const now = ctx.currentTime + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280 + Math.random() * 80, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
      });
    } catch {
      // ignore
    }
  }
}

export const catAudio = new CatAudioManager();

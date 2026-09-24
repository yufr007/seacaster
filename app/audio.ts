/** Original procedural sound design. No downloads, trackers, samples or licence dependency. */
import { platformAtmosphere } from '../game/world';
import type { PlatformId } from '../game/world';
export type SoundSettings = { sound: boolean; ambience: number; effects: number };
export type SoundCue = 'cast' | 'splash' | 'hook' | 'catch' | 'lost' | 'wood' | 'unlock';
class OceanAudio {
  private context: AudioContext | null = null;
  private ambient: GainNode | null = null;
  private fx: GainNode | null = null;
  private sources: (AudioScheduledSourceNode)[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private settings: SoundSettings = { sound: false, ambience: .55, effects: .7 };
  private reel = false;
  private night = false;
  private platform: PlatformId = 'pier';
  private ticks = 0;
  configure(settings: SoundSettings) {
    this.settings = settings;
    if (!settings.sound) { void this.context?.suspend().catch(() => {}); return; }
    if (this.context && this.ambient && this.fx) {
      this.ambient.gain.setTargetAtTime(settings.ambience * .12 * platformAtmosphere(this.platform).water, this.context.currentTime, .15);
      this.fx.gain.setTargetAtTime(settings.effects * .2, this.context.currentTime, .03);
    }
  }
  /** Must be called by a real player gesture; no audible autoplay. */
  unlock() {
    if (!this.settings.sound) return;
    try {
      if (!this.context) {
        const Constructor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Constructor) return;
        const context = new Constructor(); this.context = context;
        const compressor = context.createDynamicsCompressor(); compressor.threshold.value = -14; compressor.ratio.value = 4; compressor.connect(context.destination);
        this.fx = context.createGain(); this.fx.connect(compressor);
        this.ambient = context.createGain(); this.ambient.connect(compressor);
        const noise = context.createBufferSource(); noise.buffer = this.noise(4); noise.loop = true;
        const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 600; filter.Q.value = .45;
        const tide = context.createGain(); tide.gain.value = .38;
        const swell = context.createOscillator(), swellDepth = context.createGain(); swell.frequency.value = .16; swellDepth.gain.value = .22;
        swell.connect(swellDepth); swellDepth.connect(tide.gain);
        noise.connect(filter); filter.connect(tide); tide.connect(this.ambient); noise.start(); swell.start(); this.sources.push(noise, swell);
        // Sparse events, no continuous bird chatter or duplicate reel loops.
        this.timer = setInterval(() => {
          if (!this.context || this.context.state !== 'running') return;
          this.ticks++;
          if (this.reel) this.tone(260 + (this.ticks % 3) * 70, .025, .16, 'triangle');
          if (this.ticks % 145 === 0 && !this.night && this.settings.ambience > 0) this.gull();
          const cadence = Math.max(120, Math.round(220 / platformAtmosphere(this.platform).ambientRate));
          if (this.ticks % cadence === 0 && this.settings.ambience > 0) this.berthTexture();
        }, 120);
        this.configure(this.settings);
      }
      if (!document.hidden) void this.context.resume().catch(() => {});
    } catch { /* Audio is optional, never block a cast. */ }
  }
  environment(night: boolean, platform: PlatformId) { this.night = night; this.platform = platform; this.configure(this.settings); }
  reeling(value: boolean) { this.reel = value; }
  suspend() { this.reel = false; void this.context?.suspend().catch(() => {}); }
  private noise(seconds: number) {
    const c = this.context!, buffer = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate), data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < data.length; i++) { brown = (brown + (Math.random() * 2 - 1) * .02) / 1.02; data[i] = brown * 3.5 + (Math.random() * 2 - 1) * .1; }
    return buffer;
  }
  private tone(frequency: number, duration: number, volume: number, shape: OscillatorType = 'sine', delay = 0, end = frequency, bus = this.fx) {
    const c = this.context; if (!c || !bus || c.state !== 'running') return;
    const o = c.createOscillator(), gain = c.createGain(), t = c.currentTime + delay;
    o.type = shape; o.frequency.setValueAtTime(frequency, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + duration);
    gain.gain.setValueAtTime(.0001, t); gain.gain.exponentialRampToValueAtTime(Math.max(.001, volume), t + .009); gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    o.connect(gain); gain.connect(bus); o.start(t); o.stop(t + duration + .02); o.onended = () => { o.disconnect(); gain.disconnect(); };
  }
  private burst(duration: number, frequency: number, volume: number, bus = this.fx) {
    const c = this.context; if (!c || !bus || c.state !== 'running') return;
    const source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
    source.buffer = this.noise(duration); filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = .4;
    gain.gain.setValueAtTime(volume, c.currentTime); gain.gain.exponentialRampToValueAtTime(.0001, c.currentTime + duration);
    source.connect(filter); filter.connect(gain); gain.connect(bus); source.start(); source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
  private gull() {
    if (this.platform === 'river') { this.tone(2300, .13, .18, 'sine', 0, 3100, this.ambient); this.tone(2600, .15, .16, 'sine', .22, 3300, this.ambient); }
    else { this.tone(1050, .35, .22, 'sine', 0, 650, this.ambient); this.tone(1150, .3, .18, 'sine', .42, 750, this.ambient); }
  }
  private berthTexture() {
    if (this.platform === 'river') {
      const base = this.night ? 1700 : 2350; this.tone(base, .09, .055, 'sine', 0, base * 1.16, this.ambient); this.tone(base * 1.08, .08, .04, 'sine', .16, base * 1.25, this.ambient);
    } else if (this.platform === 'boat') {
      this.burst(.09, 320, .05, this.ambient); this.tone(145, .1, .045, 'triangle', .02, 112, this.ambient);
    } else if (this.platform === 'yacht') {
      this.tone(760, .08, .035, 'triangle', 0, 610, this.ambient); this.tone(1180, .06, .025, 'sine', .06, 900, this.ambient);
    } else {
      this.burst(.07, 410, .045, this.ambient); this.tone(180, .08, .035, 'triangle', 0, 135, this.ambient);
    }
  }
  cue(cue: SoundCue) {
    if (!this.settings.sound || this.context?.state !== 'running') return;
    if (cue === 'cast') { this.burst(.35, 1800, .65); this.tone(500, .28, .18, 'sine', 0, 160); }
    else if (cue === 'splash') { this.burst(.55, 700, .85); this.tone(240, .2, .65, 'sine', 0, 65); }
    else if (cue === 'hook') { this.tone(900, .12, .45, 'triangle'); this.tone(1300, .13, .4, 'sine', .08); }
    else if (cue === 'wood') { this.burst(.05, 420, .6); this.tone(240, .06, .25, 'triangle', 0, 180); }
    else if (cue === 'lost') this.tone(350, .25, .22, 'sine', 0, 140);
    else [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .3, .32, 'sine', i * .09));
  }
  dispose() {
    if (this.timer) clearInterval(this.timer); this.timer = null;
    this.sources.forEach(source => { try { source.stop(); source.disconnect(); } catch { /* already ended */ } }); this.sources = [];
    void this.context?.close().catch(() => {}); this.context = null; this.ambient = null; this.fx = null;
  }
}
export const oceanAudio = new OceanAudio();

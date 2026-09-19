export class AudioSystem {
  constructor() {
    this.context = null;
    this.muted = false;
    this.voices = 0;
    this.lastShot = 0;
    this.beat = 0;
    this.music = false;
  }
  unlock() {
    this.context ||= new (window.AudioContext || window.webkitAudioContext)();
    this.context.resume();
  }
  tone(freq, duration, type = "sine", volume = 0.05, end = 40) {
    if (!this.context || this.muted || this.voices > 18) return;
    const ctx = this.context,
      osc = ctx.createOscillator(),
      gain = ctx.createGain(),
      now = ctx.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(15, end),
      now + duration,
    );
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + duration);
    this.voices++;
    osc.onended = () => {
      this.voices--;
      osc.disconnect();
      gain.disconnect();
    };
  }
  play(event) {
    if (event.type === "supportShot")
      this.tone(260, 0.045, "triangle", 0.018, 110);
    if (event.type === "seekers") this.tone(340, 0.12, "triangle", 0.024, 100);
    if (event.type === "nova") this.tone(150, 0.18, "sine", 0.04, 55);
    if (event.type === "shot") this.tone(180, 0.045, "sawtooth", 0.027, 55);
    if (event.type === "death") this.tone(110, 0.055, "triangle", 0.019, 40);
    if (event.type === "explosion" || event.type === "nuke") {
      this.tone(75, 0.32, "sawtooth", 0.065, 18);
      this.tone(140, 0.14, "triangle", 0.045, 30);
    }
    if (event.type === "hurt") this.tone(240, 0.16, "square", 0.035, 80);
    if (event.type === "pickup" || event.type === "waveComplete") {
      this.tone(420, 0.2, "sine", 0.08, 840);
    }
    if (event.type === "mortar") this.tone(220, 0.2, "triangle", 0.08, 55);
    if (event.type === "wave") this.tone(110, 0.3, "triangle", 0.05, 220);
    if (event.type === "gameover") this.tone(200, 0.8, "sawtooth", 0.06, 20);
  }
  update(dt, intensity, active) {
    if (!this.music || !active) return;
    this.beat -= dt;
    if (this.beat <= 0) {
      this.beat = 0.3;
      this.tone(55, 0.15, "sine", 0.035, 38);
      if (intensity > 20) this.tone(1500, 0.025, "triangle", 0.009, 500);
    }
  }
}

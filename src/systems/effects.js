export class EffectsSystem {
  constructor() {
    this.particles = [];
    this.rings = [];
    this.shake = 0;
    this.flash = 0;
  }
  burst(x, y, count, color, speed = 110) {
    for (let i = 0; i < count && this.particles.length < 750; i++) {
      const a = Math.random() * Math.PI * 2,
        v = speed * (0.3 + Math.random());
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.25 + Math.random() * 0.45,
        max: 0.7,
        size: 1 + Math.random() * 3,
        color,
      });
    }
  }
  event(e) {
    if (e.type === "supportShot") this.burst(e.x, e.y, 3, "#629e83", 80);
    if (e.type === "nova")
      this.rings.push({
        x: 0,
        y: 0,
        r: 110,
        life: 0.3,
        max: 0.3,
        color: "#739d84",
      });
    if (e.type === "ricochet") this.burst(e.x, e.y, 6, "#398899", 120);
    if (e.type === "hit") this.burst(e.x, e.y, 3, "#243c50", 80);
    if (e.type === "death") this.burst(e.x, e.y, 12, "#253e54", 130);
    if (e.type === "shot") {
      this.shake = Math.max(this.shake, 0.65);
      this.burst(
        Math.cos(e.angle) * 44,
        Math.sin(e.angle) * 44,
        2,
        "#df8939",
        100,
      );
    }
    if (e.type === "explosion" || e.type === "nuke") {
      this.shake = Math.max(
        this.shake,
        e.kind === "ammo" || e.kind === "seeker" ? 1.3 : 8,
      );
      this.rings.push({
        x: e.x,
        y: e.y,
        r: e.radius,
        life: 0.5,
        max: 0.5,
        color: e.kind === "pulse" ? "#749c91" : "#d76a3a",
      });
      this.burst(
        e.x,
        e.y,
        e.kind === "ammo" || e.kind === "seeker" ? 5 : 50,
        "#c65b34",
        e.radius * 1.6,
      );
      if (e.type === "nuke") {
        this.flash = 0.25;
        this.shake = 18;
      }
    }
    if (e.type === "hurt") this.shake = 11;
  }
  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 24);
    this.flash = Math.max(0, this.flash - dt);
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-dt * 6);
      p.vy *= Math.exp(-dt * 6);
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const r of this.rings) r.life -= dt;
    this.rings = this.rings.filter((r) => r.life > 0);
  }
  reset() {
    this.particles = [];
    this.rings = [];
    this.shake = 0;
    this.flash = 0;
  }
}

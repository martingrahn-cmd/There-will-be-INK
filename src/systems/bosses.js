export const BOSS_WAVES = {
  3: {
    name: "THE RED PEN",
    taunt: "CUTE TOWERS. SHAME ABOUT THE AIM.",
    health: 1800,
    shots: 3,
    damage: 7,
    reward: 15,
    at: 14,
  },
  5: {
    name: "THE EDITOR",
    taunt: "YOUR DEFENSE? REJECTED.",
    health: 5200,
    shots: 5,
    damage: 9,
    reward: 30,
    at: 10,
  },
};
export class BossSystem {
  constructor() {
    this.announcedWaves = new Set();
    this.spawnedWaves = new Set();
  }
  update(g) {
    const spec = BOSS_WAVES[g.wave.number];
    if (!g.defense || !spec || this.spawnedWaves.has(g.wave.number)) return;
    if (
      g.wave.elapsed >= spec.at - 3 &&
      !this.announcedWaves.has(g.wave.number)
    ) {
      this.announcedWaves.add(g.wave.number);
      g.emit("bossIncoming", { name: spec.name, taunt: spec.taunt });
    }
    if (g.wave.elapsed < spec.at || g.enemies.items.length >= 450) return;
    this.spawnedWaves.add(g.wave.number);
    // Enter from the top edge so the arrival is visible on wide arenas too.
    const x = (g.rng() - 0.5) * Math.min(400, g.bounds.x),
      y = g.bounds.y + 45;
    g.enemies.items.push({
      ...spec,
      boss: true,
      type: "boss",
      id: ++g.enemies.nextId,
      x,
      y,
      maxHealth: spec.health,
      speed: 26,
      radius: 44,
      score: g.wave.number === 5 ? 1500 : 750,
      age: 0,
      hit: 0,
      elite: false,
      phase: "advance",
      timer: 0,
      enraged: false,
      volleyLeft: 0,
    });
    g.emit("bossArrived", { name: spec.name, taunt: spec.taunt, x, y });
  }
  move(e, dt, g) {
    const distance = Math.hypot(e.x, e.y) || 1;
    if (!e.enraged && e.health <= e.maxHealth / 2) {
      e.enraged = true;
      g.emit("bossRage", { name: e.name, x: e.x, y: e.y });
    }
    if (distance > 236) {
      const step = Math.min(
        distance - 235,
        e.speed * Math.max(0.65, e.slow ?? 1) * dt,
      );
      e.x -= (e.x / distance) * step;
      e.y -= (e.y / distance) * step;
      return;
    }
    if (e.phase === "advance") {
      e.phase = "windup";
      e.timer = 1.8;
    }
    e.timer -= dt;
    if (e.timer > 0) return;
    if (e.phase === "windup") {
      e.phase = "volley";
      e.volleyLeft = e.shots + (e.enraged ? 2 : 0);
    }
    if (e.phase === "volley") {
      if (g.enemyBullets.length < 250) {
        g.enemyBullets.push({
          x: e.x,
          y: e.y,
          vx: (-e.x / distance) * 190,
          vy: (-e.y / distance) * 190,
          life: 4,
          damage: e.damage,
          boss: true,
        });
        g.emit("enemyShot", { x: e.x, y: e.y });
      }
      e.volleyLeft--;
      e.timer = 0.22;
      if (e.volleyLeft === 0) {
        e.phase = "recovery";
        e.timer = e.enraged ? 2.2 : 3.2;
      }
    } else if (e.phase === "recovery") {
      e.phase = "windup";
      e.timer = e.enraged ? 1.3 : 1.8;
    }
  }
}

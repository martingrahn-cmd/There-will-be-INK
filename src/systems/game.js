import { DefenseSystem } from "./defense.js";
import { UpgradeSystem } from "./upgrades.js";
import { POWERUPS } from "./powerup-types.js";
export const WAVE_DURATION = 45;
export const ENEMY_TYPES = {
  exploder: { health: 28, speed: 40, radius: 18, damage: 6, score: 25 },
  swarmer: { health: 19, speed: 44, radius: 12, damage: 5, score: 10 },
  brute: { health: 125, speed: 23, radius: 24, damage: 16, score: 45 },
  charger: { health: 34, speed: 43, radius: 15, damage: 10, score: 25 },
  shooter: { health: 40, speed: 32, radius: 16, damage: 7, score: 30 },
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export class ScoreSystem {
  constructor() {
    this.value = 0;
    this.kills = 0;
    this.streak = 0;
    this.timer = 0;
    this.best = 1;
  }
  get multiplier() {
    return Math.min(16, 2 ** Math.floor(this.streak / 10));
  }
  kill(points) {
    this.streak++;
    this.timer = 2.8;
    this.kills++;
    this.value += points * this.multiplier;
    this.best = Math.max(this.best, this.multiplier);
  }
  update(dt) {
    this.timer -= dt;
    if (this.timer <= 0) this.streak = 0;
  }
}
export class WaveSystem {
  constructor() {
    this.number = 0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.duration = WAVE_DURATION;
  }
  next() {
    this.number++;
    this.elapsed = 0;
    this.spawnTimer = 0.8;
  }
  get spawning() {
    return this.elapsed < this.duration;
  }
  update(dt, game) {
    this.elapsed += dt;
    this.spawnTimer -= dt;
    if (this.spawning && this.spawnTimer <= 0) {
      this.spawnTimer =
        1 / (1.8 + this.number * 0.55 + Math.min(this.elapsed, 40) * 0.022);
      const batch = this.number >= 6 ? 2 : 1;
      for (let i = 0; i < batch; i++) {
        const r = game.rng();
        const shooterChance =
          this.number === 3 ? 0.04 : this.number === 4 ? 0.08 : 0.12;
        const shooterCap = Math.min(8, Math.max(2, this.number - 1));
        const shooters = game.enemies.items.filter(
          (e) => e.type === "shooter" && e.health > 0,
        ).length;
        let type =
          this.number >= 3 && r < 0.12
            ? r < shooterChance &&
              shooters < shooterCap &&
              (this.number !== 3 || this.elapsed >= 8)
              ? "shooter"
              : "swarmer"
            : this.number >= 2 && r < 0.26
              ? "brute"
              : r < (this.number === 1 ? 0.25 : 0.45)
                ? "charger"
                : "swarmer";
        if (type === "swarmer" && r >= 0.9 && r < 0.98 && this.elapsed >= 6)
          type = "exploder";
        game.spawnEnemy(type);
      }
    }
  }
}
export class EnemySystem {
  constructor() {
    this.items = [];
    this.grid = new Map();
    this.nextId = 0;
  }
  rebuild() {
    this.grid.clear();
    for (const e of this.items)
      if (e.health > 0) {
        const key = `${Math.floor(e.x / 70)},${Math.floor(e.y / 70)}`;
        if (!this.grid.has(key)) this.grid.set(key, []);
        this.grid.get(key).push(e);
      }
  }
  near(x, y, r) {
    const out = [];
    for (let a = Math.floor((x - r) / 70); a <= Math.floor((x + r) / 70); a++)
      for (
        let b = Math.floor((y - r) / 70);
        b <= Math.floor((y + r) / 70);
        b++
      ) {
        const cell = this.grid.get(`${a},${b}`);
        if (cell) out.push(...cell);
      }
    return out;
  }
  update(dt, g) {
    for (const e of this.items) {
      if (e.health <= 0) continue;
      e.hit = Math.max(0, e.hit - dt);
      e.age += dt;
      if (g.buffs.freeze > 0) continue;
      const d = Math.hypot(e.x, e.y),
        ax = -e.x / d,
        ay = -e.y / d;
      let nx = ax,
        ny = ay;
      let speed = e.speed;
      if (e.type === "charger") {
        if (e.phase === "walk" && d < 265) {
          e.phase = "tell";
          e.timer = 0.9;
          g.emit("warning", { x: e.x, y: e.y });
        }
        if (e.phase === "tell") {
          speed = 0;
          e.timer -= dt;
          if (e.timer <= 0) {
            e.phase = "dash";
            e.dx = ax;
            e.dy = ay;
            e.timer = 1.25;
          }
        }
        if (e.phase === "dash") {
          e.timer -= dt;
          if (g.defense) speed = 160;
          else {
            e.x += e.dx * 230 * dt;
            e.y += e.dy * 230 * dt;
            speed = 0;
          }
          if (e.timer <= 0) e.phase = "walk";
        }
      }
      if (e.type === "shooter" && d < 300) {
        speed = 0;
        e.timer -= dt;
        if (e.timer <= 0) {
          e.timer = e.shotInterval;
          e.hasFired = true;
          if (g.enemyBullets.length < 250)
            g.enemyBullets.push({
              x: e.x,
              y: e.y,
              vx: ax * e.shotSpeed,
              vy: ay * e.shotSpeed,
              life: 4,
              damage: e.shotDamage,
            });
          g.emit("enemyShot", { x: e.x, y: e.y });
        }
      }
      e.x += nx * speed * (e.slow ?? 1) * dt;
      e.y += ny * speed * (e.slow ?? 1) * dt;
      if (Math.hypot(e.x, e.y) < e.radius + 25) {
        g.hurt(e.damage);
        e.health = 0;
        g.emit("breach", { x: e.x, y: e.y });
      }
    }
    this.items = this.items.filter((e) => e.health > 0);
    this.rebuild();
  }
}
export class WeaponSystem {
  constructor() {
    this.bullets = [];
    this.pool = [];
    this.timer = 0;
    this.mortarTimer = 0;
    this.pulseTimer = 0;
    this.shells = [];
    this.sentryTimer = 0;
    this.seekerTimer = 0;
    this.novaTimer = 0;
    this.sentry = { x: 85, y: 0, angle: 0 };
  }
  bullet(data) {
    if (this.bullets.length >= 900) return;
    const b = this.pool.pop() || {};
    Object.assign(
      b,
      {
        life: 1.45,
        pierce: 0,
        ricochet: 0,
        fragment: false,
        homing: false,
        support: false,
        target: null,
        hit: new Set(),
      },
      data,
    );
    this.bullets.push(b);
  }
  fire(g) {
    const s = g.stats,
      angle = Math.atan2(g.aim.y, g.aim.x),
      buff = g.buffs.quad > 0 ? 4 : 1;
    for (let i = 0; i < s.barrels; i++) {
      const a =
        angle + (g.rng() - 0.5) * s.spread + (i - (s.barrels - 1) / 2) * 0.07;
      this.bullet({
        x: Math.cos(a) * 43,
        y: Math.sin(a) * 43,
        vx: Math.cos(a) * 850,
        vy: Math.sin(a) * 850,
        damage: s.damage * buff,
        pierce: s.pierce,
        ricochet: s.ricochet,
      });
    }
    g.emit("shot", { angle });
  }
  mortar(g) {
    if (this.mortarTimer > 0) return;
    this.mortarTimer = g.stats.mortarCooldown;
    const d = Math.hypot(g.aim.x, g.aim.y) || 1,
      reach = Math.min(480, d);
    this.shells.push({
      x: (g.aim.x / d) * reach,
      y: (g.aim.y / d) * reach,
      life: 0.55,
      total: 0.55,
    });
    g.emit("mortar");
  }
  pulse(g) {
    if (this.pulseTimer > 0) return;
    this.pulseTimer = g.stats.pulseCooldown;
    g.explode(0, 0, 260 * g.stats.blastRadius, g.stats.pulseDamage, "pulse");
    g.enemyBullets = g.enemyBullets.filter(
      (b) => Math.hypot(b.x, b.y) > 260 * g.stats.blastRadius,
    );
  }
  nearest(g, x, y, hit = new Set()) {
    let target = null,
      distance = Infinity;
    for (const e of g.enemies.items) {
      if (e.health <= 0 || hit.has(e.id)) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < distance) {
        distance = d;
        target = e;
      }
    }
    return target;
  }
  support(dt, g) {
    this.sentry.x = Math.cos(g.time * 0.65) * 85;
    this.sentry.y = Math.sin(g.time * 0.65) * 85;
    this.sentryTimer = Math.max(0, this.sentryTimer - dt);
    this.seekerTimer = Math.max(0, this.seekerTimer - dt);
    this.novaTimer = Math.max(0, this.novaTimer - dt);
    const target = this.nearest(g, this.sentry.x, this.sentry.y);
    const damageBoost = g.buffs.quad > 0 ? 4 : 1;
    if (target && g.buffs.sentry > 0) {
      const a = Math.atan2(target.y - this.sentry.y, target.x - this.sentry.x);
      this.sentry.angle = a;
      if (this.sentryTimer <= 0) {
        this.sentryTimer = g.buffs.overdrive > 0 ? 0.075 : 0.15;
        this.bullet({
          x: this.sentry.x + Math.cos(a) * 22,
          y: this.sentry.y + Math.sin(a) * 22,
          vx: Math.cos(a) * 750,
          vy: Math.sin(a) * 750,
          damage: g.stats.damage * 1.2 * damageBoost,
          support: true,
          pierce: g.stats.pierce,
        });
        g.emit("supportShot", { x: this.sentry.x, y: this.sentry.y });
      }
    }
    if (target && g.buffs.homing > 0 && this.seekerTimer <= 0) {
      this.seekerTimer = 0.8;
      const a = Math.atan2(target.y, target.x);
      for (let i = -1; i <= 1; i++)
        this.bullet({
          x: Math.cos(a + i * 0.7) * 48,
          y: Math.sin(a + i * 0.7) * 48,
          vx: Math.cos(a + i * 0.7) * 360,
          vy: Math.sin(a + i * 0.7) * 360,
          damage: g.stats.damage * 2 * damageBoost,
          homing: true,
          support: true,
          target,
          life: 3,
        });
      g.emit("seekers");
    }
    if (g.buffs.nova > 0 && this.novaTimer <= 0) {
      this.novaTimer = 1;
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI * 2) / 16 + g.time * 0.4;
        this.bullet({
          x: Math.cos(a) * 50,
          y: Math.sin(a) * 50,
          vx: Math.cos(a) * 520,
          vy: Math.sin(a) * 520,
          damage: g.stats.damage * 1.5 * damageBoost,
          pierce: 1,
          support: true,
        });
      }
      g.emit("nova");
    }
  }
  update(dt, g, input) {
    this.timer = Math.max(-0.05, this.timer - dt);
    this.mortarTimer = Math.max(0, this.mortarTimer - dt);
    this.pulseTimer = Math.max(0, this.pulseTimer - dt);
    if (input.fire && this.timer <= 0) {
      this.fire(g);
      this.timer += 1 / (g.stats.fireRate * (g.buffs.overdrive > 0 ? 2 : 1));
    }
    if (input.secondary) this.mortar(g);
    if (input.pulse) this.pulse(g);
    this.support(dt, g);
    for (const shell of this.shells) {
      shell.life -= dt;
      if (shell.life <= 0) {
        g.explode(shell.x, shell.y, 105 * g.stats.blastRadius, 110, "mortar");
        if (g.stats.cluster)
          for (let i = 0; i < 3; i++) {
            const a = (i * Math.PI * 2) / 3;
            g.explode(
              shell.x + Math.cos(a) * 90,
              shell.y + Math.sin(a) * 90,
              65 * g.stats.blastRadius,
              70,
              "cluster",
            );
          }
      }
    }
    this.shells = this.shells.filter((s) => s.life > 0);
    for (const b of this.bullets) {
      b.life -= dt;
      if (b.homing) {
        if (!b.target || b.target.health <= 0)
          b.target = this.nearest(g, b.x, b.y, b.hit);
        if (b.target) {
          const current = Math.atan2(b.vy, b.vx),
            desired = Math.atan2(b.target.y - b.y, b.target.x - b.x);
          const turn = Math.atan2(
            Math.sin(desired - current),
            Math.cos(desired - current),
          );
          const a = current + clamp(turn, -7 * dt, 7 * dt);
          b.vx = Math.cos(a) * 360;
          b.vy = Math.sin(a) * 360;
        }
      }
      const ox = b.x,
        oy = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const mx = (ox + b.x) / 2,
        my = (oy + b.y) / 2,
        travel = Math.hypot(b.x - ox, b.y - oy);
      for (const p of g.powerups.items)
        if (!b.support && p.life > 0 && Math.hypot(b.x - p.x, b.y - p.y) < 26) {
          g.powerups.activate(p, g);
          b.life = 0;
          break;
        }
      if (b.life <= 0) continue;
      for (const e of g.enemies.near(mx, my, travel / 2 + 30)) {
        if (e.health <= 0 || b.hit.has(e.id)) continue;
        const dx = b.x - ox,
          dy = b.y - oy,
          t = clamp(
            ((e.x - ox) * dx + (e.y - oy) * dy) / (dx * dx + dy * dy || 1),
            0,
            1,
          );
        if (Math.hypot(e.x - ox - dx * t, e.y - oy - dy * t) > e.radius + 3)
          continue;
        b.hit.add(e.id);
        g.damage(e, b.damage, 0, !b.support);
        if (b.homing) {
          g.explode(
            e.x,
            e.y,
            45 * g.stats.blastRadius,
            b.damage * 0.6,
            "seeker",
          );
          b.life = 0;
          break;
        }
        const len = Math.hypot(b.vx, b.vy) || 1;
        e.x += (b.vx / len) * g.stats.knockback;
        e.y += (b.vy / len) * g.stats.knockback;
        if (g.stats.explosive && !b.fragment)
          g.explode(
            e.x,
            e.y,
            (44 + g.stats.explosive * 12) * g.stats.blastRadius,
            b.damage * 0.8,
            "ammo",
          );
        if (b.pierce > 0) {
          b.pierce--;
          continue;
        }
        if (b.ricochet > 0) {
          const target = g.enemies
            .near(e.x, e.y, 240)
            .filter((x) => x.health > 0 && !b.hit.has(x.id))
            .sort(
              (a, c) =>
                Math.hypot(a.x - e.x, a.y - e.y) -
                Math.hypot(c.x - e.x, c.y - e.y),
            )[0];
          if (target) {
            const a = Math.atan2(target.y - b.y, target.x - b.x);
            b.vx = Math.cos(a) * 850;
            b.vy = Math.sin(a) * 850;
            b.ricochet--;
            g.emit("ricochet", { x: b.x, y: b.y });
            break;
          }
        }
        b.life = 0;
        break;
      }
    }
    const alive = [];
    for (const b of this.bullets)
      if (b.life > 0) alive.push(b);
      else this.pool.push(b);
    this.bullets = alive;
  }
}
export class PowerupSystem {
  constructor() {
    this.items = [];
    this.nextDrop = null;
    this.handoffLead = 1;
    this.bag = [];
    this.first = true;
    this.lastType = null;
  }
  nextType(g) {
    // Introduce one of the new toys immediately, then cycle the whole pool.
    if (this.first) {
      this.first = false;
      return g.rng() < 0.5 ? "sentry" : "homing";
    }
    if (!this.bag.length) {
      this.bag = Object.keys(POWERUPS).filter(
        (type) => type !== "repair" || g.health < g.stats.maxHealth - 15,
      );
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(g.rng() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
      if (this.bag.at(-1) === this.lastType)
        [this.bag[0], this.bag[this.bag.length - 1]] = [
          this.bag.at(-1),
          this.bag[0],
        ];
    }
    return this.bag.pop();
  }
  update(dt, g) {
    if (this.nextDrop === null) this.nextDrop = 2 + g.rng() * 2;
    this.nextDrop = Math.max(0, this.nextDrop - dt);
    for (const p of this.items) p.life -= dt;
    this.items = this.items.filter((p) => p.life > 0);
    const remaining = Math.max(0, ...Object.values(g.buffs));
    // Offer the next pickup a little before expiration, with a varied lead time, allowing a seamless handoff.
    if (
      !this.items.length &&
      this.nextDrop <= 0 &&
      remaining <= this.handoffLead
    ) {
      const a = g.rng() * Math.PI * 2,
        r = 130 + g.rng() * 100;
      const type = this.nextType(g);
      this.lastType = type;
      this.items.push({
        x: clamp(Math.cos(a) * r, -g.bounds.x + 35, g.bounds.x - 35),
        y: clamp(Math.sin(a) * r, -g.bounds.y + 35, g.bounds.y - 35),
        type,
        life: 11,
      });
      g.emit("drop", { name: POWERUPS[type].name });
    }
  }
  activate(p, g) {
    if (p.life <= 0 || !POWERUPS[p.type]) return;
    p.life = 0;
    this.nextDrop = 0.5 + g.rng() * 1.1;
    this.handoffLead = 0.25 + g.rng() * 1.25;
    if (p.type === "repair")
      g.health = Math.min(g.stats.maxHealth, g.health + 35);
    else if (p.type === "nuke") {
      for (const e of [...g.enemies.items]) g.damage(e, 99999);
      g.enemyBullets = [];
      g.emit("nuke", { x: 0, y: 0, radius: 900 });
    } else g.buffs[p.type] = POWERUPS[p.type].duration;
    g.emit("pickup", {
      name: POWERUPS[p.type].name,
      description: POWERUPS[p.type].description,
    });
  }
}
export class CombatSystem {
  constructor({ rng = Math.random, mode = "survival" } = {}) {
    this.mode = mode;
    this.rng = rng;
    this.reset();
  }
  reset() {
    this.stats = {
      maxHealth: 100,
      damage: 14,
      fireRate: 10,
      spread: 0.035,
      pierce: 0,
      ricochet: 0,
      explosive: 0,
      barrels: 1,
      knockback: 3,
      shrapnel: false,
      pulseCooldown: 22,
      pulseDamage: 100,
      mortarCooldown: 4.5,
      blastRadius: 1,
      cluster: false,
    };
    this.defense = this.mode === "defense" ? new DefenseSystem() : null;
    this.pendingBlasts = [];
    this.health = 100;
    this.state = "menu";
    this.time = 0;
    this.aim = { x: 200, y: 0 };
    this.events = [];
    this.enemies = new EnemySystem();
    this.weapons = new WeaponSystem();
    this.wave = new WaveSystem();
    this.score = new ScoreSystem();
    this.upgrades = new UpgradeSystem(this.rng);
    this.powerups = new PowerupSystem();
    this.buffs = Object.fromEntries(
      Object.entries(POWERUPS)
        .filter(([, p]) => p.duration > 0)
        .map(([type]) => [type, 0]),
    );
    this.enemyBullets = [];
    this.choices = [];
    this.damageFlash = 0;
    this.bounds = { x: 610, y: 360 };
    if (this.defense) {
      this.wave.duration = 35;
      this.defense.layout(this.bounds);
    }
  }
  start() {
    this.reset();
    if (this.defense) {
      this.state = "ready";
      this.defense.open(this);
    } else {
      this.state = "playing";
      this.wave.next();
      this.emit("wave", { number: 1 });
    }
  }
  emit(type, data = {}) {
    if (this.events.length < 1400) this.events.push({ type, ...data });
  }
  spawnEnemy(type) {
    if (this.enemies.items.length >= 450) return;
    const companion =
      type === "exploder"
        ? this.enemies.items.findLast(
            (e) => e.health > 0 && Math.hypot(e.x, e.y) > 230,
          )
        : null;
    const base = ENEMY_TYPES[type],
      a = companion
        ? Math.atan2(companion.y, companion.x) + (this.rng() - 0.5) * 0.2
        : this.rng() * Math.PI * 2,
      scale =
        Math.min(
          this.bounds.x / Math.max(0.001, Math.abs(Math.cos(a))),
          this.bounds.y / Math.max(0.001, Math.abs(Math.sin(a))),
        ) + 25;
    const elite = this.wave.number >= 4 && this.rng() < 0.08;
    this.enemies.items.push({
      ...base,
      id: ++this.enemies.nextId,
      type,
      x: Math.cos(a) * scale,
      y: Math.sin(a) * scale,
      health:
        base.health * (1 + (this.wave.number - 1) * 0.12) * (elite ? 2 : 1),
      maxHealth:
        base.health * (1 + (this.wave.number - 1) * 0.12) * (elite ? 2 : 1),
      speed: base.speed * (1 + Math.min(0.5, this.wave.number * 0.018)),
      radius: base.radius * (elite ? 1.25 : 1),
      elite,
      age: 0,
      hit: 0,
      phase: "walk",
      timer: type === "shooter" ? 2.5 + this.rng() : 1 + this.rng(),
      shotInterval: Math.max(
        2.8,
        4.5 - Math.max(0, this.wave.number - 3) * 0.6,
      ),
      shotSpeed: Math.min(150, 110 + Math.max(0, this.wave.number - 3) * 15),
      shotDamage: Math.min(7, 4 + Math.max(0, this.wave.number - 3)),
    });
  }

  damage(e, amount, chainDepth = 0, player = true) {
    if (e.health <= 0) return;
    e.health -= amount;
    e.hit = 0.08;
    this.emit("hit", { x: e.x, y: e.y });
    if (e.health <= 0) {
      this.score.kill(e.score);
      if (this.defense) {
        this.defense.reward(3, "KILL");
        if (player && e.type === "charger" && e.phase === "tell")
          this.defense.reward(15, "CHARGE STOPPED", true);
        if (player && e.type === "shooter" && !e.hasFired)
          this.defense.reward(20, "SILENCED", true);
        if (player && chainDepth > 0)
          this.defense.reward(10, "CHAIN KILL", true);
      }
      this.emit("death", {
        x: e.x,
        y: e.y,
        radius: e.radius,
        enemyType: e.type,
      });
      if (e.type === "exploder") {
        this.pendingBlasts.push({
          x: e.x,
          y: e.y,
          delay: 0.14,
          depth: chainDepth + 1,
          player,
        });
        if (chainDepth > 0) {
          const bonus = 50 * Math.min(chainDepth + 1, 10);
          this.score.value += bonus;
          this.emit("chain", { depth: chainDepth + 1, bonus });
        }
      }
      if (
        this.score.streak === 20 ||
        this.score.streak === 40 ||
        this.score.streak === 80
      )
        this.emit("combo", {
          name:
            this.score.streak === 20
              ? "MASSACRE"
              : this.score.streak === 40
                ? "ANNIHILATION"
                : "INK-CREDIBLE",
        });
      if (this.stats.shrapnel)
        for (let i = 0; i < 4; i++) {
          const a = this.rng() * Math.PI * 2;
          this.weapons.bullet({
            x: e.x,
            y: e.y,
            vx: Math.cos(a) * 460,
            vy: Math.sin(a) * 460,
            damage: 9,
            life: 0.45,
            fragment: true,
            pierce: 0,
            ricochet: 0,
          });
        }
    }
  }
  explode(x, y, radius, damage, kind, chainDepth = 0, player = true) {
    for (const e of this.enemies.near(x, y, radius + 30))
      if (e.health > 0 && Math.hypot(e.x - x, e.y - y) < radius + e.radius)
        this.damage(e, damage, chainDepth, player);
    this.emit("explosion", { x, y, radius, kind });
  }
  hurt(amount) {
    if (this.buffs.shield > 0 || this.state !== "playing") return;
    this.health = Math.max(0, this.health - amount);
    this.damageFlash = 0.22;
    this.emit("hurt", { amount });
    if (this.health <= 0) {
      this.state = "gameover";
      this.emit("gameover");
    }
  }
  pause() {
    if (this.state === "playing") this.state = "paused";
    else if (this.state === "paused") this.state = "playing";
  }
  choose(id) {
    if (this.state !== "upgrade" || !this.choices.some((u) => u.id === id))
      return false;
    const before = this.upgrades.evolved;
    if (!this.upgrades.take(id, this.stats)) return false;
    this.health = Math.min(
      this.stats.maxHealth,
      this.health +
        (id === "repair" ? 40 : id === "cooling" ? 15 : 0) +
        (this.defense ? 0 : 10),
    );
    this.weapons.bullets = [];
    this.enemyBullets = [];
    this.weapons.shells = [];
    this.choices = [];
    if (this.defense) {
      this.state = "ready";
      this.defense.open(this);
    } else {
      this.state = "playing";
      this.wave.next();
      this.emit("wave", { number: this.wave.number });
    }
    if (!before && this.upgrades.evolved)
      this.emit("evolution", { name: "HELLSTORM" });
    return true;
  }
  update(dt, input = {}) {
    if (this.state !== "playing") return;
    dt = Math.min(0.0334, dt);
    this.time += dt;
    this.damageFlash = Math.max(0, this.damageFlash - dt);
    this.score.update(dt);
    for (const key in this.buffs)
      this.buffs[key] = Math.max(0, this.buffs[key] - dt);
    this.wave.update(dt, this);
    if (this.defense) this.defense.update(dt, this);
    this.enemies.update(dt, this);
    if (this.state !== "playing") return;
    this.weapons.update(dt, this, input);
    const blasts = this.pendingBlasts;
    this.pendingBlasts = [];
    for (const blast of blasts) {
      blast.delay -= dt;
      if (blast.delay <= 0)
        this.explode(
          blast.x,
          blast.y,
          115,
          100,
          "inkbomb",
          blast.depth,
          blast.player,
        );
      else this.pendingBlasts.push(blast);
    }
    this.powerups.update(dt, this);
    for (const b of this.enemyBullets) {
      b.life -= dt;
      if (this.buffs.freeze <= 0) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }
      if (Math.hypot(b.x, b.y) < 28) {
        b.life = 0;
        this.hurt(b.damage ?? 7);
      }
    }
    this.enemyBullets = this.enemyBullets.filter((b) => b.life > 0);
    if (
      this.state === "playing" &&
      !this.wave.spawning &&
      !this.enemies.items.some((e) => e.health > 0) &&
      this.pendingBlasts.length === 0
    ) {
      if (this.defense) {
        this.defense.reward(40, "WAVE CLEAR");
        this.health = Math.min(this.stats.maxHealth, this.health + 10);
        this.enemyBullets = [];
        if (this.wave.number >= 5) {
          this.state = "victory";
          this.emit("victory");
        } else {
          this.state = "upgrade";
          this.choices = this.upgrades.choices(this.wave.number === 1);
          this.emit("waveComplete");
        }
        return;
      }
      this.state = "upgrade";
      this.choices = this.upgrades.choices(this.wave.number === 1);
      this.emit("waveComplete");
    }
  }
}

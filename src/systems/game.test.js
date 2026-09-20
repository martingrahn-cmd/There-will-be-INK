import test from "node:test";
import assert from "node:assert/strict";
import { CombatSystem, ScoreSystem } from "./game.js";
function makeGame() {
  const g = new CombatSystem({ rng: () => 0.5 });
  g.start();
  g.wave.spawnTimer = 1000;
  g.events = [];
  return g;
}
function enemy(g, type, x, y) {
  g.spawnEnemy(type);
  const e = g.enemies.items.at(-1);
  Object.assign(e, { x, y, speed: 0 });
  g.enemies.rebuild();
  return e;
}
test("aimed primary fire kills a target, awards score, and recycles bullets", () => {
  const g = makeGame();
  enemy(g, "swarmer", 100, 0);
  for (let i = 0; i < 30; i++) g.update(1 / 60, { fire: true });
  assert.equal(g.score.kills, 1);
  assert.equal(g.score.value, 10);
  assert.ok(g.weapons.bullets.length < 10);
});
test("piercing hits two aligned targets exactly once each", () => {
  const g = makeGame();
  g.stats.pierce = 1;
  g.stats.damage = 30;
  enemy(g, "swarmer", 100, 0);
  enemy(g, "swarmer", 140, 0);
  g.weapons.fire(g);
  for (let i = 0; i < 15; i++) g.update(1 / 60);
  assert.equal(g.score.kills, 2);
});
test("explosions affect nearby enemies but spare distant targets", () => {
  const g = makeGame();
  enemy(g, "swarmer", 100, 0);
  const far = enemy(g, "swarmer", 300, 0);
  g.explode(100, 0, 60, 50, "mortar");
  assert.equal(g.score.kills, 1);
  assert.equal(far.health, far.maxHealth);
});
test("a wave must finish spawning and clear all survivors before offering upgrades", () => {
  const g = makeGame();
  const e = enemy(g, "brute", 200, 0);
  g.wave.elapsed = 60;
  g.update(1 / 60);
  assert.equal(g.state, "playing");
  g.damage(e, 1000);
  g.update(1 / 60);
  assert.equal(g.state, "upgrade");
  assert.equal(g.choices.length, 3);
  const choice = g.choices[0].id;
  assert.equal(g.choose("invalid"), false);
  assert.equal(g.choose(choice), true);
  assert.equal(g.wave.number, 2);
  assert.equal(g.state, "playing");
  assert.equal(g.choose(choice), false);
});
test("the three required upgrades unlock HELLSTORM", () => {
  const g = makeGame();
  for (const id of ["minigun", "piercing", "explosive"])
    g.upgrades.take(id, g.stats);
  assert.equal(g.upgrades.evolved, true);
  assert.equal(g.stats.pierce, 1);
  assert.equal(g.stats.explosive, 1);
  assert.equal(g.stats.fireRate, 13);
});
test("pause freezes combat, cooldowns, and wave timer", () => {
  const g = makeGame();
  g.weapons.pulse(g);
  g.pause();
  const t = g.weapons.pulseTimer;
  g.update(0.03, { fire: true });
  assert.equal(g.wave.elapsed, 0);
  assert.equal(g.weapons.pulseTimer, t);
  assert.equal(g.weapons.bullets.length, 0);
  g.pause();
  g.update(0.03);
  assert.ok(g.wave.elapsed > 0);
});
test("secondary and pulse cannot bypass cooldowns", () => {
  const g = makeGame();
  g.weapons.mortar(g);
  g.weapons.mortar(g);
  assert.equal(g.weapons.shells.length, 1);
  g.weapons.pulse(g);
  g.weapons.pulse(g);
  assert.equal(g.events.filter((e) => e.kind === "pulse").length, 1);
});
test("shield blocks damage, repair caps at maximum, nuke clears hostiles", () => {
  const g = makeGame();
  g.powerups.activate({ type: "shield", life: 1 }, g);
  g.hurt(20);
  assert.equal(g.health, 100);
  g.health = 90;
  g.powerups.activate({ type: "repair", life: 1 }, g);
  assert.equal(g.health, 100);
  enemy(g, "brute", 200, 100);
  g.enemyBullets.push({ x: 20, y: 20 });
  g.powerups.activate({ type: "nuke", life: 1 }, g);
  assert.equal(g.score.kills, 1);
  assert.equal(g.enemyBullets.length, 0);
});
test("death is terminal until restart, which resets all progression", () => {
  const g = makeGame();
  g.upgrades.take("piercing", g.stats);
  g.hurt(999);
  assert.equal(g.state, "gameover");
  g.update(0.03, { fire: true });
  assert.equal(g.weapons.bullets.length, 0);
  g.start();
  assert.equal(g.health, 100);
  assert.equal(g.stats.pierce, 0);
  assert.equal(g.wave.number, 1);
  assert.equal(g.score.value, 0);
});
test("kill chains increase score multiplier and decay without kills", () => {
  const s = new ScoreSystem();
  for (let i = 0; i < 40; i++) s.kill(10);
  assert.equal(s.multiplier, 16);
  assert.equal(s.best, 16);
  s.update(3);
  assert.equal(s.multiplier, 1);
  assert.equal(s.best, 16);
});
test("late survival waves retain three legal upgrade choices after capped upgrades are exhausted", () => {
  const g = makeGame();
  for (let i = 0; i < 30; i++)
    for (const u of g.upgrades.choices()) g.upgrades.take(u.id, g.stats);
  assert.equal(g.upgrades.choices().length, 3);
});
test("wave one reduces chargers without changing later wave composition", () => {
  const g = makeGame();
  function count(wave) {
    const types = [];
    const stub = {
      enemies: { items: [] },
      rng: () => 0,
      spawnEnemy: (type) => types.push(type),
    };
    g.wave.number = wave;
    for (let i = 0; i < 100; i++) {
      stub.rng = () => (i + 0.5) / 100;
      g.wave.elapsed = 0;
      g.wave.spawnTimer = 0;
      g.wave.update(1 / 60, stub);
    }
    return types.reduce((counts, type) => {
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {});
  }
  assert.deepEqual(count(1), { charger: 25, swarmer: 75 });
  assert.deepEqual(count(2), { brute: 26, charger: 19, swarmer: 55 });
});
test("shorter waves finish spawning at 45 seconds", () => {
  const g = makeGame();
  assert.equal(g.wave.duration, 45);
  g.wave.elapsed = 44.9;
  assert.equal(g.wave.spawning, true);
  g.wave.elapsed = 45;
  assert.equal(g.wave.spawning, false);
});
test("powerups offer a new pickup near expiration without flooding the arena", () => {
  const g = makeGame();
  for (let i = 0; i < 240; i++) g.powerups.update(1 / 60, g);
  assert.equal(g.powerups.items.length, 1);
  const p = g.powerups.items[0];
  assert.ok(["sentry", "homing"].includes(p.type));
  g.powerups.activate(p, g);
  g.powerups.update(2, g);
  assert.equal(g.powerups.items.length, 0);
  g.buffs[p.type] = 0.2;
  g.powerups.update(0.03, g);
  assert.equal(g.powerups.items.length, 1);
  for (let i = 0; i < 60; i++) g.powerups.update(1 / 60, g);
  assert.equal(g.powerups.items.length, 1);
  g.powerups.items[0].life = 0.001;
  g.powerups.update(0.03, g);
  assert.equal(g.powerups.items.length, 1);
  assert.equal(g.powerups.items[0].life, 11);
});
test("instant powerups allow another drop after a short varied delay", () => {
  const g = makeGame();
  g.powerups.activate({ type: "repair", life: 1 }, g);
  assert.ok(g.powerups.nextDrop >= 0.5 && g.powerups.nextDrop <= 1.6);
  g.powerups.update(0.1, g);
  assert.equal(g.powerups.items.length, 0);
  g.powerups.update(2, g);
  assert.equal(g.powerups.items.length, 1);
});
test("wingman autonomously kills enemies and stops firing when its buff expires", () => {
  const g = makeGame();
  enemy(g, "swarmer", 220, 0);
  g.buffs.sentry = 12;
  for (let i = 0; i < 120; i++) g.update(1 / 60);
  assert.equal(g.score.kills, 1);
  g.buffs.sentry = 0;
  g.weapons.bullets = [];
  enemy(g, "brute", 250, 0);
  g.update(1 / 60);
  assert.equal(g.weapons.bullets.length, 0);
});
test("homing rockets steer toward targets, reacquire, and pooled bullets lose homing state", () => {
  const g = makeGame();
  const first = enemy(g, "brute", 230, 180);
  g.weapons.bullet({
    x: 0,
    y: 0,
    vx: 360,
    vy: 0,
    damage: 10,
    homing: true,
    target: first,
    support: true,
  });
  g.update(1 / 60);
  const rocket = g.weapons.bullets[0];
  assert.ok(rocket.vy > 0);
  g.damage(first, 999);
  const second = enemy(g, "brute", 230, -160);
  g.update(1 / 60);
  assert.equal(rocket.target, second);
  rocket.life = 0;
  g.update(1 / 60);
  g.weapons.bullet({ x: 0, y: 0, vx: 100, vy: 0, damage: 1 });
  assert.equal(g.weapons.bullets[0].homing, false);
  assert.equal(g.weapons.bullets[0].support, false);
  assert.equal(g.weapons.bullets[0].target, null);
});
test("nova fires in all directions without player input and support cannot consume pickups", () => {
  const g = makeGame();
  g.buffs.nova = 10;
  g.update(1 / 60);
  assert.equal(g.weapons.bullets.length, 16);
  assert.ok(g.weapons.bullets.some((b) => b.vx > 0));
  assert.ok(g.weapons.bullets.some((b) => b.vx < 0));
  g.buffs.nova = 0;
  g.weapons.bullets = [];
  const p = { type: "sentry", x: 100, y: 0, life: 11 };
  g.powerups.items = [p];
  g.weapons.bullet({ x: 90, y: 0, vx: 600, vy: 0, damage: 1, support: true });
  g.update(1 / 60);
  assert.equal(g.buffs.sentry, 0);
  g.weapons.bullet({ x: 90, y: 0, vx: 600, vy: 0, damage: 1 });
  g.update(1 / 60);
  assert.equal(g.buffs.sentry, 12);
});
test("wave three introduces shooters after eight seconds with a four percent spawn chance and a cap of two", () => {
  const g = makeGame();
  g.wave.number = 3;
  g.rng = () => 0.01;
  g.wave.spawnTimer = 0;
  g.wave.update(0.01, g);
  assert.equal(g.enemies.items.at(-1).type, "swarmer");
  g.enemies.items = [];
  let shooters = 0;
  for (let i = 0; i < 100; i++) {
    g.enemies.items = [];
    g.rng = () => (i + 0.5) / 100;
    g.wave.elapsed = 10;
    g.wave.spawnTimer = 0;
    g.wave.update(0.01, g);
    if (g.enemies.items.at(-1).type === "shooter") shooters++;
  }
  assert.equal(shooters, 4);
  g.enemies.items = [];
  g.rng = () => 0.01;
  for (let i = 0; i < 4; i++) {
    g.wave.spawnTimer = 0;
    g.wave.update(0.01, g);
  }
  assert.equal(g.enemies.items.filter((e) => e.type === "shooter").length, 2);
});
test("wave three shooters give reaction time and fire slower, lighter shots", () => {
  const g = makeGame();
  g.wave.number = 3;
  const e = enemy(g, "shooter", 200, 0);
  for (let i = 0; i < 120; i++) g.update(1 / 60);
  assert.equal(g.enemyBullets.length, 0);
  for (let i = 0; i < 70; i++) g.update(1 / 60);
  assert.equal(g.enemyBullets.length, 1);
  const b = g.enemyBullets[0];
  assert.equal(Math.hypot(b.vx, b.vy), 110);
  assert.equal(b.damage, 4);
  assert.ok(e.timer > 4);
  b.x = 20;
  b.y = 0;
  g.update(1 / 60);
  assert.equal(g.health, 96);
});
test("shooter strength ramps gradually in later waves", () => {
  const g = makeGame();
  g.wave.number = 3;
  const early = enemy(g, "shooter", 200, 0);
  g.wave.number = 4;
  const next = enemy(g, "shooter", 200, 0);
  g.wave.number = 6;
  const late = enemy(g, "shooter", 200, 0);
  assert.ok(
    early.shotInterval > next.shotInterval &&
      next.shotInterval > late.shotInterval,
  );
  assert.equal(next.shotDamage, 5);
  assert.equal(late.shotDamage, 7);
  assert.equal(late.shotSpeed, 150);
});
test("the first upgrade always offers three immediate weapon changes", () => {
  const g = makeGame();
  g.wave.elapsed = g.wave.duration;
  g.update(1 / 60);
  assert.deepEqual(
    g.choices.map((u) => u.id),
    ["double", "explosive", "ricochet"],
  );
  g.choose("double");
  g.weapons.fire(g);
  assert.equal(g.weapons.bullets.length, 3);
  assert.equal(new Set(g.weapons.bullets.map((b) => b.vy)).size, 3);
});
test("ink bombs chain in delayed steps, grant bonus points and never damage the turret", () => {
  const g = makeGame();
  const first = enemy(g, "exploder", 80, 0);
  const second = enemy(g, "exploder", 180, 0);
  const victim = enemy(g, "swarmer", 260, 0);
  const far = enemy(g, "brute", 450, 0);
  g.damage(first, 100);
  assert.equal(g.pendingBlasts.length, 1);
  assert.ok(second.health > 0);
  g.damage(first, 100);
  assert.equal(g.pendingBlasts.length, 1);
  for (let i = 0; i < 30; i++) g.update(1 / 60);
  assert.ok(second.health <= 0 && victim.health <= 0);
  assert.equal(far.health, far.maxHealth);
  assert.equal(g.health, 100);
  assert.equal(g.score.kills, 3);
  assert.equal(g.score.value, 160);
  assert.ok(g.events.some((e) => e.type === "chain" && e.depth === 2));
  assert.ok(
    g.events.some((e) => e.type === "death" && e.enemyType === "exploder"),
  );
  assert.equal(g.pendingBlasts.length, 0);
});
test("wave completion waits for the final ink bomb detonation", () => {
  const g = makeGame();
  g.wave.elapsed = g.wave.duration;
  const bomb = enemy(g, "exploder", 200, 0);
  g.damage(bomb, 100);
  g.update(1 / 60);
  assert.equal(g.state, "playing");
  for (let i = 0; i < 12; i++) g.update(1 / 60);
  assert.equal(g.state, "upgrade");
});
function defenseGame() {
  const g = new CombatSystem({ mode: "defense", rng: () => 0.5 });
  g.start();
  return g;
}
test("defense ramps enemy pressure across all five waves at different frame rates", () => {
  const totals = [];
  for (const fps of [30, 60, 144]) {
    const counts = [];
    for (let wave = 1; wave <= 5; wave++) {
      const g = defenseGame();
      g.defense.next(g);
      g.wave.number = wave;
      let count = 0;
      let middle = 0;
      let finale = 0;
      g.spawnEnemy = () => {
        count++;
        if (g.wave.elapsed >= 15 && g.wave.elapsed < 25) middle++;
        if (g.wave.elapsed >= 25) finale++;
      };
      while (g.wave.spawning) g.wave.update(1 / fps, g);
      assert.ok(finale > middle * 1.15);
      const finishedCount = count;
      g.wave.update(1 / fps, g);
      assert.equal(count, finishedCount);
      counts.push(count);
    }
    assert.ok(counts[0] >= 115 && counts[0] <= 120);
    assert.ok(counts[4] >= 230 && counts[4] <= 237);
    for (let i = 1; i < counts.length; i++)
      assert.ok(counts[i] > counts[i - 1] + 20);
    totals.push(counts);
  }
  for (let wave = 0; wave < 5; wave++) {
    const counts = totals.map((waves) => waves[wave]);
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1);
  }
});
test("defense enemies grow tougher and faster, with elites from wave three", () => {
  const g = defenseGame();
  g.defense.next(g);
  g.rng = () => 0.04;
  g.wave.number = 2;
  g.spawnEnemy("brute");
  const early = g.enemies.items.at(-1);
  assert.equal(early.elite, false);
  g.wave.number = 3;
  g.spawnEnemy("brute");
  assert.equal(g.enemies.items.at(-1).elite, true);
  g.rng = () => 0.5;
  g.wave.number = 5;
  g.spawnEnemy("brute");
  const late = g.enemies.items.at(-1);
  assert.equal(late.elite, false);
  assert.ok(late.health > early.health * 1.5);
  assert.ok(late.speed > early.speed);
  assert.equal(late.health, late.maxHealth);
  g.rng = () => 0.15;
  g.spawnEnemy("brute");
  assert.equal(g.enemies.items.at(-1).elite, true);
  assert.equal(g.enemies.items.at(-1).health, late.health * 2);
});
test("free placement validates bounds, base clearance, overlap and budget", () => {
  const g = defenseGame(),
    d = g.defense;
  for (const [x, y] of [
    [0, 0],
    [10000, 0],
    [NaN, 10],
  ])
    assert.equal(d.place(g, "gun", x, y), false);
  assert.equal(d.energy, 100);
  assert.equal(d.place(g, "gun", 155, 123), true);
  assert.equal(d.slots[0].x, 155);
  assert.equal(d.energy, 0);
  assert.equal(d.place(g, "slow", -150, 100), false);
  d.energy = 300;
  assert.equal(d.place(g, "slow", 160, 120), false);
  assert.equal(d.place(g, "slow", -150, 100), true);
  assert.equal(d.build(g, 0, "gun"), true);
  assert.equal(d.slots[0].level, 2);
  d.layout({ x: 400, y: 340 });
  assert.equal(d.slots[0].x, 155);
  d.next(g);
  assert.equal(d.place(g, "mortar", 200, -100), false);
});
test("defense spawns shootable powerups and freezes pickups and buffs while building", () => {
  const g = defenseGame();
  g.defense.next(g);
  g.wave.spawnTimer = 1000;
  for (let i = 0; i < 240; i++) g.update(1 / 60);
  assert.equal(g.powerups.items.length, 1);
  const pickup = g.powerups.items[0];
  const life = pickup.life;
  g.defense.open(g);
  g.update(0.03);
  assert.equal(pickup.life, life);
  g.defense.close(g);
  g.weapons.bullet({
    x: pickup.x - 10,
    y: pickup.y,
    vx: 600,
    vy: 0,
    damage: 1,
  });
  g.update(1 / 60);
  assert.ok(g.buffs[pickup.type] > 0);
  assert.equal(g.powerups.items.length, 0);
  const duration = g.buffs[pickup.type];
  g.defense.open(g);
  g.update(0.03);
  assert.equal(g.buffs[pickup.type], duration);
});
test("defense retains skill rewards and omnidirectional movement", () => {
  const g = defenseGame();
  g.defense.next(g);
  g.wave.spawnTimer = 999;
  const e = enemy(g, "charger", 200, 100);
  e.phase = "tell";
  let before = g.defense.energy;
  g.damage(e, 999);
  assert.equal(g.defense.energy - before, 18);
  const sw = enemy(g, "swarmer", 200, -100);
  sw.speed = 44;
  g.enemies.update(0.03, g);
  assert.ok(sw.x < 200 && sw.y > -100);
  assert.equal(sw.lane, undefined);
});
test("freely placed gun and mortar kill independently and slow field slows enemies", () => {
  for (const type of ["gun", "mortar"]) {
    const g = defenseGame();
    g.defense.place(g, type, 180, 80);
    g.defense.next(g);
    g.wave.spawnTimer = 999;
    const e = enemy(g, "swarmer", 230, 80);
    e.speed = 0;
    for (let i = 0; i < 100; i++) g.update(1 / 60);
    assert.ok(e.health <= 0);
  }
  const g = defenseGame();
  g.defense.place(g, "slow", 180, 80);
  g.defense.next(g);
  const e = enemy(g, "swarmer", 210, 80);
  g.defense.update(0.03, g);
  assert.equal(e.slow, 0.58);
});
test("five defense waves end in victory and restart clears placed towers", () => {
  const g = defenseGame();
  g.defense.place(g, "gun", 150, 100);
  for (let w = 1; w <= 5; w++) {
    g.defense.next(g);
    g.wave.spawnTimer = 999;
    g.defense.open(g);
    const t = g.time;
    g.update(0.03);
    assert.equal(g.time, t);
    g.defense.close(g);
    g.enemies.items = [];
    g.wave.elapsed = g.wave.duration;
    g.update(0.03);
    assert.equal(g.state, w === 5 ? "victory" : "upgrade");
    if (w < 5) {
      assert.equal(g.choices.length, 3);
      assert.equal(g.defense.next(g), false);
      const choice = g.choices[0].id;
      assert.equal(g.choose(choice), true);
      assert.equal(g.state, "building");
      assert.equal(g.wave.number, w);
      assert.equal(g.choose(choice), false);
    }
  }
  g.start();
  assert.equal(g.defense.slots.length, 0);
  assert.equal(g.defense.energy, 100);
});

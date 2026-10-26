import test from "node:test";
import assert from "node:assert/strict";
import { CombatSystem } from "./game.js";
import { BOSS_WAVES } from "./bosses.js";
function game(wave = 3) {
  const g = new CombatSystem({ mode: "defense", rng: () => 0.5 });
  g.start();
  g.defense.next(g);
  g.wave.number = wave;
  g.wave.spawnTimer = 999;
  return g;
}
function spawn(g) {
  g.wave.elapsed = BOSS_WAVES[g.wave.number].at;
  g.bosses.update(g);
  return g.enemies.items.find((e) => e.boss);
}
test("bosses warn, spawn once in waves three and five, and wait for capacity", () => {
  for (const wave of [1, 2, 4]) {
    const g = game(wave);
    g.wave.elapsed = 34;
    g.bosses.update(g);
    assert.equal(g.enemies.items.length, 0);
  }
  for (const wave of [3, 5]) {
    const g = game(wave),
      at = BOSS_WAVES[wave].at;
    g.wave.elapsed = at - 3;
    g.bosses.update(g);
    g.bosses.update(g);
    assert.equal(g.events.filter((e) => e.type === "bossIncoming").length, 1);
    assert.equal(g.enemies.items.length, 0);
    g.enemies.items = Array.from({ length: 450 }, () => ({ health: 1 }));
    g.wave.elapsed = at;
    g.bosses.update(g);
    assert.equal(g.bosses.spawnedWaves.has(wave), false);
    g.enemies.items = [];
    g.bosses.update(g);
    g.bosses.update(g);
    assert.equal(g.enemies.items.length, 1);
    assert.equal(g.enemies.items[0].name, BOSS_WAVES[wave].name);
  }
  const survival = new CombatSystem();
  survival.start();
  survival.wave.number = 3;
  survival.wave.elapsed = 30;
  survival.bosses.update(survival);
  assert.equal(survival.enemies.items.length, 0);
});
test("boss reaches firing range, telegraphs shots, enrages once and takes extra damage while reloading", () => {
  const g = game(),
    b = spawn(g);
  for (let i = 0; i < 600 && b.phase === "advance"; i++)
    g.enemies.update(1 / 60, g);
  assert.equal(b.phase, "windup");
  assert.equal(g.enemyBullets.length, 0);
  g.buffs.freeze = 2;
  const timer = b.timer;
  g.enemies.update(0.5, g);
  assert.equal(b.timer, timer);
  g.buffs.freeze = 0;
  while (b.phase !== "recovery") g.enemies.update(1 / 60, g);
  assert.equal(g.enemyBullets.length, 3);
  const hp = b.health;
  g.damage(b, 100);
  assert.equal(b.health, hp - 150);
  b.health = b.maxHealth / 2;
  g.enemies.update(1 / 60, g);
  g.enemies.update(1 / 60, g);
  assert.equal(g.events.filter((e) => e.type === "bossRage").length, 1);
  g.enemyBullets = [];
  while (b.phase === "recovery") g.enemies.update(1 / 60, g);
  while (b.phase !== "recovery") g.enemies.update(1 / 60, g);
  assert.equal(g.enemyBullets.length, 5);
  g.weapons.pulse(g);
  assert.equal(g.enemyBullets.length, 0);
});
test("boss survives a nuke, blocks wave completion, pays scrap once and resets on restart", () => {
  const g = game(),
    b = spawn(g);
  g.powerups.activate({ type: "nuke", life: 1 }, g);
  assert.ok(b.health > 0 && b.health < b.maxHealth);
  g.wave.elapsed = g.wave.duration;
  g.update(1 / 60);
  assert.equal(g.state, "playing");
  const bank = g.progression.scrap;
  g.damage(b, 99999);
  g.damage(b, 99999);
  assert.equal(g.progression.scrap - bank, 15);
  g.update(1 / 60);
  assert.equal(g.state, "clearing");
  assert.equal(g.progression.scrap - bank, 23);
  for (let i = 0; i < 125; i++) g.update(1 / 60);
  assert.equal(g.progression.scrap - bank, 23);
  g.start();
  assert.equal(g.bosses.spawnedWaves.size, 0);
  assert.equal(g.progression.scrap, 23);
});
test("boss hitbox includes grazing bullets and the boss cannot be pushed out of range", () => {
  const g = game(),
    b = spawn(g);
  Object.assign(b, { x: 0, y: 140, phase: "windup", timer: 99 });
  g.enemies.rebuild();
  g.stats.knockback = 100;
  g.weapons.bullet({ x: 40, y: 70, vx: 0, vy: 600, damage: 100 });
  for (let i = 0; i < 10; i++) g.weapons.update(1 / 60, g, {});
  assert.equal(b.health, b.maxHealth - 100);
  assert.equal(b.y, 140);
});

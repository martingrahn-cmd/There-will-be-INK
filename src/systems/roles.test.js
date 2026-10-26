import test from "node:test";
import assert from "node:assert/strict";
import { CombatSystem } from "./game.js";
function setup(tower) {
  const g = new CombatSystem({ mode: "defense", rng: () => 0.5 });
  g.start();
  if (tower) g.defense.place(g, tower, 150, 0);
  g.defense.next(g);
  g.wave.spawnTimer = 999;
  return g;
}
function enemy(g, type, x, y, health = 10000) {
  g.spawnEnemy(type);
  const e = g.enemies.items.at(-1);
  Object.assign(e, { x, y, speed: 0, health, maxHealth: health });
  g.enemies.rebuild();
  return e;
}
test("defense offers weapon mods instead of workshop stats, with three legal choices throughout a run", () => {
  const g = setup();
  for (const id of ["damage", "repair", "cooling"])
    assert.equal(g.upgrades.take(id, g.stats), false);
  for (let wave = 1; wave <= 4; wave++) {
    const choices = g.upgrades.choices(wave === 1);
    assert.equal(choices.length, 3);
    assert.ok(
      choices.every(
        (u) => u.scope && !["damage", "repair", "cooling"].includes(u.id),
      ),
    );
    assert.equal(g.upgrades.take(choices[0].id, g.stats), true);
  }
  const fresh = setup(),
    before = { ...fresh.stats };
  fresh.upgrades.take("minigun", fresh.stats);
  assert.equal(fresh.stats.fireRate, before.fireRate * 1.5);
  assert.equal(fresh.stats.damage, before.damage * 0.85);
  assert.ok(fresh.stats.spread > before.spread);
});
test("tower fire does not inherit player explosions, knockback or death fragments", () => {
  const g = setup("gun");
  const target = enemy(g, "brute", 210, 0),
    nearby = enemy(g, "brute", 260, 0);
  Object.assign(g.stats, {
    damage: 999,
    explosive: 2,
    knockback: 50,
    shrapnel: true,
    pierce: 3,
    ricochet: 3,
  });
  g.defense.update(0, g);
  for (let i = 0; i < 10; i++) g.weapons.update(1 / 60, g, {});
  assert.equal(target.health, 9984);
  assert.equal(target.x, 213);
  assert.equal(nearby.health, 10000);
  assert.equal(
    g.events.some((e) => e.kind === "ammo"),
    false,
  );
  g.damage(target, 99999, 0, false);
  assert.equal(
    g.weapons.bullets.some((b) => b.fragment),
    false,
  );
  g.damage(nearby, 99999);
  assert.equal(g.weapons.bullets.filter((b) => b.fragment).length, 4);
});
test("temporary support keeps fixed payloads while Quad still boosts the main gun", () => {
  const g = setup();
  enemy(g, "brute", 250, 0);
  Object.assign(g.stats, {
    damage: 999,
    pierce: 3,
    blastRadius: 3,
    explosive: 2,
  });
  Object.assign(g.buffs, {
    sentry: 12,
    homing: 12,
    nova: 10,
    quad: 10,
    overdrive: 10,
  });
  g.weapons.support(0, g);
  const [wingman, ...rest] = g.weapons.bullets;
  assert.equal(wingman.damage, 14 * 1.2);
  assert.equal(wingman.pierce, 0);
  assert.equal(g.weapons.sentryTimer, 0.15);
  assert.ok(rest.filter((b) => b.homing).every((b) => b.damage === 28));
  assert.ok(rest.filter((b) => !b.homing).every((b) => b.damage === 21));
  g.weapons.fire(g);
  assert.equal(g.weapons.bullets.at(-1).damage, 999 * 4);
});
test("seeker splash awards ordinary income without player skill bonuses", () => {
  const g = setup();
  const target = enemy(g, "shooter", 100, 0, 10);
  enemy(g, "shooter", 125, 0, 10);
  g.weapons.bullet({
    x: 90,
    y: 0,
    vx: 360,
    vy: 0,
    damage: 30,
    homing: true,
    support: true,
    target,
  });
  g.weapons.update(1 / 60, g, {});
  assert.equal(g.score.kills, 2);
  assert.equal(g.defense.waveKillEnergy, 2);
  assert.equal(g.defense.waveSkillEnergy, 0);
});
test("mortar picks a crowd while the auto cannon covers the nearest threat", () => {
  for (const type of ["gun", "mortar"]) {
    const g = setup(type);
    const isolated = enemy(g, "brute", 90, 30);
    const crowd = [
      enemy(g, "brute", 270, 0),
      enemy(g, "brute", 290, 20),
      enemy(g, "brute", 290, -20),
    ];
    g.defense.update(0, g);
    if (type === "mortar") {
      assert.equal(g.defense.shells.length, 1);
      const shell = g.defense.shells[0];
      assert.ok(crowd.some((e) => e.x === shell.x && e.y === shell.y));
    } else {
      assert.equal(
        g.defense.slots[0].angle,
        Math.atan2(isolated.y, isolated.x - 150),
      );
    }
  }
});

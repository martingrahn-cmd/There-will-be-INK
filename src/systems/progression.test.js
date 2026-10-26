import test from "node:test";
import assert from "node:assert/strict";
import {
  ProgressionSystem,
  PROGRESSION_KEY,
  WORKSHOP_UPGRADES,
} from "./progression.js";
import { CombatSystem } from "./game.js";
function memoryStorage(initial) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (key, next) => {
      assert.equal(key, PROGRESSION_KEY);
      value = next;
    },
  };
}
test("workshop purchases persist, enforce funds and caps, and reject unknown upgrades", () => {
  const storage = memoryStorage();
  const p = new ProgressionSystem(storage);
  assert.equal(p.buy("damage"), false);
  assert.equal(p.buy("toString"), false);
  assert.equal(p.earn(-1), false);
  assert.equal(p.earn(NaN), false);
  assert.equal(p.earn(1.5), false);
  p.earn(300);
  for (const cost of [20, 35, 55, 80, 110]) {
    assert.equal(p.cost("damage"), cost);
    assert.equal(p.buy("damage"), true);
  }
  assert.equal(p.scrap, 0);
  p.earn(100);
  assert.equal(p.buy("damage"), false);
  assert.equal(p.scrap, 100);
  const loaded = new ProgressionSystem(storage);
  assert.equal(loaded.levels.damage, 5);
  assert.equal(loaded.scrap, 100);
});
test("unreadable and invalid saves do not crash or inject invalid balances and stats", () => {
  const bad = new ProgressionSystem(memoryStorage("not json"));
  assert.equal(bad.scrap, 0);
  assert.equal(bad.saveError, true);
  const sanitized = new ProgressionSystem(
    memoryStorage(
      JSON.stringify({
        version: 1,
        scrap: -123,
        levels: { damage: 99, hull: -3, fireRate: "4", mortar: 1.5 },
      }),
    ),
  );
  assert.deepEqual(sanitized.levels, {
    fireRate: 0,
    damage: 5,
    hull: 0,
    mortar: 0,
  });
  assert.equal(sanitized.scrap, 0);
  const blocked = new ProgressionSystem({
    getItem: () => {
      throw new Error();
    },
    setItem: () => {
      throw new Error();
    },
  });
  assert.equal(blocked.earn(20), true);
  assert.equal(blocked.buy("hull"), true);
  assert.equal(blocked.levels.hull, 1);
  assert.equal(blocked.saveError, true);
});
test("earned scrap survives defeat and reload, while purchased stats apply once on a fresh run", () => {
  const storage = memoryStorage();
  const p = new ProgressionSystem(storage);
  const g = new CombatSystem({
    mode: "defense",
    progression: p,
    rng: () => 0.5,
  });
  g.start();
  g.defense.next(g);
  for (let i = 0; i < 200; i++) {
    g.spawnEnemy("swarmer");
    g.damage(g.enemies.items.at(-1), 999);
  }
  assert.equal(g.runScrap, 20);
  assert.equal(p.scrap, 20);
  assert.equal(g.buyPermanent("fireRate"), false);
  g.hurt(999);
  assert.equal(g.buyPermanent("fireRate"), true);
  assert.equal(g.stats.fireRate, 10);
  const reloaded = new ProgressionSystem(storage);
  assert.equal(reloaded.scrap, 0);
  const next = new CombatSystem({ mode: "defense", progression: reloaded });
  next.start();
  assert.ok(Math.abs(next.stats.fireRate - 10.6) < 1e-9);
  next.upgrades.take("minigun", next.stats);
  next.start();
  assert.ok(Math.abs(next.stats.fireRate - 10.6) < 1e-9);
  assert.equal(next.runScrap, 0);
  assert.equal(next.defense.energy, 150);
});
test("all workshop bonuses apply to the next defense run without modifying survival", () => {
  const p = new ProgressionSystem();
  p.earn(1000);
  for (const id of Object.keys(WORKSHOP_UPGRADES)) assert.ok(p.buy(id));
  const g = new CombatSystem({ mode: "defense", progression: p });
  g.start();
  assert.equal(g.stats.damage, 14 * 1.08);
  assert.equal(g.health, 110);
  assert.equal(g.stats.maxHealth, 110);
  assert.equal(g.stats.mortarCooldown, 4.5 * 0.95);
  const survival = new CombatSystem({ progression: p });
  survival.start();
  assert.equal(survival.health, 100);
  assert.equal(survival.stats.damage, 14);
});

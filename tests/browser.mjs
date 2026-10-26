import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(process.env.BASE_URL || "http://localhost:5174");
await expect(page.locator(".note-grid")).toContainText("Shape your weapon.");
await expect(page.locator(".note-grid")).toContainText("Come back stronger.");
await page.getByRole("button", { name: "BUILD A DEFENSE" }).click();
await expect(page.locator(".wallet-purpose")).toHaveText(
  "TOWERS ONLY · THIS RUN",
);
await expect(page.locator(".scrap-block .hud-label")).toHaveText(
  "SCRAP · KEPT",
);
await expect(page.locator(".score-block .hud-label")).toHaveText(
  "SCORE · RECORD ONLY",
);
await expect(page.locator(".tower-role")).toHaveText([
  "FOCUS FIRE",
  "CONTROL",
  "CROWD CLEAR",
]);
await expect(page.locator("#energy-value")).toHaveText("150");
await expect(page.getByRole("button", { name: /Ⅱ AUTO CANNON/ })).toContainText(
  "120 ENERGY",
);
await expect(page.getByRole("button", { name: /◎ SLOW FIELD/ })).toContainText(
  "140 ENERGY",
);
await expect(page.getByRole("button", { name: /✣ MORTAR/ })).toContainText(
  "150 ENERGY",
);
async function clickWorld(x, y) {
  const p = await page.evaluate(
    ({ x, y }) => {
      const v = window.__doodle.view,
        r = document.querySelector("#arena").getBoundingClientRect();
      return {
        x: r.left + r.width * (0.5 + x / v.worldWidth),
        y: r.top + r.height * (0.5 - y / 720),
      };
    },
    { x, y },
  );
  await page.mouse.click(p.x, p.y);
}
await page.getByRole("button", { name: /Ⅱ AUTO CANNON/ }).click();
await clickWorld(0, 0);
assert.equal(
  await page.evaluate(() => window.__doodle.game.defense.energy),
  150,
);
await clickWorld(-170, 80);
await expect(page.locator("#energy-value")).toHaveText("30");
await expect(
  page.getByRole("button", { name: /UPGRADE TO LEVEL 2/ }),
).toBeDisabled();
assert.equal(
  await page.evaluate(() => window.__doodle.game.defense.slots.length),
  1,
);
await page.evaluate(() => {
  window.__doodle.game.defense.energy = 410;
});
await page.waitForTimeout(100);
await page.getByRole("button", { name: /◎ SLOW FIELD/ }).click();
await clickWorld(160, 80);
await page.getByRole("button", { name: /✣ MORTAR/ }).click();
await clickWorld(140, -150);
await clickWorld(-170, 80);
await page.getByRole("button", { name: /UPGRADE TO LEVEL 2/ }).click();
await page.screenshot({ path: "artifacts/free-build.png" });
await page.getByRole("button", { name: "START WAVE 1 / 5" }).click();
await page.evaluate(() => window.dispatchEvent(new Event("blur")));
assert.equal(await page.evaluate(() => window.__doodle.game.state), "playing");
await page.mouse.move(950, 430);
await page.mouse.down();
await page.mouse.down({ button: "right" });
assert.ok(
  await page.evaluate(
    () =>
      window.__doodle.input.fire &&
      window.__doodle.game.weapons.mortarTimer > 0,
  ),
);
await page.mouse.up({ button: "right" });
await page.mouse.up();
await page.keyboard.press("Escape");
await page
  .getByRole("button", { name: "AUTO-PAUSE ON FOCUS LOSS: OFF" })
  .click();
await page.getByRole("button", { name: "BACK TO THE MESS" }).click();
await page.evaluate(() => window.dispatchEvent(new Event("blur")));
assert.equal(await page.evaluate(() => window.__doodle.game.state), "paused");
await page
  .getByRole("button", { name: "AUTO-PAUSE ON FOCUS LOSS: ON" })
  .click();
await page.getByRole("button", { name: "BACK TO THE MESS" }).click();
await page.evaluate(() => {
  const g = window.__doodle.game;
  for (let i = 0; i < 100; i++) {
    g.spawnEnemy("shooter");
    g.damage(g.enemies.items.at(-1), 99999);
  }
});
await expect(page.locator("#wave-budget")).toHaveText(
  "WAVE BUDGET EMPTY · KILLS STILL SCORE",
);
for (let wave = 1; wave <= 5; wave++) {
  await page.evaluate(() => {
    const g = window.__doodle.game;
    g.enemies.items = [];
    g.pendingBlasts = [];
    g.wave.elapsed = g.wave.duration;
    g.wave.spawnTimer = 999;
    g.bosses.update(g);
    for (const boss of g.enemies.items.filter((e) => e.boss))
      g.damage(boss, 99999);
    window.__doodle.view.effects.shake = 18;
  });
  await page.getByRole("heading", { name: "LEVEL CLEAR" }).waitFor();
  await expect(page.locator(".level-clear-reward")).toContainText(
    "+120 BUILD ENERGY",
  );
  assert.equal(await page.locator("[data-upgrade]").count(), 0);
  if (wave === 1) {
    await page.screenshot({ path: "artifacts/level-clear.png" });
  }
  if (wave < 5) {
    await expect(page.locator(".upgrade-panel > p")).toContainText(
      "One free mod for your weapons.",
    );
    await expect(page.locator(".upgrade-foot")).toContainText("THIS RUN ONLY");
    if (wave === 1)
      await page.screenshot({ path: "artifacts/weapon-roles.png" });
    await page.locator("[data-upgrade]").first().click();
    assert.equal(
      await page.evaluate(() => window.__doodle.game.state),
      "building",
    );
    if (wave === 1) {
      await page.getByRole("button", { name: /Ⅱ AUTO CANNON/ }).click();
      await clickWorld(-270, 80);
      assert.equal(
        await page.evaluate(() => window.__doodle.game.defense.slots.length),
        4,
      );
      const camera = await page.evaluate(() => {
        const { game, view } = window.__doodle;
        view.effects.shake = 18;
        return Array.from({ length: 10 }, () => {
          view.render(game, 1 / 60);
          return [
            view.camera.position.x,
            view.camera.position.y,
            view.effects.shake,
          ];
        });
      });
      assert.ok(
        camera.every(([x, y, shake]) => x === 0 && y === 0 && shake === 0),
      );
    }
    await page
      .getByRole("button", { name: `START WAVE ${wave + 1} / 5` })
      .click();
    await expect(page.locator("#wave-budget")).toHaveText(
      "WAVE ENERGY LEFT · Kills 80 · Skill 20",
    );
  } else
    await page.getByRole("heading", { name: "The page is safe." }).waitFor();
}
await page.getByRole("button", { name: "ONE MORE PAGE" }).click();
assert.equal(
  await page.evaluate(() => window.__doodle.game.defense.slots.length),
  0,
);
assert.deepEqual(errors, []);
console.log(
  "Free placement, invalid placement, upgrades, mouse chord, focus preference, five waves and restart passed.",
);
await browser.close();

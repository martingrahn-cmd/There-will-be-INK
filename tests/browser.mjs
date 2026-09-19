import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(process.env.BASE_URL || "http://localhost:5174");
await page.getByRole("button", { name: "BUILD A DEFENSE" }).click();
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
  100,
);
await clickWorld(-170, 80);
assert.equal(
  await page.evaluate(() => window.__doodle.game.defense.slots.length),
  1,
);
await page.evaluate(() => {
  window.__doodle.game.defense.energy = 400;
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
for (let wave = 1; wave <= 5; wave++) {
  await page.evaluate(() => {
    const g = window.__doodle.game;
    g.enemies.items = [];
    g.pendingBlasts = [];
    g.wave.elapsed = g.wave.duration;
    g.wave.spawnTimer = 999;
  });
  if (wave < 5) {
    await page.locator("[data-upgrade]").first().click();
    assert.equal(
      await page.evaluate(() => window.__doodle.game.state),
      "building",
    );
    await page
      .getByRole("button", { name: `START WAVE ${wave + 1} / 5` })
      .click();
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

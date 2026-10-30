import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.BASE_URL || "http://localhost:5174");
  await page.getByRole("button", { name: "BUILD A DEFENSE" }).click();
  await page.getByRole("button", { name: "START WAVE 1 / 5" }).click();
  await page.evaluate(() => {
    window.__doodle.game.wave.spawnTimer = 999;
  });
  const state = () => page.evaluate(() => window.__doodle.game.state);

  // Esc from mid-wave build mode returns to the fight, not the pause menu.
  await page.keyboard.press("KeyB");
  assert.equal(await state(), "building");
  await page.keyboard.press("Escape");
  assert.equal(await state(), "playing");
  await expect(page.locator("#modal")).toBeHidden();
  await page.keyboard.press("Escape");
  assert.equal(await state(), "paused");
  await page.keyboard.press("Escape");
  assert.equal(await state(), "playing");

  // The arena keeps its size on every screen shape; the pointer still maps
  // screen positions onto it.
  const arena = await page.evaluate(() => ({ ...window.__doodle.game.bounds }));
  for (const viewport of [
    { width: 1000, height: 900 },
    { width: 1920, height: 800 },
    { width: 800, height: 1000 },
    { width: 1280, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(150);
    const probe = await page.evaluate(() => {
      const { game, view } = window.__doodle;
      const r = document.querySelector("#arena").getBoundingClientRect();
      const toScreen = (x, y) => ({
        x: r.left + r.width * (0.5 + x / view.worldWidth),
        y: r.top + r.height * (0.5 - y / view.worldHeight),
      });
      const corner = toScreen(game.bounds.x, game.bounds.y);
      return {
        bounds: { ...game.bounds },
        worldWidth: view.worldWidth,
        worldHeight: view.worldHeight,
        center: view.pointer(r.left + r.width / 2, r.top + r.height / 2),
        corner: view.pointer(corner.x, corner.y),
      };
    });
    const label = `${viewport.width}x${viewport.height}`;
    assert.deepEqual(probe.bounds, arena, label);
    assert.ok(probe.worldWidth >= (arena.x + 25) * 2 - 0.001, label);
    assert.ok(probe.worldHeight >= 720 - 0.001, label);
    assert.ok(Math.abs(probe.center.x) < 0.01, label);
    assert.ok(Math.abs(probe.center.y) < 0.01, label);
    assert.ok(Math.abs(probe.corner.x - arena.x) < 0.01, label);
    assert.ok(Math.abs(probe.corner.y - arena.y) < 0.01, label);
  }
  await page.setViewportSize({ width: 1920, height: 800 });
  await page.waitForTimeout(150);
  await page.screenshot({ path: "artifacts/arena-wide.png" });
  assert.deepEqual(errors, []);
  console.log(
    "Esc in build mode and fixed arena size across viewports passed.",
  );
} finally {
  await browser.close();
}

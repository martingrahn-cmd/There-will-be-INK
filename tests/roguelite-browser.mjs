import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.BASE_URL || "http://localhost:5173");
  await page.getByRole("button", { name: /WORKSHOP · 0 SCRAP/ }).click();
  await expect(
    page.getByRole("heading", { name: "Bad day? Bigger gun." }),
  ).toBeVisible();
  await expect(page.locator('[data-permanent="damage"]')).toBeDisabled();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "BUILD A DEFENSE" }).click();
  await page.getByRole("button", { name: "START WAVE 1 / 5" }).click();
  await page.evaluate(() => {
    const g = window.__doodle.game;
    g.wave.spawnTimer = 999;
    for (let i = 0; i < 200; i++) {
      g.spawnEnemy("swarmer");
      g.damage(g.enemies.items.at(-1), 99999);
    }
    g.hurt(9999);
  });
  await expect(
    page.getByRole("heading", { name: "Out of ink." }),
  ).toBeVisible();
  await expect(page.locator(".end-scrap")).toContainText(
    "+20 SCRAP BANKED THIS RUN",
  );
  await page.screenshot({ path: "artifacts/roguelite-defeat.png" });
  await page.getByRole("button", { name: "SPEND SCRAP · WORKSHOP" }).click();
  await page.locator('[data-permanent="fireRate"]').click();
  await expect(page.locator(".scrap-wallet > strong")).toHaveText("0");
  await expect(page.locator('[data-permanent="fireRate"]')).toContainText(
    "LEVEL 1 / 5",
  );
  await expect(page.locator(".workshop-message")).toContainText(
    "Next run starts stronger.",
  );
  await page.getByRole("button", { name: "← BACK" }).click();
  await expect(page.locator(".end-scrap")).toContainText("0 AVAILABLE");
  await page.getByRole("button", { name: "ONE MORE PAGE" }).click();
  assert.ok(
    Math.abs(
      (await page.evaluate(() => window.__doodle.game.stats.fireRate)) - 10.6,
    ) < 1e-9,
  );
  await page.reload();
  await page.getByRole("button", { name: /WORKSHOP · 0 SCRAP/ }).click();
  await expect(page.locator('[data-permanent="fireRate"]')).toContainText(
    "LEVEL 1 / 5",
  );
  await page.getByRole("button", { name: "← BACK" }).click();
  await page.getByRole("button", { name: "BUILD A DEFENSE" }).click();
  await page.getByRole("button", { name: "START WAVE 1 / 5" }).click();
  await page.evaluate(() => {
    const g = window.__doodle.game;
    g.wave.number = 3;
    g.wave.elapsed = 14;
    g.wave.spawnTimer = 999;
    g.bosses.update(g);
    const b = g.enemies.items.find((e) => e.boss);
    b.x = 80;
    b.y = 220;
  });
  await expect(page.locator("#boss-name")).toHaveText("THE RED PEN");
  await expect(page.locator("#boss-instruction")).toContainText(
    "INCOMING SALVO",
  );
  await page.screenshot({ path: "artifacts/red-pen-boss.png" });
  await page.evaluate(() => {
    const g = window.__doodle.game,
      b = g.enemies.items.find((e) => e.boss);
    b.health = b.maxHealth / 2;
    b.phase = "recovery";
    b.timer = 3;
  });
  await expect(page.locator("#boss-name")).toContainText("ENRAGED");
  await expect(page.locator("#boss-instruction")).toContainText("+50% DAMAGE");
  await page.evaluate(() => {
    const g = window.__doodle.game;
    g.damage(
      g.enemies.items.find((e) => e.boss),
      99999,
    );
    g.hurt(9999);
  });
  await expect(page.locator("#boss-hud")).toBeHidden();
  await expect(page.locator(".end-scrap")).toContainText(
    "+15 SCRAP BANKED THIS RUN",
  );
  await page.getByRole("button", { name: "SPEND SCRAP · WORKSHOP" }).click();
  await page.screenshot({ path: "artifacts/roguelite-workshop.png" });
  for (const size of [
    { width: 1280, height: 720 },
    { width: 800, height: 700 },
  ]) {
    await page.setViewportSize(size);
    for (const id of ["fireRate", "damage", "hull", "mortar"]) {
      await page.locator(`[data-permanent="${id}"]`).scrollIntoViewIfNeeded();
      await expect(page.locator(`[data-permanent="${id}"]`)).toBeInViewport();
    }
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    "Workshop purchases, defeat rewards, restart, reload persistence, boss HUD and responsive layout passed.",
  );
} finally {
  await browser.close();
}

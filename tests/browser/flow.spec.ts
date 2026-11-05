import { test, expect } from "@playwright/test";

test("full-HD framing, fixed background and a playable obstacle-to-gap rhythm", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.waitForFunction(() => (window as any).skateaway?.scene.isActive("Menu"));
  await page.evaluate(() => (window as any).skateaway.scene.start("Game"));
  await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Game"));
  const result = await page.evaluate(() => {
    const g = (window as any).skateaway.scene.getScene("Game");
    const opening = g.items.filter((item: any) => item.type !== "coin");
    const first = { count: opening.length, x: opening[0].x, speed: 430 };
    let jumps = 0, roofs = 0, previousRoof: any;
    // Use real production stepping and collisions, with a controller that follows
    // the same readable takeoff points as the coin guide. No invulnerability.
    for (let i = 0; i < 7200 && !g.dead; i++) {
      const speed = Math.min(600, 430 + g.distance / 300);
      const current = g.roofModels.find((roof: any) => g.motion.x >= roof.x && g.motion.x < roof.x + roof.w);
      if (current && current !== previousRoof) { roofs++; previousRoof = current; }
      if (g.motion.grounded && current) {
        const hazard = g.items.find((item: any) => item.type !== "coin" && item.x > g.motion.x && item.x < current.x + current.w);
        if (current.x + current.w - g.motion.x <= 45 || (hazard && hazard.x - g.motion.x <= speed * 920 / 2700)) {
          g.motion.requestJump();
          jumps++;
        }
      }
      g.fixedUpdate(1 / 120);
    }
    g.update(0, 0);
    return {
      dead: g.dead, jumps, roofs, coins: g.coins, distance: g.distance, first,
      sky: g.sky.tilePositionX, city: g.far.tilePositionX, scrollY: g.cameras.main.scrollY,
      bases: g.roofs.every((view: any) => Math.abs(view.art.y + view.art.displayHeight - 1080) < 0.01),
      canvas: [g.scale.width, g.scale.height],
    };
  });
  expect(result.dead, JSON.stringify(result)).toBe(false);
  expect(result.canvas).toEqual([1920, 1080]);
  expect(result.first.count).toBeGreaterThanOrEqual(3);
  expect(result.first.x).toBeGreaterThanOrEqual(220 + result.first.speed * 1.8);
  expect(result.jumps).toBeGreaterThan(10);
  expect(result.roofs).toBeGreaterThan(5);
  expect(result.coins).toBeGreaterThan(10);
  expect(result.bases).toBe(true);
  expect(result.scrollY).toBe(0);
  expect(result.sky).toBe(0);
  expect(result.city).toBeCloseTo(result.distance * 0.06);
  expect(errors).toEqual([]);
});

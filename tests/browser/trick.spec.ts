import { test, expect, type Page } from "@playwright/test";

async function tap(page: Page, x: number, y: number) {
  const box = (await page.locator("canvas").boundingBox())!;
  await page.touchscreen.tap(box.x + x / 1334 * box.width, box.y + y / 750 * box.height);
}
async function state(page: Page) {
  return page.evaluate(() => {
    const g = (window as any).skateaway.scene.getScene("Game");
    return { points: g.tricks.points, combo: g.tricks.combo, pending: g.tricks.pending,
      jumps: g.motion.jumps, hint: g.trickHint.text, dead: g.dead, buffer: g.motion.buffer };
  });
}
async function step(page: Page, count = 1) {
  await page.evaluate((n) => {
    const g = (window as any).skateaway.scene.getScene("Game");
    for (let i = 0; i < n && !g.dead; i++) g.fixedUpdate(1 / 120);
  }, count);
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 844, height: 390 }, { width: 390, height: 844 }]) {
  test(`trick inputs, banking, combo, crash and retry ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto("/");
    await page.waitForFunction(() => (window as any).skateaway?.scene.isActive("Menu"));
    await tap(page, 930, 365);
    await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Game"));
    // Freeze automatic stepping, retain real Phaser input and production collision logic.
    await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      g.update = () => {};
      g.items.forEach((item: any) => item.sprite.setVisible(false));
      g.items = [];
      g.roofs = [g.roofs[0]];
      g.roofs[0].roof.w = 100000;
      g.roofModels = [g.roofs[0].roof];
    });
    await page.keyboard.press("j");
    expect((await state(page)).pending).toBe(false);
    for (let flight = 1; flight <= 6; flight++) {
      await page.keyboard.press("Space");
      await step(page);
      if (flight % 2) await page.keyboard.press("j");
      else await tap(page, 1224, 650);
      expect((await state(page)).pending).toBe(true);
      expect((await state(page)).buffer).toBe(0); // Trick touch must not trigger jump.
      const before = (await state(page)).points;
      await page.keyboard.press("j");
      await tap(page, 1224, 650);
      expect((await state(page)).points).toBe(before);
      await page.keyboard.press("Space");
      await step(page);
      expect((await state(page)).jumps).toBe(2);
      await page.keyboard.press("Space");
      await step(page);
      expect((await state(page)).jumps).toBe(2);
      await step(page, 150);
      const s = await state(page);
      expect(s.points - before).toBe(100 * Math.min(flight, 5));
      expect(s.combo).toBe(Math.min(flight, 5));
      expect(s.pending).toBe(false);
      expect(s.hint).toContain(`KICKFLIP +${100 * Math.min(flight, 5)}`);
      if (flight > 1) expect(s.hint).toContain(`COMBO ×${Math.min(flight, 5)}`);
    }
    await page.keyboard.press("Space");
    await step(page);
    await step(page, 100);
    expect((await state(page)).combo).toBe(0);
    await page.keyboard.press("Space");
    await step(page);
    await page.keyboard.press("j");
    await page.keyboard.press("p");
    await page.waitForFunction(() => (window as any).skateaway.scene.isPaused("Game"));
    expect((await state(page)).pending).toBe(true);
    await tap(page, 667, 275);
    await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Game"));
    // Landing and hazard on the same step must discard the pending award.
    await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      g.motion.y = 439.99;
      g.motion.vy = 30;
      g.addItem(g.motion.x + 3, 440, "cone");
    });
    await step(page);
    expect(await state(page)).toMatchObject({ dead: true, pending: false, combo: 0, points: 2000 });
    await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Overlay"));
    await tap(page, 667, 505);
    await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Game"));
    expect(await state(page)).toMatchObject({ pending: false, combo: 0, points: 0, dead: false });
    // A pending trick is also cancelled by the actual fall death path.
    await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      g.update = () => {};
      g.motion.grounded = false;
      g.motion.y = 709;
      g.performTrick();
      g.fixedUpdate(1 / 120);
    });
    expect(await state(page)).toMatchObject({ dead: true, pending: false, combo: 0, points: 0 });
    expect(errors).toEqual([]);
  });
}

import { test, expect, Page } from "@playwright/test";
async function clickAt(page: Page, x: number, y: number) {
  const box = await page.locator("canvas").boundingBox();
  const px = box!.x + (x / 750) * box!.width,
    py = box!.y + (y / 1334) * box!.height;
  if (page.viewportSize()!.width < 500) await page.touchscreen.tap(px, py);
  else await page.mouse.click(px, py);
}
async function scene(page: Page, key: string) {
  await page.waitForFunction(
    (k) => (window as any).skateaway?.scene.isActive(k),
    key,
  );
}
for (const viewport of [
  { width: 1200, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`playable loop ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await scene(page, "Menu");
    await page.screenshot({ path: `work/menu-${viewport.width}.png` });
    await clickAt(page, 125, 1140);
    await scene(page, "Overlay");
    await clickAt(page, 510, 610);
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("skateaway.v1")!).music,
      ),
    ).toBe(false);
    await clickAt(page, 375, 980);
    await clickAt(page, 625, 1140);
    await scene(page, "Overlay");
    await clickAt(page, 375, 1080);
    const bounds = await page.locator("canvas").boundingBox();
    expect(bounds!.height).toBeLessThanOrEqual(viewport.height + 1);
    expect(bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
    await clickAt(page, 375, 995);
    await scene(page, "Game");
    await page.keyboard.press("Space");
    await page.waitForTimeout(80);
    expect(
      await page.evaluate(
        () => (window as any).skateaway.scene.getScene("Game").motion.jumps,
      ),
    ).toBe(1);
    await clickAt(page, 375, 700);
    await page.waitForTimeout(60);
    expect(
      await page.evaluate(
        () => (window as any).skateaway.scene.getScene("Game").motion.jumps,
      ),
    ).toBe(2);
    await page.keyboard.press("Space");
    await page.waitForTimeout(60);
    expect(
      await page.evaluate(
        () => (window as any).skateaway.scene.getScene("Game").motion.jumps,
      ),
    ).toBe(2);
    await page.keyboard.press("KeyP");
    await scene(page, "Overlay");
    const d = await page.evaluate(
      () => (window as any).skateaway.scene.getScene("Game").distance,
    );
    await page.waitForTimeout(180);
    expect(
      await page.evaluate(
        () => (window as any).skateaway.scene.getScene("Game").distance,
      ),
    ).toBe(d);
    await clickAt(page, 375, 610);
    await scene(page, "Game");
    await page.screenshot({ path: `work/game-${viewport.width}.png` });
    // Place a real collectible in the player's swept path, then use actual game collision.
    await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      g.addItem(g.motion.x + 8, g.motion.y - 65, "coin");
    });
    await page.waitForTimeout(80);
    expect(
      await page.evaluate(
        () => (window as any).skateaway.scene.getScene("Game").coins,
      ),
    ).toBeGreaterThan(0);
    // Exercise hazard collision on the currently occupied roof.
    await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      g.addItem(g.motion.x + 8, g.motion.y, "cone");
    });
    await scene(page, "Overlay");
    expect(
      await page.evaluate(
        () => (window as any).skateaway.scene.getScene("Game").dead,
      ),
    ).toBe(true);
    await page.screenshot({ path: `work/over-${viewport.width}.png` });
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("skateaway.v1")!).records.length,
      ),
    ).toBe(1);
    await clickAt(page, 375, 865);
    await scene(page, "Game");
    expect(
      await page.evaluate(
        () => (window as any).skateaway.scene.getScene("Game").coins,
      ),
    ).toBe(0);
    // Natural no-input run must end on a generated obstacle or gap.
    await scene(page, "Overlay");
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("skateaway.v1")!).records.length,
      ),
    ).toBe(2);
    await clickAt(page, 375, 1030);
    await scene(page, "Menu");
    await page.reload();
    await scene(page, "Menu");
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("skateaway.v1")!).music,
      ),
    ).toBe(false);
    expect(errors).toEqual([]);
  });
}

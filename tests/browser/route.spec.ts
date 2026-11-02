import { test, expect } from "@playwright/test";

for (const viewport of [{ width: 1334, height: 750 }, { width: 844, height: 390 }]) {
  test(`route polish and replay timing ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    await page.waitForFunction(() => (window as any).skateaway?.scene.isActive("Menu"));
    await page.evaluate(() => (window as any).skateaway.scene.start("Game"));
    await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Game"));
    const opening = await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      g.populateUntil(4000);
      return {
        kinds: g.roofs.slice(0, 3).map((view: any) => view.roof.kind),
        heights: g.roofs.slice(0, 3).map((view: any) => view.roof.y),
        height: g.player.bodyArt.displayHeight,
        width: g.player.bodyArt.displayWidth,
        coins: g.items.filter((item: any) => item.type === "coin").map((item: any) => item.x),
      };
    });
    expect(opening.kinds).toEqual([1, 2, 6]);
    expect(opening.heights).toEqual([440, 440, 380]);
    expect(opening.height).toBeCloseTo(324);
    expect(opening.width).toBeLessThanOrEqual(324);
    expect(opening.coins.length).toBeGreaterThan(5);
    for (let i = 1; i < opening.coins.length; i++)
      expect(opening.coins[i] - opening.coins[i - 1]).toBeCloseTo(324);
    await page.waitForFunction(() => (window as any).skateaway.scene.getScene("Game").coins > 0);
    await page.keyboard.press("Space");
    await page.waitForTimeout(90);
    await page.keyboard.press("Space");
    await page.waitForTimeout(180);
    const top = await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      return g.motion.y - g.player.bodyArt.displayHeight - g.cameras.main.scrollY;
    });
    expect(top).toBeGreaterThanOrEqual(109);
    await page.screenshot({ path: `work/route-${viewport.width}.png` });
    // Exercise facade collision, then ensure the replay UI gives the crash time to show.
    await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      const x = g.motion.x;
      g.motion.y = 500;
      g.roofModels = [{ x: x + 19, y: 380, w: 1000, kind: 6 }];
      g.player.crashArt.once("animationcomplete", () => { g.crashCompletedAt = g.time.now; });
      (window as any).skateaway.scene.getScene("Overlay").events.once("create", () => {
        g.replayShownAt = g.time.now;
      });
      g.fixedUpdate(1 / 120);
    });
    await page.waitForFunction(() => (window as any).skateaway.scene.getScene("Game").dead);
    expect(await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      return { hidden: !g.player.bodyArt.visible, visible: g.player.crashArt.visible,
        playing: g.player.crashArt.anims.isPlaying, texture: g.player.crashArt.texture.key };
    })).toEqual({ hidden: true, visible: true, playing: true, texture: "crash" });
    await page.waitForTimeout(650);
    expect(await page.evaluate(() => (window as any).skateaway.scene.isActive("Overlay"))).toBe(false);
    await page.waitForFunction(() => !(window as any).skateaway.scene.getScene("Game").player.crashArt.anims.isPlaying);
    expect(await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      return { frame: g.player.crashArt.frame.name, overlay: g.scene.isActive("Overlay") };
    })).toEqual({ frame: 3, overlay: false });
    await page.screenshot({ path: `work/crash-${viewport.width}.png` });
    await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Overlay"));
    expect(await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      return g.replayShownAt - g.crashCompletedAt;
    })).toBeGreaterThanOrEqual(390);
    const box = (await page.locator("canvas").boundingBox())!;
    await page.touchscreen.tap(box.x + 667 / 1334 * box.width, box.y + 505 / 750 * box.height);
    await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Game"));
    expect(await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      return { dead: g.dead, body: g.player.bodyArt.visible, crash: g.player.crashArt.visible };
    })).toEqual({ dead: false, body: true, crash: false });
    expect(errors).toEqual([]);
  });
}

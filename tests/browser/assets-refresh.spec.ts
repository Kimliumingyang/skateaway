import { test, expect, type Page } from "@playwright/test";
import { clickUI } from "./ui-helpers";

async function jump(page: Page, touch: boolean) {
  if (touch) {
    const canvas = (await page.locator("canvas").boundingBox())!;
    await page.touchscreen.tap(canvas.x + canvas.width * 0.3, canvas.y + canvas.height * 0.5);
  } else {
    await page.keyboard.press("Space", { delay: 40 });
  }
  await page.waitForFunction(() => (window as any).skateaway.scene.getScene("Game").motion.buffer > 0);
}

async function step(page: Page, count = 1) {
  await page.evaluate(n => {
    const g = (window as any).skateaway.scene.getScene("Game");
    for (let i = 0; i < n && !g.dead; i++) {
      g.fixedUpdate(1 / 120);
      g.update(0, 0);
    }
  }, count);
}

async function artState(page: Page) {
  return page.evaluate(() => {
    const g = (window as any).skateaway.scene.getScene("Game");
    return {
      jumps: g.motion.jumps,
      grounded: g.motion.grounded,
      dead: g.dead,
      starts: g.jumpAnimationStarts,
      body: g.player.bodyArt.visible,
      jump: g.player.jumpArt.visible,
      double: g.player.doubleArt.visible,
      crash: g.player.crashArt.visible,
      playing: g.player.activeArt.anims?.isPlaying ?? false,
      animation: g.player.activeArt.anims?.currentAnim?.key ?? null,
      active: g.player.activeArt === g.player.doubleArt ? "double" : g.player.activeArt === g.player.jumpArt ? "jump" : "body",
    };
  });
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 844, height: 390 }]) {
  const touch = viewport.width < 1000;
  test(`supplied jump animations follow ${touch ? "touch" : "keyboard"} input and reset on retry`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    await page.waitForFunction(() => (window as any).skateaway?.scene.isActive("Menu"));
    await clickUI(page, "Menu", "play");
    await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Game"));
    const decorations = await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      // Keep input and Phaser animation timing live while stepping real physics on a safe roof.
      g.sys.sceneUpdate = () => {};
      g.populateUntil(6500);
      const decorations = {
        textures: g.roofs.slice(0, 3).map((view: any) => view.billboard.texture.key),
        visible: g.roofs.every((view: any) => view.billboard.visible &&
          view.billboard.displayHeight > 0 && view.billboard.displayHeight <= 135.01 &&
          view.billboard.displayWidth <= view.roof.w * 0.68 + 0.01 &&
          view.billboard.y - view.billboard.displayHeight / 2 > view.roof.y &&
          view.billboard.y + view.billboard.displayHeight / 2 <= 1080),
        supportsUnchanged: g.roofModels.length === g.roofs.length &&
          g.roofModels.every((model: any, index: number) => model === g.roofs[index].roof),
        separateFromItems: g.roofs.every((view: any) =>
          !g.items.some((item: any) => item.sprite === view.billboard)),
      };
      g.populateUntil = () => {};
      g.items.forEach((item: any) => item.sprite.setVisible(false));
      g.items = [];
      g.roofs = [g.roofs[0]];
      g.roofs[0].roof.w = 100000;
      g.roofModels = [g.roofs[0].roof];
      Object.assign(g.motion, { x: 240, y: 720, vy: 0, jumps: 0, grounded: true, buffer: 0 });
      g.jumpAnimationStarts = [];
      g.player.jumpArt.on("animationstart", (animation: any) => g.jumpAnimationStarts.push(animation.key));
      g.player.doubleArt.on("animationstart", (animation: any) => g.jumpAnimationStarts.push(animation.key));
      g.update(0, 0);
      return decorations;
    });

    expect(decorations).toEqual({ textures: ["yidd", "hotel", "yidd"],
      visible: true, supportsUnchanged: true, separateFromItems: true });

    expect(await artState(page)).toMatchObject({ jumps: 0, grounded: true,
      starts: [], body: true, jump: false, crash: false, playing: false, active: "body" });
    await jump(page, touch);
    await step(page);
    expect(await artState(page)).toMatchObject({ jumps: 1, grounded: false,
      starts: ["jump-first"], body: false, jump: true, playing: true,
      animation: "jump-first", active: "jump" });
    await step(page, 24);
    expect((await artState(page)).starts).toEqual(["jump-first"]);
    await page.screenshot({ path: `work/jump-first-${viewport.width}.png` });

    await jump(page, touch);
    await step(page);
    expect(await artState(page)).toMatchObject({ jumps: 2, grounded: false,
      starts: ["jump-first", "jump-double-v21"], body: false, jump: false, double: true,
      playing: true, animation: "jump-double-v21", active: "double" });
    await jump(page, touch);
    await step(page, 30);
    expect(await artState(page)).toMatchObject({ jumps: 2, grounded: false,
      starts: ["jump-first", "jump-double-v21"], animation: "jump-double-v21" });
    await page.screenshot({ path: `work/jump-double-${viewport.width}.png` });

    await page.waitForFunction(() => !(window as any).skateaway.scene.getScene("Game").player.doubleArt.anims.isPlaying);
    expect(await artState(page)).toMatchObject({ grounded: false, body: false,
      double: true, playing: false, starts: ["jump-first", "jump-double-v21"] });
    await step(page, 150);
    expect(await artState(page)).toMatchObject({ jumps: 0, grounded: true,
      starts: ["jump-first", "jump-double-v21"], body: true, jump: false, double: false,
      crash: false, playing: false, active: "body" });

    await jump(page, touch);
    await step(page);
    await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      g.addItem(g.motion.x + 3, 720, "warning");
    });
    await step(page);
    expect(await artState(page)).toMatchObject({ dead: true, body: false,
      jump: false, crash: true, playing: false,
      starts: ["jump-first", "jump-double-v21", "jump-first"] });
    await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Overlay"));
    await clickUI(page, "Overlay", "retry");
    await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Game"));
    await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      g.sys.sceneUpdate = () => {};
    });
    expect(await artState(page)).toMatchObject({ dead: false, jumps: 0,
      grounded: true, body: true, jump: false, crash: false,
      playing: false, animation: null, active: "body" });
    await jump(page, touch);
    await step(page);
    expect(await artState(page)).toMatchObject({ dead: false, jumps: 1,
      grounded: false, body: false, jump: true, crash: false,
      animation: "jump-first", active: "jump" });
    expect(errors).toEqual([]);
  });
}

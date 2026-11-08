import { test, expect } from "@playwright/test";
import { clickUI } from "./ui-helpers";

test("v2.1 interactions animate, bounce once, record seagull death and reset on retry", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.waitForFunction(() => (window as any).skateaway?.scene.isActive("Menu"));
  await clickUI(page, "Menu", "play");
  await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Game"));
  const state = await page.evaluate(() => {
    const g = (window as any).skateaway.scene.getScene("Game");
    g.sys.sceneUpdate = () => {};
    const firstTen = g.generator.opening;
    const x = g.motion.x;
    g.interactions.spawn({ x: x - 580, y: 720, w: 1000, kind: 4 }, 16);
    const balloon = g.interactions.balloons.at(-1);
    Object.assign(g.motion, { x: balloon.x, y: balloon.y - 40, vy: 120, grounded: false });
    let bounces = 0;
    g.interactions.step(1 / 120, g.motion, 430, () => {}, () => { bounces++; g.motion.vy = -1058; });
    g.interactions.step(1 / 120, g.motion, 430, () => {}, () => { bounces++; });
    const balloonState = balloon.state;
    g.interactions.spawn({ x: x - 760, y: 720, w: 1000, kind: 3 }, 12);
    const bird = g.interactions.birds.at(-1);
    Object.assign(g.motion, { x: bird.x, y: bird.y + 90, vy: 0, grounded: false });
    g.interactions.step(1 / 120, g.motion, 430,
      () => g.die("impact", "HIT A SILLY SEAGULL", "SEAGULL"), () => {});
    return { firstTen, balloonState, bounces, dead: g.dead, deathCause: g.deathCause,
      recordCause: JSON.parse(localStorage.getItem("skateaway.v1")!).records[0].deathCause };
  });
  expect(state).toMatchObject({ firstTen: [1, 2, 4, 3, 5, 6, 4, 7, 6, 8],
    balloonState: "SHAKING", bounces: 1, dead: true, deathCause: "SEAGULL", recordCause: "SEAGULL" });
  await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Overlay"));
  await clickUI(page, "Overlay", "retry");
  await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Game"));
  expect(await page.evaluate(() => {
    const g = (window as any).skateaway.scene.getScene("Game");
    return { dead: g.dead, birds: g.interactions.birds.length, balloons: g.interactions.balloons.length };
  })).toEqual({ dead: false, birds: 0, balloons: 0 });
  expect(errors).toEqual([]);
});

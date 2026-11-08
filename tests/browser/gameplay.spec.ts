import { test, expect, type Page } from "@playwright/test";
import { BASE_RUN_SPEED, COIN_FOOT_OFFSET } from "../../src/game/WorldConfig.ts";
import { HAZARDS, PLATFORM_ITEMS } from "../../src/game/systems/LevelItems.ts";
import { clickUI } from "./ui-helpers";

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on("pageerror", error => messages.push(error.message));
  await page.goto("/");
  await page.waitForFunction(() => (window as any).skateaway?.scene.isActive("Menu"));
  await clickUI(page, "Menu", "play");
  await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Game"));
  await page.evaluate(() => {
    const g = (window as any).skateaway.scene.getScene("Game");
    // Stop only the automatic scene update; input, collision, timers and results stay real.
    g.sys.sceneUpdate = () => {};
    g.populateUntil = () => {};
    g.items.forEach((item: any) => item.sprite.setVisible(false));
    g.items = [];
    g.roofs = [g.roofs[0]];
    g.roofs[0].roof.w = 100000;
    g.roofModels = [g.roofs[0].roof];
    Object.assign(g.motion, { x: 240, y: 720, vy: 0, jumps: 0, grounded: true, buffer: 0 });
    g.distance = g.tick = 0;
    g.lastSupport = g.roofModels[0];
  });
});

test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

test("cone, box and banana hits cancel landing awards and preserve the run", async ({ page }) => {
  const hits = await page.evaluate(() => {
    const g = (window as any).skateaway.scene.getScene("Game");
    return ["cone", "box", "banana"].map(type => {
      g.graceRemaining = g.stumbleRemaining = 0;
      g.tricks.award(100);
      const pointsBefore = g.tricks.points;
      Object.assign(g.motion, { y: 719.99, vy: 30, grounded: false, jumps: 1 });
      g.performTrick();
      const pendingBefore = g.tricks.pending;
      g.addItem(g.motion.x + 3, 720, type);
      const item = g.items.at(-1);
      g.fixedUpdate(1 / 120);
      return { type, pendingBefore, dead: g.dead, pending: g.tricks.pending,
        combo: g.tricks.combo, pointsBefore, pointsAfter: g.tricks.points,
        successfulTricks: g.successfulTricks, active: item.active,
        visible: item.sprite.visible, stumble: g.stumbleRemaining };
    });
  });
  for (const hit of hits) {
    expect(hit).toMatchObject({ pendingBefore: true, dead: false, pending: false,
      combo: 0, successfulTricks: 0, active: false, visible: false });
    expect(hit.pointsAfter).toBe(hit.pointsBefore);
    expect(hit.stumble).toBeCloseTo(hit.type === "banana" ? 0.6 : 0.25);
  }
});

test("a crack ends the run through the fall path and cancels pending style", async ({ page }) => {
  const result = await page.evaluate(() => {
    const g = (window as any).skateaway.scene.getScene("Game");
    Object.assign(g.motion, { y: 719.99, vy: 30, grounded: false, jumps: 1 });
    g.performTrick();
    g.addItem(g.motion.x + 3, 720, "crack");
    g.fixedUpdate(1 / 120);
    return { dead: g.dead, reason: g.deathReason, points: g.tricks.points,
      pending: g.tricks.pending, combo: g.tricks.combo, crash: g.player.crashArt.visible };
  });
  expect(result).toEqual({ dead: true, reason: "MISSED THE CRACK", points: 0,
    pending: false, combo: 0, crash: false });
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`banana locks keyboard and touch tricks for 0.6 active seconds ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      g.addItem(g.motion.x + 3, 720, "banana");
      g.fixedUpdate(1 / 120);
      Object.assign(g.motion, { y: 500, vy: 0, grounded: false, jumps: 1 });
    });
    await page.keyboard.press("j");
    await clickUI(page, "Game", "trick");
    expect(await page.evaluate(() => (window as any).skateaway.scene.getScene("Game").tricks.pending)).toBe(false);
    await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      for (let i = 0; i < 71; i++) g.fixedUpdate(1 / 120);
      Object.assign(g.motion, { y: 500, vy: 0, grounded: false, jumps: 1 });
    });
    await page.keyboard.press("j");
    expect(await page.evaluate(() => (window as any).skateaway.scene.getScene("Game").tricks.pending)).toBe(false);
    await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      g.fixedUpdate(1 / 120);
    });
    await clickUI(page, "Game", "trick");
    await expect.poll(() => page.evaluate(() => (window as any).skateaway.scene.getScene("Game").tricks.pending)).toBe(true);
    expect(await page.evaluate(() => {
      const g = (window as any).skateaway.scene.getScene("Game");
      return { dead: g.dead, lock: g.stumbleRemaining, buffer: g.motion.buffer };
    })).toEqual({ dead: false, lock: 0, buffer: 0 });
  });
}

for (const type of Object.keys(PLATFORM_ITEMS) as (keyof typeof PLATFORM_ITEMS)[]) {
  test(`${type} permits ascent and side entry, and banks a trick on top`, async ({ page }) => {
    const result = await page.evaluate(({ type, size }) => {
      const g = (window as any).skateaway.scene.getScene("Game");
      const x = g.motion.x + 40, top = 580;
      g.addItem(x, top, type);
      const item = g.items.at(-1);
      Object.assign(g.motion, { x: x - 5, y: top + 10, vy: -600, grounded: false, jumps: 1 });
      for (let i = 0; i < 8; i++) g.fixedUpdate(1 / 120);
      const ascent = { above: g.motion.y < top, grounded: g.motion.grounded, dead: g.dead };
      Object.assign(g.motion, { x: item.model.x - 22, y: top + 20, vy: 0, grounded: false });
      for (let i = 0; i < 2; i++) g.fixedUpdate(1 / 120);
      const side = { entered: g.motion.x + 18 > item.model.x, grounded: g.motion.grounded, dead: g.dead };
      Object.assign(g.motion, { x: x - 5, y: top - 0.01, vy: 30, grounded: false });
      g.performTrick();
      g.fixedUpdate(1 / 120);
      return { ascent, side, model: item.model, artBottom: item.sprite.y,
        artHeight: item.sprite.displayHeight, size,
        landing: { grounded: g.motion.grounded, y: g.motion.y, dead: g.dead,
          pending: g.tricks.pending, points: g.tricks.points, tricks: g.successfulTricks } };
    }, { type, size: PLATFORM_ITEMS[type] });
    expect(result.ascent).toEqual({ above: true, grounded: false, dead: false });
    expect(result.side).toEqual({ entered: true, grounded: false, dead: false });
    expect(result.model.w).toBe(result.size.width);
    expect(result.artHeight).toBeCloseTo(result.size.height);
    expect(result.artBottom - result.artHeight).toBeCloseTo(result.model.y);
    expect(result.landing).toEqual({ grounded: true, y: 580, dead: false, pending: false, points: 100, tricks: 1 });
  });
}

test("rocket flies for three seconds and waits above a gap for a protected exit", async ({ page }) => {
  const result = await page.evaluate(({ footOffset }) => {
    const g = (window as any).skateaway.scene.getScene("Game");
    g.roofModels = [{ x: -100, y: 720, w: 550, kind: 1 }, { x: 2100, y: 640, w: 5000, kind: 6 }];
    g.motion.grounded = false;
    g.performTrick();
    g.addItem(g.motion.x + 3, g.motion.y - footOffset, "rocket");
    const pickup = g.items.at(-1);
    g.addItem(2130, 640, "warning");
    g.fixedUpdate(1 / 120);
    const collected = { active: pickup.active, flying: g.rocketFlying,
      remaining: g.rocketRemaining, pending: g.tricks.pending };
    const x = g.motion.x;
    for (let i = 0; i < 359; i++) g.fixedUpdate(1 / 120);
    const beforeExpiry = { flying: g.rocketFlying, remaining: g.rocketRemaining,
      progress: g.motion.x - x, dead: g.dead };
    for (let i = 0; i < 2; i++) g.fixedUpdate(1 / 120);
    const overGap = { flying: g.rocketFlying, remaining: g.rocketRemaining,
      x: g.motion.x, y: g.motion.y, dead: g.dead };
    for (let i = 0; i < 300 && g.rocketFlying && !g.dead; i++) g.fixedUpdate(1 / 120);
    const exit = { flying: g.rocketFlying, grace: g.graceRemaining,
      x: g.motion.x, y: g.motion.y, dead: g.dead };
    for (let i = 0; i < 100 && !g.dead; i++) g.fixedUpdate(1 / 120);
    return { collected, beforeExpiry, overGap, exit,
      landed: { grounded: g.motion.grounded, y: g.motion.y, dead: g.dead } };
  }, { footOffset: COIN_FOOT_OFFSET });
  expect(result.collected).toEqual({ active: false, flying: true, remaining: 3, pending: false });
  expect(result.beforeExpiry).toMatchObject({ flying: true, dead: false });
  expect(result.beforeExpiry.remaining).toBeGreaterThan(0);
  expect(result.beforeExpiry.remaining).toBeLessThan(0.02);
  expect(result.beforeExpiry.progress).toBeCloseTo(BASE_RUN_SPEED * 1.3 * 359 / 120);
  expect(result.overGap).toMatchObject({ flying: true, remaining: 0, dead: false });
  expect(result.overGap.x).toBeLessThan(2100);
  expect(result.overGap.y).toBeLessThanOrEqual(520);
  expect(result.exit).toMatchObject({ flying: false, grace: 0.8, y: 610, dead: false });
  expect(result.exit.x).toBeGreaterThanOrEqual(2100);
  expect(result.landed).toEqual({ grounded: true, y: 640, dead: false });
});

test("rocket expiry at a roof edge continues to the next roof with landing room", async ({ page }) => {
  const result = await page.evaluate(({ speed }) => {
    const g = (window as any).skateaway.scene.getScene("Game");
    const low = { x: -100, y: 720, w: 800, kind: 1 };
    const safe = { x: 950, y: 640, w: 3000, kind: 6 };
    g.roofModels = [low, safe];
    // The last flight step expires five pixels before the occupied roof ends.
    g.rocketFlying = true;
    g.rocketRemaining = 1 / 120;
    Object.assign(g.motion, { x: 695 - speed * 1.3 / 120, y: 500,
      vy: 0, grounded: false, jumps: 1, buffer: 0 });
    g.fixedUpdate(1 / 120);
    const edge = { flying: g.rocketFlying, remaining: g.rocketRemaining,
      x: g.motion.x, dead: g.dead };
    for (let i = 0; i < 200 && g.rocketFlying && !g.dead; i++) g.fixedUpdate(1 / 120);
    const exit = { flying: g.rocketFlying, x: g.motion.x,
      grace: g.graceRemaining, dead: g.dead };
    for (let i = 0; i < 100 && !g.dead; i++) g.fixedUpdate(1 / 120);
    return { edge, exit, landed: { grounded: g.motion.grounded, y: g.motion.y, dead: g.dead } };
  }, { speed: BASE_RUN_SPEED });
  expect(result.edge).toEqual({ flying: true, remaining: 0, x: 695, dead: false });
  expect(result.exit).toMatchObject({ flying: false, grace: 0.8, dead: false });
  expect(result.exit.x).toBeGreaterThanOrEqual(950);
  expect(result.landed).toEqual({ grounded: true, y: 640, dead: false });
});

test("a near miss rewards each hazard once and advances the shared style combo", async ({ page }) => {
  const result = await page.evaluate(({ height }) => {
    const g = (window as any).skateaway.scene.getScene("Game");
    const cross = (x: number) => {
      Object.assign(g.motion, { x: x - 1, y: 720 - height - 10, vy: 0,
        grounded: false, jumps: 1, buffer: 0 });
      g.fixedUpdate(1 / 120);
      return { points: g.tricks.points, combo: g.tricks.combo, dead: g.dead };
    };
    const x = g.motion.x + 50;
    g.addItem(x, 720, "warning");
    const first = cross(x), repeated = cross(x);
    g.addItem(x + 100, 720, "warning");
    const second = cross(x + 100);
    return { first, repeated, second,
      awarded: g.items.map((item: any) => item.nearMissAwarded), hint: g.trickHint.text };
  }, { height: HAZARDS.warning.height });
  expect(result.first).toEqual({ points: 75, combo: 1, dead: false });
  expect(result.repeated).toEqual(result.first);
  expect(result.second).toEqual({ points: 188, combo: 2, dead: false });
  expect(result.awarded).toEqual([true, true]);
  expect(result.hint).toContain("NEAR MISS +113");
});

test("clean landing requires a crossed gap and the inclusive 20–55 percent landing zone", async ({ page }) => {
  const cases = [
    { ratio: 0.19, gap: true, same: false, grace: false, award: 0 },
    { ratio: 0.2, gap: true, same: false, grace: false, award: 50 },
    { ratio: 0.55, gap: true, same: false, grace: false, award: 50 },
    { ratio: 0.56, gap: true, same: false, grace: false, award: 0 },
    { ratio: 0.35, gap: false, same: false, grace: false, award: 0 },
    { ratio: 0.35, gap: true, same: true, grace: false, award: 0 },
    { ratio: 0.35, gap: true, same: false, grace: true, award: 0 },
  ];
  const results = await page.evaluate(({ cases, speed }) => {
    const g = (window as any).skateaway.scene.getScene("Game");
    return cases.map(example => {
      const target = { x: 1000, y: 720, w: 600, kind: 1 };
      const from = { x: 0, y: 720, w: example.gap ? 800 : 1000, kind: 1 };
      g.roofModels = [from, target];
      g.takeoffRoof = example.same ? target : from;
      g.lastSupport = from;
      g.graceRemaining = example.grace ? 0.7 : 0;
      g.tricks.crash();
      g.trickHint.setText("");
      const before = g.tricks.points;
      Object.assign(g.motion, { x: target.x + target.w * example.ratio - speed / 120,
        y: 719.99, vy: 30, grounded: false, jumps: 1, buffer: 0 });
      g.fixedUpdate(1 / 120);
      return { award: g.tricks.points - before, grounded: g.motion.grounded,
        dead: g.dead, hint: g.trickHint.text };
    });
  }, { cases, speed: BASE_RUN_SPEED });
  for (const [i, result] of results.entries()) {
    expect(result, JSON.stringify(cases[i])).toMatchObject({ award: cases[i].award, grounded: true, dead: false });
    if (cases[i].award) expect(result.hint).toContain("CLEAN LANDING +50");
  }
});

test("completed missions settle once, appear in results and reset on free retry", async ({ page }) => {
  const settled = await page.evaluate(({ footOffset }) => {
    const g = (window as any).skateaway.scene.getScene("Game");
    for (let i = 0; i < 30; i++) g.addItem(g.motion.x + 3, g.motion.y - footOffset, "coin");
    g.fixedUpdate(1 / 120);
    g.tick = 60;
    g.fixedUpdate(1 / 120);
    const missions = g.missions.missions.map((mission: any) => ({ id: mission.id, complete: mission.complete }));
    g.addItem(g.motion.x + 3, 720, "warning");
    g.fixedUpdate(1 / 120);
    const once = JSON.parse(localStorage.getItem("skateaway.v1")!);
    g.die();
    g.die("fall");
    const repeated = JSON.parse(localStorage.getItem("skateaway.v1")!);
    return { missions, dead: g.dead, bonus: g.missionBonus, once, repeated,
      secondSettlement: g.missions.settle() };
  }, { footOffset: COIN_FOOT_OFFSET });
  expect(settled.missions).toEqual([{ id: "coins", complete: true }, { id: "survive", complete: true }]);
  expect(settled).toMatchObject({ dead: true, bonus: 90, secondSettlement: 0 });
  expect(settled.once.wallet).toBe(120);
  expect(settled.once.records).toHaveLength(1);
  expect(settled.once.records[0]).toMatchObject({ coins: 30, bonus: 90 });
  expect(settled.repeated).toEqual(settled.once);
  await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Overlay"));
  expect(await page.evaluate(() => {
    const overlay = (window as any).skateaway.scene.getScene("Overlay");
    return { coins: overlay.coins, bonus: overlay.bonus };
  })).toEqual({ coins: 30, bonus: 90 });
  await clickUI(page, "Overlay", "retry");
  await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Game"));
  expect(await page.evaluate(() => {
    const g = (window as any).skateaway.scene.getScene("Game");
    return { coins: g.coins, bonus: g.missionBonus,
      complete: g.missions.missions.some((mission: any) => mission.complete),
      wallet: JSON.parse(localStorage.getItem("skateaway.v1")!).wallet };
  })).toEqual({ coins: 0, bonus: 0, complete: false, wallet: 120 });
  await page.evaluate(() => (window as any).skateaway.scene.getScene("Game").die("fall"));
  expect(await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("skateaway.v1")!);
    return { wallet: saved.wallet, records: saved.records.length };
  })).toEqual({ wallet: 120, records: 2 });
});

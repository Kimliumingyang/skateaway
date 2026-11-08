import { test, expect } from "@playwright/test";
import { clickUI } from "./ui-helpers";

test("task entry, four tabs, in-run progress, pause and result rewards stay connected", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.waitForFunction(() => (window as any).skateaway?.scene.isActive("Menu"));
  await clickUI(page, "Menu", "challenges");
  await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Overlay"));
  expect(await page.evaluate(() => (window as any).skateaway.scene.getScene("Overlay").activeTab)).toBe("rookie");
  for (const tab of ["missions", "legends", "records", "rookie"]) {
    await clickUI(page, "Overlay", `challenge-${tab}`);
    expect(await page.evaluate(() => (window as any).skateaway.scene.getScene("Overlay").activeTab)).toBe(tab);
  }
  await clickUI(page, "Overlay", "challenge-missions");
  const preview = await page.evaluate(() => {
    const game = (window as any).skateaway;
    return { runSerial: JSON.parse(localStorage.getItem("skateaway.v1") || "null")?.runSerial ?? 0,
      next: game.scene.getScene("Overlay").origin };
  });
  expect(preview).toEqual({ runSerial: 0, next: "Menu" });
  await clickUI(page, "Overlay", "close");
  await clickUI(page, "Menu", "play");
  await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Game"));
  await page.evaluate(() => (window as any).skateaway.scene.getScene("Game").pause());
  await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Overlay"));
  await clickUI(page, "Overlay", "pause-challenges");
  expect(await page.evaluate(() => {
    const g = (window as any).skateaway.scene.getScene("Game");
    const o = (window as any).skateaway.scene.getScene("Overlay");
    return { tab: o.activeTab, ids: g.missions.missions.map((mission: any) => mission.id),
      runSerial: JSON.parse(localStorage.getItem("skateaway.v1")!).runSerial };
  })).toEqual({ tab: "missions", ids: ["M01", "M04"], runSerial: 1 });
  await clickUI(page, "Overlay", "close");
  expect(await page.evaluate(() => (window as any).skateaway.scene.getScene("Overlay").mode)).toBe("pause");
  await clickUI(page, "Overlay", "resume");
  await page.evaluate(() => {
    const g = (window as any).skateaway.scene.getScene("Game");
    g.sys.sceneUpdate = () => {};
    g.rookieEvent({ type: "land", order: 1 });
    g.legendEvent("doubles");
    g.die("fall", "FELL BETWEEN ROOFS");
  });
  await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Overlay"));
  expect(await page.evaluate(() => {
    const o = (window as any).skateaway.scene.getScene("Overlay");
    const saved = JSON.parse(localStorage.getItem("skateaway.v1")!);
    return { rookie: o.newRookies, legends: o.newLegends, rookieBonus: o.rookieBonus,
      wallet: saved.wallet, completed: saved.rookieCompleted,
      badge: !!saved.legendUnlocked.firstFlight };
  })).toEqual({ rookie: ["R01"], legends: ["firstFlight"], rookieBonus: 10,
    wallet: 10, completed: ["R01"], badge: true });
  await clickUI(page, "Overlay", "retry");
  await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Game"));
  expect(await page.evaluate(() => {
    const g = (window as any).skateaway.scene.getScene("Game");
    return { ids: g.missions.missions.map((mission: any) => mission.id),
      nextRookie: g.rookie.current?.id, pending: JSON.parse(localStorage.getItem("skateaway.v1")!).pendingRookieBonus };
  })).toEqual({ ids: ["M02", "M05"], nextRookie: "R02", pending: 0 });
  expect(errors).toEqual([]);
});

test("task tabs and pause entry are touch accessible in landscape", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.waitForFunction(() => (window as any).skateaway?.scene.isActive("Menu"));
  await clickUI(page, "Menu", "challenges");
  await clickUI(page, "Overlay", "challenge-legends");
  await clickUI(page, "Overlay", "challenge-records");
  await clickUI(page, "Overlay", "close");
  await clickUI(page, "Menu", "play");
  await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Game"));
  await page.evaluate(() => (window as any).skateaway.scene.getScene("Game").pause());
  await clickUI(page, "Overlay", "pause-challenges");
  expect(await page.evaluate(() => (window as any).skateaway.scene.getScene("Overlay").activeTab)).toBe("missions");
  await clickUI(page, "Overlay", "close");
  await clickUI(page, "Overlay", "resume");
  await page.waitForFunction(() => (window as any).skateaway.scene.isActive("Game"));
  expect(errors).toEqual([]);
});

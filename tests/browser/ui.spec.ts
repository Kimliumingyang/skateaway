import { test, expect } from "@playwright/test";
import { clickUI } from "./ui-helpers";

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 844, height: 390 },
]) {
  test(`graffiti UI, saved switches and real coin SFX ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem(
        "skateaway.v1",
        JSON.stringify({
          best: 9241,
          wallet: 745,
          records: [{ score: 9241, coins: 19, date: "2026-11-05" }],
          music: true,
          sfx: true,
        }),
      );
      (window as any).coinStarts = 0;
      const original = AudioContext.prototype.createBufferSource;
      AudioContext.prototype.createBufferSource = function () {
        const source = original.call(this),
          start = source.start.bind(source);
        source.start = (
          ...args: Parameters<AudioBufferSourceNode["start"]>
        ) => {
          (window as any).coinStarts++;
          start(...args);
        };
        return source;
      };
    });
    await page.goto("/");
    await page.waitForFunction(() =>
      (window as any).skateaway?.scene.isActive("Menu"),
    );
    expect(
      await page.evaluate(
        () =>
          document.fonts.check('32px "Permanent Marker"') &&
          document.fonts.check('700 24px "Kalam"'),
      ),
    ).toBe(true);
    await clickUI(page, "Menu", "ranking");
    await page.waitForFunction(() =>
      (window as any).skateaway.scene.isActive("Overlay"),
    );
    const text = await page.evaluate(() => {
      const flatten = (children: any[]): string[] =>
        children.flatMap((c) =>
          c.text ? [c.text] : c.list ? flatten(c.list) : [],
        );
      return flatten(
        (window as any).skateaway.scene.getScene("Overlay").children.list,
      ).join(" ");
    });
    expect(text).toContain("9,241");
    await page.screenshot({ path: `work/ui-ranking-${viewport.width}.png` });
    await clickUI(page, "Overlay", "close-ranking");
    await clickUI(page, "Menu", "settings");
    const soundAsset = page.waitForResponse(
      (response) =>
        response.url().includes("/sfx/coin.wav") && response.status() === 200,
    );
    await clickUI(page, "Overlay", "music");
    await soundAsset;
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("skateaway.v1")!).music)).toBe(false);
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("skateaway.v1")!).vibration,
      ),
    ).toBe(false);
    await clickUI(page, "Overlay", "sfx");
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("skateaway.v1")!).sfx)).toBe(false);
    await clickUI(page, "Overlay", "sfx");
    await page.screenshot({ path: `work/ui-settings-${viewport.width}.png` });
    await clickUI(page, "Overlay", "close");
    await clickUI(page, "Menu", "play");
    await page.waitForFunction(() =>
      (window as any).skateaway.scene.isActive("Game"),
    );
    const collect = () =>
      page.evaluate(() => {
        const g = (window as any).skateaway.scene.getScene("Game");
        g.addItem(g.motion.x + 8, g.motion.y - 74, "coin");
      });
    await collect();
    await page.waitForFunction(() => (window as any).coinStarts > 0);
    await clickUI(page, "Game", "pause");
    await page.waitForFunction(() =>
      (window as any).skateaway.scene.isPaused("Game"),
    );
    const distance = await page.evaluate(
      () => (window as any).skateaway.scene.getScene("Game").distance,
    );
    await clickUI(page, "Overlay", "settings");
    await clickUI(page, "Overlay", "sfx");
    await page.keyboard.press("Escape");
    expect(
      await page.evaluate(
        () => (window as any).skateaway.scene.getScene("Overlay").mode,
      ),
    ).toBe("pause");
    expect(
      await page.evaluate(
        () => (window as any).skateaway.scene.getScene("Game").distance,
      ),
    ).toBe(distance);
    await page.screenshot({ path: `work/ui-pause-${viewport.width}.png` });
    await clickUI(page, "Overlay", "resume");
    const starts = await page.evaluate(() => (window as any).coinStarts);
    await collect();
    await page.waitForTimeout(120);
    expect(await page.evaluate(() => (window as any).coinStarts)).toBe(starts);
    expect(errors).toEqual([]);
  });
}

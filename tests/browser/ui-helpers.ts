import { expect, type Page } from "@playwright/test";

/** Click the actual rendered control, respecting parent transforms and letterboxing. */
export async function clickUI(page: Page, sceneKey: string, name: string) {
  const position = await page.evaluate(
    ({ sceneKey, name }) => {
      const game = (window as any).skateaway;
      const scene = game.scene.getScene(sceneKey);
      const find = (children: any[]): any => {
        for (const child of children) {
          if (child.name === `ui-${name}`) return child;
          if (child.list) {
            const match = find(child.list);
            if (match) return match;
          }
        }
      };
      const target = find(scene.children.list);
      if (!target?.input?.enabled)
        throw new Error(`Missing interactive control: ${sceneKey}/${name}`);
      const point = target.getWorldTransformMatrix().transformPoint(0, 0);
      return { x: point.x / game.scale.width, y: point.y / game.scale.height };
    },
    { sceneKey, name },
  );
  const box = (await page.locator("canvas").boundingBox())!;
  expect(position.x).toBeGreaterThan(0);
  expect(position.x).toBeLessThan(1);
  expect(position.y).toBeGreaterThan(0);
  expect(position.y).toBeLessThan(1);
  const x = box.x + position.x * box.width,
    y = box.y + position.y * box.height;
  if (page.viewportSize()!.width < 1000) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

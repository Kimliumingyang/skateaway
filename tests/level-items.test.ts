import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutRoofItems } from "../src/game/systems/LevelItems.ts";

test("first roof starts without coins or instant hazards", () => {
  assert.deepEqual(layoutRoofItems({ x: -100, y: 440, w: 900, kind: 2 }, 0, 290), []);
});

test("coin trails sit above the roof and hazards stay on the surface", () => {
  for (let index = 1; index <= 1000; index++) {
    const roof = { x: index * 400, y: 330 + (index % 7) * 20, w: 360 + (index % 5) * 100, kind: 7 };
    const items = layoutRoofItems(roof, index, 290 + (index % 3) * 50);
    for (const item of items) {
      assert.ok(Number.isFinite(item.x) && Number.isFinite(item.y));
      if (item.type === "coin") {
        assert.ok(item.y <= roof.y - 65, "coins should be visibly above the deck");
      } else {
        assert.equal(item.y, roof.y, "hazards must touch the roof");
        assert.ok(item.x > roof.x && item.x < roof.x + roof.w);
      }
    }
    assert.ok(items.filter((item) => item.type !== "coin").length <= 1);
  }
});

test("short roofs never get unavoidable obstacles", () => {
  const roof = { x: 100, y: 440, w: 300, kind: 3 };
  for (let index = 1; index <= 20; index++) {
    const items = layoutRoofItems(roof, index, 420);
    assert.equal(items.filter((item) => item.type !== "coin").length, 0);
  }
});

test("gap-jump rewards use a consistent three-coin arc", () => {
  const roof = { x: 600, y: 390, w: 700, kind: 2 };
  const items = layoutRoofItems(roof, 3, 290);
  const leadIn = items.filter((item) => item.type === "coin" && item.x < roof.x);
  assert.equal(leadIn.length, 3);
  assert.ok(leadIn[1].y < leadIn[0].y);
});

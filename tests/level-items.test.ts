import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutRoofItems, gapRoute, layoutHazards, HAZARDS } from "../src/game/systems/LevelItems.ts";
import { COIN_SPACING, COIN_FOOT_OFFSET, PLAYER_SCREEN_X, deckWidth } from "../src/game/WorldConfig.ts";
import { GRAVITY, JUMP, PlatformGenerator, speedAt } from "../src/game/systems/Physics.ts";

test("opening bridge includes readable obstacles after an introductory run-up", () => {
  const first = { x: -100, y: 720, w: deckWidth(720, 1), kind: 1 };
  const next = new PlatformGenerator(() => 0.5).next(first, 430);
  const hazards = layoutHazards(first, 0, 430);
  assert.ok(hazards.length >= 2);
  assert.ok(hazards[0].x >= PLAYER_SCREEN_X + 430 * 1.8);
  assert.ok(hazards.every(item => item.x < first.x + first.w - 430 * 0.85));
  assert.equal(next.kind, 2);
});

test("coin grid stays 300px apart across roofs and gaps, without duplicate clusters", () => {
  const g = new PlatformGenerator(() => 0.5);
  const roofs = [{ x: -100, y: 720, w: deckWidth(720, 1), kind: 1 }];
  for (let i = 0; i < 1000; i++) roofs.push(g.next(roofs.at(-1)!, speedAt(i * 500)));
  const coins = roofs.slice(0, -1).flatMap((roof, index) =>
    layoutRoofItems(roof, index, 350, { previous: roofs[index - 1], next: roofs[index + 1] })
      .filter(item => item.type === "coin"));
  for (let i = 1; i < coins.length; i++) {
    assert.ok(Math.abs(coins[i].x - coins[i - 1].x - COIN_SPACING) < 1e-7);
    assert.ok(Number.isFinite(coins[i].y));
  }
});

test("gap coins follow the actual ballistic jump at character collection height", () => {
  const from = { x: 0, y: 720, w: 750, kind: 2 };
  const to = { x: 820, y: 640, w: 700, kind: 6 };
  const route = gapRoute(from, to, 430);
  const coin = layoutRoofItems(to, 2, 430, { previous: from }).find(item => item.type === "coin" && item.x <= route.end)!;
  assert.ok(coin, "a sampled pickup should guide the landing arc");
  const time = (coin.x - route.start) / 430;
  const foot = from.y - JUMP * time + GRAVITY * time * time / 2;
  assert.ok(Math.abs(coin.y - (foot - COIN_FOOT_OFFSET)) < 1e-7);
  assert.ok(coin.y < to.y - COIN_FOOT_OFFSET);
});

test("short roofs have no hazards; obstacle coins rise along a reachable jump", () => {
  const short = { x: 100, y: 720, w: 300, kind: 6 };
  assert.ok(layoutRoofItems(short, 2, 420).every(item => item.type === "coin"));
  const roof = { x: 0, y: 720, w: 2200, kind: 2 };
  const items = layoutRoofItems(roof, 2, 430);
  const hazard = items.find(item => item.type !== "coin")!;
  const coin = items.find(item => item.type === "coin" && Math.abs(item.x - hazard.x) < 30)!;
  assert.equal(hazard.y, roof.y);
  assert.ok(coin.y < roof.y - COIN_FOOT_OFFSET - 80);
});


test("hazard spacing reserves landing, edge takeoff and recovery at all speeds", () => {
  for (const speed of [430, 500, 600]) {
    const roof = { x: 0, y: 720, w: 5000, kind: 1 };
    for (const index of [0, 1, 2, 3, 4]) {
      const hazards = layoutHazards(roof, index, speed);
      if (index === 3) assert.equal(hazards.length, 0);
      for (let i = 0; i < hazards.length; i++) {
        assert.ok(hazards[i].x >= speed * 0.85);
        assert.ok(roof.w - hazards[i].x >= speed * 0.85);
        if (i) assert.ok(hazards[i].x - hazards[i - 1].x >= speed * 1.6);
        assert.ok(HAZARDS[hazards[i].type as keyof typeof HAZARDS].height < JUMP * JUMP / (2 * GRAVITY));
      }
    }
  }
});

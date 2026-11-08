import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutRoofItems, gapRoute, layoutHazards, layoutOptionalPlatforms, HAZARDS, PLATFORM_ITEMS } from "../src/game/systems/LevelItems.ts";
import { COIN_SPACING, COIN_FOOT_OFFSET, PLAYER_SCREEN_X, deckWidth } from "../src/game/WorldConfig.ts";
import { GRAVITY, JUMP, STEP, PlayerMotion, PlatformGenerator, speedAt, isRecoveryAt, type Roof } from "../src/game/systems/Physics.ts";

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
      .filter(item => item.type === "coin" && !item.bonus));
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

test("recovery windows stay clear and hazard types follow the elapsed tier", () => {
  const roof = { x: 0, y: 720, w: 8000, kind: 1 };
  const early = layoutHazards(roof, 4, 380, 0);
  assert.ok(early.every(item => item.type === "cone" || item.type === "warning"));
  const later = layoutHazards(roof, 16, 570, 120);
  assert.ok(later.some(item => item.type === "crack"));
  for (const elapsed of [0, 20, 45, 75, 120]) {
    for (const hazard of layoutHazards(roof, 4, 570, elapsed)) {
      assert.equal(isRecoveryAt(elapsed + hazard.x / 570), false);
    }
  }
  assert.deepEqual(Object.keys(HAZARDS).sort(), ["banana", "box", "cone", "crack", "warning"]);
});

test("both optional routes preserve a clear base and place bonus coins on real platform tops", () => {
  for (const index of [5, 9]) {
    for (const speed of [380, 570]) {
      const roof: Roof = { x: 0, y: 720, w: deckWidth(720, 2), kind: 2, chunk: "C07", elapsed: 30 };
      const items = layoutRoofItems(roof, index, speed);
      const platforms = items.filter(item => item.type in PLATFORM_ITEMS);
      const bonuses = items.filter(item => item.type === "coin" && item.bonus);
      assert.equal(platforms.length, 2);
      assert.equal(bonuses.length, 6);
      assert.equal(platforms[1].x - platforms[0].x, COIN_SPACING);
      assert.equal(bonuses[3].x - bonuses[0].x, COIN_SPACING);
      assert.ok(items.every(item => !(item.type in HAZARDS)));
      for (let i = 0; i < platforms.length; i++) {
        assert.equal(bonuses[i * 3 + 1].x, platforms[i].x);
        assert.ok(bonuses.slice(i * 3, i * 3 + 3).every(coin => coin.y === platforms[i].y - COIN_FOOT_OFFSET));
      }
      assert.ok(items.some(item => item.type === "coin" && !item.bonus && item.y === roof.y - COIN_FOOT_OFFSET));
      assert.ok(platforms.at(-1)!.x + 150 + speed * 0.62 < roof.w);
    }
  }
  assert.equal(layoutOptionalPlatforms({ x: 0, y: 720, w: 700, kind: 6, chunk: "C07", elapsed: 30 }, 5, 380).length, 0);
});

test("aircon route is reachable with one jump and high signs with two, using actual motion", () => {
  for (const speed of [380, 570]) {
    for (const index of [5, 9]) {
      const roof: Roof = { x: 0, y: 720, w: deckWidth(720, 2), kind: 2, chunk: "C07", elapsed: 30 };
      const platform = layoutOptionalPlatforms(roof, index, speed).find(item => item.type in PLATFORM_ITEMS)!;
      const size = PLATFORM_ITEMS[platform.type as keyof typeof PLATFORM_ITEMS];
      const landing: Roof = { x: platform.x - size.width / 2, y: platform.y, w: size.width, kind: 0 };
      const doubleAt = index === 9 ? 0.18 : 0;
      const firstRise = doubleAt ? JUMP * doubleAt - GRAVITY * doubleAt ** 2 / 2 : 0;
      const remainingRise = roof.y - platform.y - firstRise;
      const flight = doubleAt + (JUMP + Math.sqrt(JUMP ** 2 - 2 * GRAVITY * remainingRise)) / GRAVITY;
      const player = new PlayerMotion();
      player.x = platform.x - speed * flight;
      player.y = roof.y;
      assert.ok(player.x >= roof.x, "the takeoff remains on the safe base roof");
      player.requestJump();
      let doubled = false;
      let landed = false;
      for (let step = 0; step < 160; step++) {
        if (doubleAt && !doubled && step * STEP >= doubleAt) {
          player.requestJump();
          doubled = true;
        }
        player.x += speed * STEP;
        player.step(STEP, [roof, landing]);
        if (player.grounded && player.y === platform.y) { landed = true; break; }
      }
      assert.ok(landed, `route ${platform.route}, speed ${speed}`);
      if (index === 9) assert.ok(roof.y - platform.y > JUMP ** 2 / (2 * GRAVITY));
    }
  }
});

test("rocket pickups have a safe run-up and no invented star or flying spawns", () => {
  const roof: Roof = { x: 0, y: 720, w: 2000, kind: 2, elapsed: 40, rocket: true };
  const items = layoutRoofItems(roof, 12, 450);
  const rocket = items.find(item => item.type === "rocket")!;
  assert.ok(rocket);
  assert.ok(items.filter(item => item.type in HAZARDS).every(item => Math.abs(item.x - rocket.x) >= 450 * 1.6));
  const allowed = new Set(["coin", "rocket", ...Object.keys(HAZARDS), ...Object.keys(PLATFORM_ITEMS)]);
  assert.ok(items.every(item => allowed.has(item.type)));
});

test("a generated first minute offers both route templates, with safe teaching before 20s", () => {
  const generator = new PlatformGenerator(() => 0.5);
  let roof: Roof = { x: -100, y: 720, w: deckWidth(720, 1), kind: 1 };
  const routes = new Set<string>();
  for (let i = 0; i < 30; i++) {
    const speed = speedAt(0, roof.elapsed ?? 0);
    roof = generator.next(roof, speed);
    if (roof.elapsed! >= 60) break;
    const platforms = layoutOptionalPlatforms(roof, generator.index, speed);
    for (const platform of platforms.filter(item => item.type in PLATFORM_ITEMS)) {
      routes.add(platform.route!);
      if (roof.elapsed! < 20) assert.equal(platform.route, "aircon-step");
    }
  }
  assert.deepEqual([...routes].sort(), ["aircon-step", "billboard-high"]);
});

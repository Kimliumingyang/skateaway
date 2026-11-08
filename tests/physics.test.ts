import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PlayerMotion,
  PlatformGenerator,
  GRAVITY,
  JUMP,
  STEP,
  safeGap,
  speedAt,
  difficultyAt,
  isRecoveryAt,
  CHUNK_TEMPLATES,
} from "../src/game/systems/Physics.ts";
import {
  GROUND,
  DECKS,
  deckScale,
  deckWidth,
  BASE_RUN_SPEED,
  MAX_RUN_SPEED,
} from "../src/game/WorldConfig.ts";
const roof = { x: -100, y: 720, w: 1000, kind: 1 };
test("two jumps only, landing resets and buffered jump fires", () => {
  const p = new PlayerMotion();
  p.requestJump();
  assert.equal(p.step(STEP, [roof]), "jump");
  assert.equal(p.jumps, 1);
  for (let i = 0; i < 15; i++) p.step(STEP, [roof]);
  p.requestJump();
  assert.equal(p.step(STEP, [roof]), "jump");
  assert.equal(p.jumps, 2);
  p.requestJump();
  p.step(STEP, [roof]);
  assert.equal(p.jumps, 2);
  assert.ok(p.vy > -JUMP);
  for (let i = 0; i < 300 && !p.grounded; i++) p.step(STEP, [roof]);
  assert.equal(p.jumps, 0);
  assert.equal(p.y, 720);
  p.y = 719;
  p.vy = 200;
  p.grounded = false;
  p.jumps = 2;
  p.requestJump();
  p.step(STEP, [roof]);
  assert.equal(p.grounded, true);
  assert.equal(p.step(STEP, [roof]), "jump");
});
test("coyote jump and falling consume the correct jump slot", () => {
  const p = new PlayerMotion();
  p.step(STEP, []);
  p.requestJump();
  assert.equal(p.step(STEP, []), "jump");
  assert.equal(p.jumps, 1);
  const q = new PlayerMotion();
  for (let i = 0; i < 20; i++) q.step(STEP, []);
  q.requestJump();
  assert.equal(q.step(STEP, []), "jump");
  assert.equal(q.jumps, 2);
  q.requestJump();
  q.step(STEP, []);
  assert.equal(q.jumps, 2);
});
test("10,000 generated roofs remain conservative and have reaction room", () => {
  let seed = 12345;
  const rng = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  const g = new PlatformGenerator(rng);
  let p = roof;
  for (let i = 0; i < 10000; i++) {
    const speed = speedAt(i * 100);
    const n = g.next(p, speed);
    const gap = n.x - (p.x + p.w),
      rise = p.y - n.y;
    const t =
      (JUMP + Math.sqrt(JUMP * JUMP - 2 * GRAVITY * Math.max(0, rise))) /
      GRAVITY;
    assert.ok(gap <= speed * t * 0.45 + 0.00001);
    assert.ok(n.w / speed > 0.6);
    assert.ok(n.y >= 640 && n.y <= 720);
    p = n;
  }
  assert.equal(safeGap(310, 45, 500) > 0, true);
});
test("swept landing catches high downward velocity and does not land from below", () => {
  const p = new PlayerMotion();
  p.y = 710;
  p.vy = 1500;
  p.grounded = false;
  p.step(0.02, [roof]);
  assert.equal(p.y, 720);
  p.y = 760;
  p.vy = -100;
  p.step(STEP, [roof]);
  assert.equal(p.grounded, false);
});

test("all building bases share one ground line and colliders match visible decks", () => {
  const generator = new PlatformGenerator(() => 0.5);
  let roof = { x: -100, y: 720, w: deckWidth(720, 2), kind: 2 };
  for (let i = 0; i < 500; i++) {
    const scale = deckScale(roof.y, roof.kind),
      deck = DECKS[roof.kind];
    const imageTop = GROUND - deck.height * scale;
    assert.ok(Math.abs(imageTop + deck.height * scale - GROUND) < 1e-7);
    assert.ok(Math.abs(imageTop + deck.top * scale - roof.y) < 1e-7);
    assert.ok(Math.abs(deck.width * scale - roof.w) < 1e-7);
    roof = generator.next(roof, speedAt(i * 200));
  }
});
test("single jump can land on each generated next roof at every speed", () => {
  const g = new PlatformGenerator(() => 0.8);
  let current = { x: 0, y: 720, w: deckWidth(720, 2), kind: 2 };
  for (let i = 0; i < 1000; i++) {
    const speed = speedAt(i * 100),
      next = g.next(current, speed),
      p = new PlayerMotion();
    p.x = current.x + current.w - 45;
    p.y = current.y;
    p.requestJump();
    let landed = false;
    for (let t = 0; t < 180; t++) {
      const old = p.x;
      p.x += speed * STEP;
      p.step(STEP, [current, next]);
      if (old + 18 <= next.x && p.x + 18 > next.x)
        assert.ok(p.y <= next.y + 12);
      if (p.grounded && p.x > next.x) {
        landed = true;
        break;
      }
      if (p.y > GROUND) break;
    }
    assert.ok(landed, `transition ${i} at speed ${speed} failed`);
    current = next;
  }
});

test("opening sequence is 1 → 2 → 6, then alternating high and low roofs", () => {
  const g = new PlatformGenerator(() => 0.5);
  let current = { x: -100, y: 720, w: deckWidth(720, 1), kind: 1 };
  const sequence = [current];
  for (let i = 0; i < 8; i++) {
    current = g.next(current, 290);
    sequence.push(current);
  }
  assert.deepEqual(sequence.slice(0, 3).map(roof => roof.kind), [1, 2, 6]);
  assert.equal(sequence[0].y, sequence[1].y);
  assert.deepEqual(sequence.map(roof => roof.kind), [1, 2, 6, 7, 6, 2, 6, 7, 6]);
  assert.deepEqual(sequence.slice(2).map(roof => roof.y), [640, 720, 640, 720, 640, 720, 640]);
});

test("elapsed director uses five tiers, finite speed and recurring recovery", () => {
  assert.deepEqual([0, 20, 45, 75, 120].map(t => difficultyAt(t).tier),
    ["Learn", "Flow", "Pressure", "Danger", "Survival"]);
  assert.equal(speedAt(0, 0), BASE_RUN_SPEED);
  assert.equal(speedAt(999999, 19.9), BASE_RUN_SPEED);
  assert.equal(speedAt(0, 120), MAX_RUN_SPEED);
  assert.equal(speedAt(1e9, 1e6), 570);
  const samples = [0, 20, 45, 75, 120].map(difficultyAt);
  for (let i = 1; i < samples.length; i++) {
    assert.ok(samples[i].speedMultiplier > samples[i - 1].speedMultiplier);
    assert.ok(samples[i].hazardInterval < samples[i - 1].hazardInterval);
  }
  for (let start = 12; start < 600; start += 14) {
    assert.equal(isRecoveryAt(start + 1), true);
    assert.equal(isRecoveryAt(start + 3), false);
  }
});

test("named chunks exclude missing steam and rockets have a 25-second cooldown", () => {
  assert.deepEqual(CHUNK_TEMPLATES.map(chunk => chunk.id), ["C01", "C02", "C03", "C04", "C05", "C06", "C07", "C08"]);
  assert.equal(CHUNK_TEMPLATES.find(chunk => chunk.id === "C08")!.available, false);
  const generator = new PlatformGenerator(() => 0.5);
  let current = { x: -100, y: 720, w: deckWidth(720, 1), kind: 1 } as import("../src/game/systems/Physics.ts").Roof;
  const pickups: number[] = [];
  for (let i = 0; i < 200; i++) {
    current = generator.next(current, speedAt(0, current.elapsed ?? 0));
    assert.notEqual(current.chunk, "C08");
    if (current.rocket) {
      assert.ok(current.w >= 1250);
      assert.ok(current.elapsed! >= 10);
      pickups.push(current.elapsed!);
    }
  }
  assert.ok(pickups.length > 8);
  for (let i = 1; i < pickups.length; i++) {
    assert.ok(pickups[i] - pickups[i - 1] >= 25);
    assert.ok(pickups[i] - pickups[i - 1] < 40);
  }
});

test("roofs planned at early speed remain reachable after acceleration or rocket expiry", () => {
  for (const planningSpeed of [380, 570, 741]) {
    for (const actualSpeed of [380, 570, 741]) {
      const generator = new PlatformGenerator(() => 1);
      let current = { x: 0, y: 720, w: deckWidth(720, 2), kind: 2 };
      for (let i = 0; i < 20; i++) {
        const next = generator.next(current, planningSpeed);
        const player = new PlayerMotion();
        player.x = current.x + current.w - 45;
        player.y = current.y;
        player.requestJump();
        for (let step = 0; step < 180; step++) {
          player.x += actualSpeed * STEP;
          player.step(STEP, [current, next]);
          if (player.grounded && player.x > next.x) break;
        }
        assert.ok(player.grounded && player.x > next.x && player.x < next.x + next.w,
          `planned ${planningSpeed}, actual ${actualSpeed}, transition ${i}`);
        current = next;
      }
    }
  }
});

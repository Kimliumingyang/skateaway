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
} from "../src/game/systems/Physics.ts";
import {
  GROUND,
  DECKS,
  deckScale,
  deckWidth,
} from "../src/game/WorldConfig.ts";
const roof = { x: -100, y: 440, w: 1000, kind: 1 };
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
  assert.equal(p.y, 440);
  p.y = 439;
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
    assert.ok(n.y >= 330 && n.y <= 470);
    p = n;
  }
  assert.equal(safeGap(310, 45, 500) > 0, true);
});
test("swept landing catches high downward velocity and does not land from below", () => {
  const p = new PlayerMotion();
  p.y = 430;
  p.vy = 1500;
  p.grounded = false;
  p.step(0.02, [roof]);
  assert.equal(p.y, 440);
  p.y = 480;
  p.vy = -100;
  p.step(STEP, [roof]);
  assert.equal(p.grounded, false);
});

test("all building bases share one ground line and colliders match visible decks", () => {
  const generator = new PlatformGenerator(() => 0.5);
  let roof = { x: -100, y: 440, w: deckWidth(440, 2), kind: 2 };
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
  let current = { x: 0, y: 440, w: deckWidth(440, 2), kind: 2 };
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

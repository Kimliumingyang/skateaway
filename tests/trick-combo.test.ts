import { test } from "node:test";
import assert from "node:assert/strict";
import { TrickCombo } from "../src/game/systems/TrickCombo.ts";

test("ground input is ignored, one trick per flight, points bank only on landing", () => {
  const t = new TrickCombo();
  assert.equal(t.request(true), false);
  assert.equal(t.request(false), true);
  assert.equal(t.request(false), false);
  assert.equal(t.points, 0);
  assert.equal(t.land(), 100);
  assert.equal(t.land(), 0);
  assert.equal(t.points, 100);
});

test("consecutive tricks increase awards and cap multiplier at five", () => {
  const t = new TrickCombo();
  for (const award of [100, 200, 300, 400, 500, 500]) {
    t.request(false);
    assert.equal(t.land(), award);
  }
  assert.equal(t.combo, 5);
  assert.equal(t.points, 2000);
});

test("empty landing breaks streak; crash cancels pending trick but retains banked score", () => {
  const t = new TrickCombo();
  t.request(false);
  t.land();
  t.request(false);
  t.crash();
  assert.equal(t.pending, false);
  assert.equal(t.combo, 0);
  assert.equal(t.points, 100);
  assert.equal(t.land(), 0);
  t.request(false);
  assert.equal(t.land(), 100);
  t.land();
  t.request(false);
  assert.equal(t.land(), 100);
});

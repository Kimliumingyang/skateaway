import { test } from "node:test";
import assert from "node:assert/strict";
import { TrickCombo } from "../src/game/systems/TrickCombo.ts";

test("ground input is ignored, one kickflip per flight, points bank on safe landing", () => {
  const tricks = new TrickCombo();
  assert.equal(tricks.request(true), false);
  assert.equal(tricks.request(false), true);
  assert.equal(tricks.request(false), false);
  assert.equal(tricks.points, 0);
  assert.equal(tricks.combo, 0);
  assert.equal(tricks.land(), 100);
  assert.equal(tricks.land(), 0);
  assert.equal(tricks.points, 100);
  assert.equal(tricks.combo, 1);
  assert.equal(tricks.remaining, 6);
});

test("successful events use the documented multiplier thresholds and round style points", () => {
  const tricks = new TrickCombo();
  assert.equal(tricks.multiplier, 1);
  assert.equal(tricks.bestMultiplier, 1);
  const multipliers = [1, 1.5, 1.5, 2, 2, 3, 3, 3, 4, 4];
  let expectedPoints = 0;
  for (const [index, multiplier] of multipliers.entries()) {
    const expected = Math.round(75 * multiplier);
    assert.equal(tricks.award(75), expected);
    expectedPoints += expected;
    assert.equal(tricks.combo, index + 1);
    assert.equal(tricks.multiplier, multiplier);
    assert.equal(tricks.bestMultiplier, multiplier);
    assert.equal(tricks.remaining, 6);
  }
  assert.equal(tricks.points, expectedPoints);
});

test("empty landing preserves the streak and successful events refresh its six seconds", () => {
  const tricks = new TrickCombo();
  tricks.award(50);
  tricks.tick(5);
  assert.equal(tricks.remaining, 1);
  assert.equal(tricks.land(), 0);
  assert.equal(tricks.combo, 1);
  assert.equal(tricks.remaining, 1);
  assert.equal(tricks.award(100), 150);
  assert.equal(tricks.remaining, 6);
  tricks.tick(6);
  assert.equal(tricks.combo, 0);
  assert.equal(tricks.multiplier, 1);
  assert.equal(tricks.remaining, 0);
  assert.equal(tricks.bestMultiplier, 1.5);
  assert.equal(tricks.points, 200);
});

test("timer advances only through positive finite active-run ticks", () => {
  const tricks = new TrickCombo();
  tricks.award(50);
  for (const dt of [0, -1, NaN, Infinity]) tricks.tick(dt);
  assert.equal(tricks.combo, 1);
  assert.equal(tricks.remaining, 6);
  tricks.tick(2.5);
  assert.equal(tricks.remaining, 3.5);
  tricks.tick(100);
  assert.equal(tricks.remaining, 0);
  assert.equal(tricks.combo, 0);
  tricks.award(50);
  for (let frame = 0; frame < 360; frame += 1) tricks.tick(1 / 60);
  assert.equal(tricks.remaining, 0);
  assert.equal(tricks.combo, 0);
});

test("a pending landing can begin a new streak after the previous timer expires", () => {
  const tricks = new TrickCombo();
  tricks.award(50);
  tricks.request(false);
  tricks.tick(6);
  assert.equal(tricks.pending, true);
  assert.equal(tricks.land(), 100);
  assert.equal(tricks.combo, 1);
  assert.equal(tricks.points, 150);
});

test("crash cancels a pending trick and resets the streak but retains banked score and best", () => {
  const tricks = new TrickCombo();
  tricks.award(50);
  tricks.award(100);
  tricks.request(false);
  tricks.crash();
  assert.equal(tricks.pending, false);
  assert.equal(tricks.combo, 0);
  assert.equal(tricks.remaining, 0);
  assert.equal(tricks.multiplier, 1);
  assert.equal(tricks.bestMultiplier, 1.5);
  assert.equal(tricks.points, 200);
  assert.equal(tricks.land(), 0);
  tricks.request(false);
  assert.equal(tricks.land(), 100);
});


test("a midair bump cancels the award without granting another trick in the same flight", () => {
  const tricks = new TrickCombo();
  assert.equal(tricks.request(false), true);
  tricks.crash();
  assert.equal(tricks.request(false), false);
  assert.equal(tricks.land(), 0);
  assert.equal(tricks.request(false), true);
  assert.equal(tricks.land(), 100);
});

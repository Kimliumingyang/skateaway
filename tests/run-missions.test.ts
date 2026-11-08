import { test } from "node:test";
import assert from "node:assert/strict";
import { RunMissions } from "../src/game/systems/RunMissions.ts";

test("each run selects two distinct deterministic missions and all pairs are available", () => {
  assert.deepEqual(new RunMissions().missions.map(m => m.id), ["coins", "survive"]);
  const pairs = new Set<string>();
  for (let seed = 0; seed < 3; seed += 1) {
    const first = new RunMissions(seed);
    assert.equal(first.missions.length, 2);
    assert.deepEqual(first.missions, new RunMissions(seed).missions);
    assert.equal(new Set(first.missions.map(m => m.id)).size, 2);
    assert.ok(first.missions.every(m => m.progress === 0 && !m.complete));
    pairs.add(first.missions.map(m => m.id).sort().join(","));
  }
  assert.equal(pairs.size, 3);
  assert.deepEqual(new RunMissions(-1).missions, new RunMissions(2).missions);
  assert.deepEqual(new RunMissions(NaN).missions, new RunMissions().missions);
});

test("collect and survival thresholds clamp progress and award their exact bonuses", () => {
  const missions = new RunMissions();
  missions.update(29, 59.9, 10);
  assert.deepEqual(missions.missions.map(m => m.progress), [29, 59]);
  assert.equal(missions.bonus, 0);
  missions.update(30, 59.99, 10);
  assert.equal(missions.bonus, 30);
  assert.deepEqual(missions.missions.map(m => m.complete), [true, false]);
  missions.update(50, 80, 10);
  assert.deepEqual(missions.missions.map(m => m.progress), [30, 60]);
  assert.equal(missions.bonus, 90);
  assert.ok(missions.summary[0].includes("30/30"));
  assert.ok(missions.summary[0].includes("+30 coins"));
  assert.ok(missions.summary[1].includes("+60 coins"));
});

test("five successful tricks completes the style mission without counting other totals", () => {
  const missions = new RunMissions(2);
  missions.update(0, 100, 4);
  assert.deepEqual(missions.missions.map(m => m.progress), [4, 0]);
  assert.equal(missions.bonus, 0);
  missions.update(0, 100, 5);
  assert.equal(missions.missions[0].complete, true);
  assert.equal(missions.bonus, 50);
});

test("completed progress never regresses and invalid counters cannot complete a mission", () => {
  const missions = new RunMissions();
  missions.update(-5, NaN, Infinity);
  assert.deepEqual(missions.missions.map(m => m.progress), [0, 0]);
  missions.update(30, 60, 0);
  missions.update(0, -10, 0);
  missions.update(Infinity, NaN, 0);
  assert.deepEqual(missions.missions.map(m => m.progress), [30, 60]);
  assert.equal(missions.bonus, 90);
});

test("settlement returns bonus once without changing progress or summary", () => {
  const missions = new RunMissions();
  missions.update(30, 60, 0);
  const summary = missions.summary;
  const state = structuredClone(missions.missions);
  assert.equal(missions.settle(), 90);
  assert.equal(missions.settle(), 0);
  assert.equal(missions.bonus, 90);
  assert.deepEqual(missions.missions, state);
  assert.deepEqual(missions.summary, summary);
  assert.equal(new RunMissions().bonus, 0);
});

test("settling an incomplete run pays zero and permanently closes its payout", () => {
  const missions = new RunMissions();
  missions.update(29, 59, 0);
  assert.equal(missions.settle(), 0);
  missions.update(30, 60, 0);
  assert.equal(missions.settle(), 0);
});

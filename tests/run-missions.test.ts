import { test } from "node:test";
import assert from "node:assert/strict";
import { RunMissions } from "../src/game/systems/RunMissions.ts";

test("each run gets one easy and one distinct skill goal", () => {
  const pairs = [0, 1, 2].map(seed => new RunMissions(seed).missions);
  assert.deepEqual(pairs.map(pair => pair.map(m => m.id)), [
    ["coins15", "double5"], ["survive30", "tricks3"], ["gaps3", "high2"],
  ]);
  assert.deepEqual(new RunMissions(-1).missions, new RunMissions(2).missions);
});

test("live mission progress clamps, never regresses, and pays once", () => {
  const missions = new RunMissions();
  missions.update({ coins: 14, seconds: 99, gaps: 0, doubles: 4, tricks: 0, high: 0 });
  assert.deepEqual(missions.missions.map(m => m.progress), [14, 4]);
  assert.equal(missions.bonus, 0);
  missions.update({ coins: 16, seconds: 0, gaps: 0, doubles: 5, tricks: 0, high: 0 });
  assert.deepEqual(missions.missions.map(m => m.progress), [15, 5]);
  assert.equal(missions.bonus, 50);
  missions.update({ coins: -1, seconds: NaN, gaps: 0, doubles: 0, tricks: 0, high: 0 });
  assert.equal(missions.bonus, 50);
  assert.equal(missions.settle(), 50);
  assert.equal(missions.settle(), 0);
});

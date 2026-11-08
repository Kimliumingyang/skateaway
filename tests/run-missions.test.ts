import { test } from "node:test";
import assert from "node:assert/strict";
import { RunMissions, MISSION_CATALOG } from "../src/game/systems/RunMissions.ts";

test("each run gets one easy and one distinct skill goal", () => {
  const pairs = [0, 1, 2].map(seed => new RunMissions(seed).missions);
  assert.deepEqual(pairs.map(pair => pair.map(m => m.id)), [
    ["M01", "M04"], ["M02", "M05"], ["M07", "M03"],
  ]);
  assert.deepEqual(new RunMissions(-1).missions, new RunMissions(0).missions);
  assert.equal(new Set(MISSION_CATALOG.map(m => m.id)).size, 12);
  for (let seed = 0; seed < 6; seed++) {
    const pair = new RunMissions(seed).missions;
    assert.deepEqual(pair.map(m => m.tier), ["easy", "skill"]);
    assert.notEqual(pair[0].id, pair[1].id);
  }
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

test("streak missions reset after a penalty without revoking completed rewards", () => {
  const missions = new RunMissions(2); // M07 + M03
  const base = { coins: 0, seconds: 0, gaps: 0, doubles: 0, tricks: 0, high: 0 };
  missions.update({ ...base, consecutiveGaps: 2 });
  assert.equal(missions.missions[1].progress, 2);
  missions.update({ ...base, consecutiveGaps: 0 });
  assert.equal(missions.missions[1].progress, 0);
  missions.update({ ...base, consecutiveGaps: 3 });
  assert.equal(missions.missions[1].complete, true);
  missions.update({ ...base, consecutiveGaps: 0 });
  assert.equal(missions.missions[1].complete, true);
  assert.equal(missions.missions[1].progress, 3);
  assert.equal(missions.settle(), 25);
});

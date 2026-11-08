import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { SaveManager } from "../src/game/systems/SaveManager.ts";

function storageFor(t: TestContext, value?: unknown) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const values = new Map<string, string>();
  if (value !== undefined) values.set("skateaway.v1", JSON.stringify(value));
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, next: string) => values.set(key, next),
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });
  return storage;
}

test("legacy v1 wallet, records and settings survive migration", (t) => {
  storageFor(t, {
    best: 800,
    wallet: 275,
    records: [{ score: 800, coins: 45, date: "2026-10-01" }],
    music: false,
    sfx: false,
    vibration: true,
  });
  const save = new SaveManager();
  assert.equal(save.persistent, true);
  assert.equal(save.data.wallet, 275);
  assert.deepEqual(save.data.records, [
    { score: 800, coins: 45, date: "2026-10-01" },
  ]);
  assert.deepEqual(
    [save.data.best, save.data.music, save.data.sfx, save.data.vibration],
    [800, false, false, true],
  );
  save.finish(250, 15);
  assert.equal(save.data.wallet, 290);
  assert.equal(save.data.best, 800);
});

test("run coins and mission bonus are banked and extended results persist", (t) => {
  const storage = storageFor(t, { wallet: 275 });
  const save = new SaveManager();
  save.finish(1400, 35, {
    distance: 246.5,
    maxCombo: 3,
    bonus: 80,
    seconds: 64.25,
  });
  assert.equal(save.data.wallet, 390);
  assert.equal(save.data.best, 1400);
  assert.deepEqual(save.data.records[0], {
    score: 1400,
    coins: 35,
    date: new Date().toISOString().slice(0, 10),
    distance: 246.5,
    maxCombo: 3,
    bonus: 80,
    seconds: 64.25,
  });
  assert.equal(JSON.parse(storage.getItem("skateaway.v1")!).wallet, 390);
  const reloaded = new SaveManager();
  assert.deepEqual(reloaded.data, save.data);
  assert.equal(reloaded.data.wallet, 390, "loading does not repay mission bonus");
});

test("malformed records and invalid optional values cannot corrupt stored results", (t) => {
  storageFor(t, {
    best: "invalid",
    wallet: 300,
    records: [
      null,
      {},
      { score: -1, coins: 3, date: "2026-10-01" },
      { score: 50, coins: "3", date: "2026-10-01" },
      {
        score: 100,
        coins: 5,
        date: "2026-10-01",
        distance: -20,
        maxCombo: "4",
        bonus: 30,
        seconds: 0,
      },
    ],
  });
  const save = new SaveManager();
  assert.equal(save.persistent, true);
  assert.equal(save.data.wallet, 300);
  assert.equal(save.data.best, 0);
  assert.deepEqual(save.data.records, [
    { score: 100, coins: 5, date: "2026-10-01", bonus: 30, seconds: 0 },
  ]);

  save.finish(Number.NaN, -10, {
    distance: Infinity,
    maxCombo: -1,
    bonus: Number.NaN,
    seconds: 1.5,
  });
  assert.equal(save.data.wallet, 300);
  assert.equal(save.data.best, 0);
  assert.deepEqual(save.data.records[1], {
    score: 0,
    coins: 0,
    date: new Date().toISOString().slice(0, 10),
    seconds: 1.5,
  });
});

test("leaderboard keeps the ten highest scores while all earned coins are banked", (t) => {
  storageFor(t);
  const save = new SaveManager();
  for (let score = 1; score <= 12; score++) save.finish(score * 10, 1);
  assert.equal(save.data.wallet, 12);
  assert.equal(save.data.best, 120);
  assert.deepEqual(
    save.data.records.map((record) => record.score),
    [120, 110, 100, 90, 80, 70, 60, 50, 40, 30],
  );
});

test("blocked browser storage retains current-session earnings", (t) => {
  const storage = storageFor(t);
  storage.getItem = () => {
    throw new Error("storage unavailable");
  };
  storage.setItem = () => {
    throw new Error("storage unavailable");
  };
  const save = new SaveManager();
  assert.equal(save.persistent, false);
  save.finish(100, 20, { bonus: 30 });
  assert.equal(save.data.wallet, 50);
  assert.equal(save.data.records.length, 1);
});

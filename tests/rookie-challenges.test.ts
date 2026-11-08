import { test } from "node:test";
import assert from "node:assert/strict";
import { RookieChallenges } from "../src/game/systems/RookieChallenges.ts";
import { save } from "../src/game/systems/SaveManager.ts";

test("rookie milestones require the authored order and pay each first completion once", () => {
  const previous = save.data;
  save.data = { ...previous, rookieCompleted: [], pendingRookieBonus: 0, wallet: 0 };
  try {
    const challenges = new RookieChallenges();
    assert.equal(challenges.observe({ type: "high", order: 1 }), undefined);
    assert.equal(challenges.observe({ type: "land", order: 1 })?.id, "R01");
    assert.equal(challenges.observe({ type: "land", order: 1 }), undefined);
    assert.equal(challenges.observe({ type: "high", order: 1 })?.id, "R02");
    assert.equal(challenges.observe({ type: "land", order: 2, doubleJump: false }), undefined);
    assert.equal(challenges.observe({ type: "land", order: 2, doubleJump: true })?.id, "R03");
    assert.equal(challenges.observe({ type: "high", order: 2 })?.id, "R04");
    assert.equal(challenges.observe({ type: "land", order: 4 })?.id, "R05");
    assert.equal(challenges.observe({ type: "land", order: 6 }), undefined);
    assert.equal(challenges.observe({ type: "pass", order: 6 })?.id, "R06");
    assert.equal(challenges.observe({ type: "pass", order: 9 })?.id, "R07");
    assert.equal(challenges.progress, 7);
    assert.equal(save.data.pendingRookieBonus, 170);
    assert.equal(save.data.wallet, 0);
  } finally { save.data = previous; }
});

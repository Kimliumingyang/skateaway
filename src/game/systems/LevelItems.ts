import type { Roof } from "./Physics.ts";

/** Pure level-item plan: art and collision objects are created by GameScene. */
export type LevelItemType = "coin" | "cone" | "box" | "banana" | "warning";

export interface LevelItemSpawn {
  x: number;
  y: number;
  type: LevelItemType;
}

/**
 * Place pickups along readable ground / jump arcs while reserving hazards
 * for rooftops with sufficient run-up. Keep this deterministic so we can
 * validate level pacing independently of Phaser or image assets.
 */
export function layoutRoofItems(
  roof: Roof,
  segmentIndex: number,
  speed: number,
): LevelItemSpawn[] {
  if (segmentIndex <= 0) return [];

  const items: LevelItemSpawn[] = [];

  if (segmentIndex % 4 !== 1 && roof.w >= speed * 1.55) {
    const hazards = ["cone", "box", "banana", "warning"] as const;
    items.push({
      x: roof.x + roof.w * 0.52,
      y: roof.y,
      type: hazards[segmentIndex % hazards.length],
    });
  }

  // A readable string of coins on the roof; alternate low and jump arcs.
  const coinCount = Math.min(5, Math.floor((roof.w - 85) / 57));
  for (let i = 0; i < coinCount; i++) {
    const jumpArc =
      segmentIndex % 2 === 0 ? Math.sin((i / 4) * Math.PI) * 60 : 0;
    items.push({
      x: roof.x + 65 + i * 57,
      y: roof.y - 70 - jumpArc,
      type: "coin",
    });
  }

  // Near the beginning of selected rooftops, reward gap-jump timing.
  if (segmentIndex % 3 === 0) {
    for (let i = 0; i < 3; i++) {
      items.push({
        x: roof.x - 85 + i * 40,
        y: roof.y - 125 - Math.sin((i / 2) * Math.PI) * 35,
        type: "coin",
      });
    }
  }

  return items;
}

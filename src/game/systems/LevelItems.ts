import { COIN_SPACING, COIN_FOOT_OFFSET, PLAYER_SCREEN_X } from "../WorldConfig.ts";
import { GRAVITY, JUMP, type Roof } from "./Physics.ts";

export type LevelItemType = "coin" | "cone" | "box" | "banana" | "warning";
export interface LevelItemSpawn {
  x: number;
  y: number;
  type: LevelItemType;
}
export const HAZARDS = {
  cone: { width: 82 * 200 / 194, height: 82 },
  box: { width: 72 * 169 / 200, height: 72 },
  banana: { width: 44 * 78 / 69, height: 44 },
  warning: { width: 88 * 127 / 150, height: 88 },
};

/** Anticipation, jump, recovery: no hazards in landing or edge takeoff zones. */
export function layoutHazards(roof: Roof, index: number, speed: number): LevelItemSpawn[] {
  const margin = Math.max(250, speed * 0.85);
  const spacing = Math.ceil(Math.max(700, speed * 1.6) / COIN_SPACING) * COIN_SPACING;
  const start = index === 0 ? Math.max(roof.x + margin, PLAYER_SCREEN_X + speed * 1.8) : roof.x + margin;
  const end = roof.x + roof.w - margin;
  // Every fourth segment is a recovery beat; short roofs are landing-only.
  if ((index > 0 && index % 4 === 3) || end - start < 90) return [];
  const types = ["cone", "box", "banana", "warning"] as const;
  const items: LevelItemSpawn[] = [];
  const coinOrigin = PLAYER_SCREEN_X + COIN_SPACING;
  const first = coinOrigin + Math.ceil((start - coinOrigin) / COIN_SPACING) * COIN_SPACING;
  for (let x = first; x <= end; x += spacing) {
    items.push({ x, y: roof.y, type: types[(index + items.length) % types.length] });
  }
  return items;
}
interface Neighbors {
  previous?: Roof;
  next?: Roof;
}

/** Single-jump route: jump just before the edge and land on the next roof. */
export function gapRoute(from: Roof, to: Roof, speed: number) {
  const start = from.x + from.w - 45;
  const flight = (JUMP + Math.sqrt(JUMP * JUMP - 2 * GRAVITY * (from.y - to.y))) / GRAVITY;
  return { start, end: start + speed * flight, y: from.y };
}

/** Sample a continuous, physically reachable route on the reference-spacing grid.
 * Neighbors let coins lead through gaps, rather than drawing unrelated sine waves.
 */
export function layoutRoofItems(
  roof: Roof,
  segmentIndex: number,
  speed: number,
  { previous, next }: Neighbors = {},
): LevelItemSpawn[] {
  const items = layoutHazards(roof, segmentIndex, speed);
  const incoming = previous ? gapRoute(previous, roof, speed) : undefined;
  const outgoing = next ? gapRoute(roof, next, speed) : undefined;
  const obstacleJumps = items.map(hazard => ({
    start: hazard.x - speed * JUMP / GRAVITY,
    end: hazard.x + speed * JUMP / GRAVITY,
    y: roof.y,
  }));
  const firstCoin = PLAYER_SCREEN_X + COIN_SPACING;
  const first = Math.max(firstCoin, firstCoin + Math.ceil((roof.x - firstCoin) / COIN_SPACING) * COIN_SPACING);
  for (let x = first; x < (next?.x ?? roof.x + roof.w); x += COIN_SPACING) {
    let foot = roof.y;
    const jump = [incoming, outgoing, ...obstacleJumps].find(route => route && x >= route.start && x <= route.end);
    if (jump) {
      const t = (x - jump.start) / speed;
      foot = jump.y - JUMP * t + 0.5 * GRAVITY * t * t;
    }
    items.push({ x, y: foot - COIN_FOOT_OFFSET, type: "coin" });
  }
  return items;
}

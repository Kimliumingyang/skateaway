import { COIN_SPACING, COIN_FOOT_OFFSET, PLAYER_SCREEN_X } from "../WorldConfig.ts";
import { GRAVITY, JUMP, type Roof } from "./Physics.ts";

export type LevelItemType = "coin" | "cone" | "box" | "banana" | "warning";
export interface LevelItemSpawn {
  x: number;
  y: number;
  type: LevelItemType;
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
  const items: LevelItemSpawn[] = [];
  let hazardX: number | undefined;
  // Give the opening bridge and second building an unobstructed learning section.
  if (segmentIndex >= 2 && segmentIndex % 4 !== 1 && roof.w >= speed * 1.55) {
    hazardX = roof.x + roof.w * 0.52;
    const hazards = ["cone", "box", "banana", "warning"] as const;
    items.push({ x: hazardX, y: roof.y, type: hazards[segmentIndex % hazards.length] });
  }
  const incoming = previous ? gapRoute(previous, roof, speed) : undefined;
  const outgoing = next ? gapRoute(roof, next, speed) : undefined;
  const obstacleJump = hazardX === undefined ? undefined : {
    start: hazardX - speed * JUMP / GRAVITY,
    end: hazardX + speed * JUMP / GRAVITY,
    y: roof.y,
  };
  const firstCoin = PLAYER_SCREEN_X + COIN_SPACING;
  const first = Math.max(firstCoin, firstCoin + Math.ceil((roof.x - firstCoin) / COIN_SPACING) * COIN_SPACING);
  for (let x = first; x < (next?.x ?? roof.x + roof.w); x += COIN_SPACING) {
    let foot = roof.y;
    const jump = [incoming, outgoing, obstacleJump].find(route => route && x >= route.start && x <= route.end);
    if (jump) {
      const t = (x - jump.start) / speed;
      foot = jump.y - JUMP * t + 0.5 * GRAVITY * t * t;
    }
    items.push({ x, y: foot - COIN_FOOT_OFFSET, type: "coin" });
  }
  return items;
}

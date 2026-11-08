import { COIN_SPACING, COIN_FOOT_OFFSET, PLAYER_SCREEN_X } from "../WorldConfig.ts";
import { GRAVITY, JUMP, difficultyAt, isRecoveryAt, type Roof } from "./Physics.ts";

export const HAZARDS = {
  cone: { width: 82 * 200 / 194, height: 82 },
  box: { width: 72 * 169 / 200, height: 72 },
  banana: { width: 44 * 78 / 69, height: 44 },
  warning: { width: 88 * 127 / 150, height: 88 },
  crack: { width: 152, height: 152 * 157 / 314 },
} as const;
/** Native image aspect ratios; platform spawn x is its center, y is its top. */
export const PLATFORM_ITEMS = {
  aircon: { width: 220, height: 220 * 152 / 249 },
  "sign-cyber": { width: 300, height: 300 * 167 / 326 },
  "sign-neon": { width: 280, height: 280 * 124 / 259 },
} as const;
export const PICKUP_ITEMS = { rocket: { width: 68 * 154 / 136, height: 68 } } as const;
/** Platform separation stays independent from the denser base coin grid. */
export const OPTIONAL_ROUTE_SPACING = 300;
export type HazardType = keyof typeof HAZARDS;
export type PlatformItemType = keyof typeof PLATFORM_ITEMS;
export type LevelItemType = "coin" | HazardType | PlatformItemType | "rocket";
export interface LevelItemSpawn {
  x: number;
  y: number;
  type: LevelItemType;
  /** Optional platforms carry extra coin clusters above the base coin route. */
  bonus?: boolean;
  route?: "aircon-step" | "billboard-high";
}
interface Neighbors {
  previous?: Roof;
  next?: Roof;
  /** Encounter seconds at roof.x, rather than the generation clock. */
  elapsed?: number;
}

function encounterAt(roof: Roof, elapsed?: number) {
  return elapsed ?? roof.elapsed ?? 0;
}

/** Anticipation, jump, recovery: no hazards in landing or edge takeoff zones. */
export function layoutHazards(roof: Roof, index: number, speed: number, elapsed?: number): LevelItemSpawn[] {
  const entry = encounterAt(roof, elapsed);
  const difficulty = difficultyAt(entry);
  const margin = Math.max(250, speed * 0.85);
  const spacing = Math.ceil(Math.max(600, speed * difficulty.hazardInterval) / COIN_SPACING) * COIN_SPACING;
  const start = index === 0 ? Math.max(roof.x + margin, PLAYER_SCREEN_X + speed * 1.8) : roof.x + margin;
  const end = roof.x + roof.w - margin;
  // Two optional routes reserve the complete base route and their reunion area.
  if ((index > 0 && index % 4 === 3) || end - start < 90 ||
      ["C01", "C02", "C04", "C05", "C06", "C07"].includes(roof.chunk ?? "")) return [];
  const types: HazardType[] = difficulty.level === 1 ? ["cone", "warning"] :
    difficulty.level === 2 ? ["cone", "box", "banana", "warning"] :
      ["cone", "box", "banana", "warning", "crack"];
  const items: LevelItemSpawn[] = [];
  const coinOrigin = PLAYER_SCREEN_X + COIN_SPACING;
  const first = coinOrigin + Math.ceil((start - coinOrigin) / COIN_SPACING) * COIN_SPACING;
  for (let x = first; x <= end; x += spacing) {
    const encounter = entry + (x - roof.x) / speed;
    // Keep the entire jump approach and its landing out of a recovery window.
    if (isRecoveryAt(encounter - JUMP / GRAVITY) || isRecoveryAt(encounter) ||
        isRecoveryAt(encounter + JUMP / GRAVITY)) continue;
    const type = types[(Math.floor(index / 4) + items.length) % types.length];
    items.push({ x, y: roof.y, type });
  }
  return items;
}

/** Single-jump route: jump just before the edge and land on the next roof. */
export function gapRoute(from: Roof, to: Roof, speed: number) {
  const start = from.x + from.w - 45;
  const discriminant = Math.max(0, JUMP * JUMP - 2 * GRAVITY * (from.y - to.y));
  const flight = (JUMP + Math.sqrt(discriminant)) / GRAVITY;
  return { start, end: start + speed * flight, y: from.y };
}

/** Two one-way routes sit above a fully clear main roof. Neither is required. */
export function layoutOptionalPlatforms(roof: Roof, index: number, speed: number, elapsed?: number): LevelItemSpawn[] {
  const entry = encounterAt(roof, elapsed);
  if ((index === 1 && roof.kind === 2) || (index === 2 && roof.kind === 4)) {
    const type: PlatformItemType = index === 1 ? "sign-cyber" : "aircon";
    const x = roof.x + roof.w * 0.52;
    const y = roof.y - (index === 1 ? 120 : 105);
    return [{ x, y, type, route: index === 1 ? "billboard-high" : "aircon-step" },
      ...[-75, 0, 75].map(offset => ({ x: x + offset, y: y - COIN_FOOT_OFFSET,
        type: "coin" as const, bonus: true }))];
  }
  if (roof.chunk !== "C07" || roof.w < 1250 || entry < 15 || difficultyAt(entry).recovery) return [];
  // A 250px drop takes 0.43s; retain another 0.15s before the roof edge.
  const margin = Math.max(260, speed * 0.58);
  // The upper route retains its reachable platform geometry as the coin grid changes.
  const firstCenter = roof.x + (roof.w - OPTIONAL_ROUTE_SPACING) / 2;
  // Offset the route rotation with the director wave so relief windows do not
  // repeatedly remove the same route variant from a run.
  const high = entry >= 20 && (Math.floor(index / 4) + Math.floor(entry / 14)) % 2 === 0;
  const route = high ? "billboard-high" : "aircon-step";
  const types: PlatformItemType[] = high ? ["sign-cyber", "sign-neon"] : ["aircon", "sign-cyber"];
  const rises = high ? [235, 250] : [130, 140];
  const platforms: (LevelItemSpawn & { type: PlatformItemType })[] = types.map((type, i) => ({ x: firstCenter + i * OPTIONAL_ROUTE_SPACING, y: roof.y - rises[i], type, route }));
  // A speed boost may end anywhere: reserve a full drop back onto the base roof.
  const end = platforms.at(-1)!;
  if (firstCenter - PLATFORM_ITEMS[platforms[0].type].width / 2 < roof.x + margin ||
      end.x + PLATFORM_ITEMS[end.type].width / 2 + margin > roof.x + roof.w) return [];
  return platforms.flatMap(platform => [platform, ...[-80, 0, 80].map((offset): LevelItemSpawn => ({
    x: platform.x + offset,
    y: platform.y - COIN_FOOT_OFFSET,
    type: "coin" as const,
    bonus: true,
    route,
  }))]);
}

/** Sample the base route continuously, then offer extra coins on optional tops. */
export function layoutRoofItems(
  roof: Roof,
  segmentIndex: number,
  speed: number,
  { previous, next, elapsed }: Neighbors = {},
): LevelItemSpawn[] {
  const items = layoutHazards(roof, segmentIndex, speed, elapsed);
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
  items.push(...layoutOptionalPlatforms(roof, segmentIndex, speed, elapsed));
  if (roof.rocket && roof.w >= 1250) {
    const margin = Math.max(250, speed * 0.85);
    const x = Math.max(roof.x + margin, Math.min(roof.x + roof.w / 2, roof.x + roof.w - margin));
    // The pickup itself has a clear approach even if its roof uses ground hazards.
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].type in HAZARDS && Math.abs(items[i].x - x) < speed * 1.6) items.splice(i, 1);
    }
    items.push({ x, y: roof.y - COIN_FOOT_OFFSET, type: "rocket" });
  }
  return items;
}

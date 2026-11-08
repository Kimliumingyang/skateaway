import { BASE_RUN_SPEED, MAX_RUN_SPEED, PLAYER_SCREEN_X, deckWidth, START_ROOF_Y, HIGH_ROOF_Y } from "../WorldConfig.ts";
export const GRAVITY = 2700;
export const JUMP = 920;
export const COYOTE = 0.1;
export const BUFFER = 0.12;
export const STEP = 1 / 120;
export type ChunkId = "C01" | "C02" | "C03" | "C04" | "C05" | "C06" | "C07" | "C08";
/** Named, asset-backed patterns. Steam remains unavailable until its art exists. */
export const CHUNK_TEMPLATES = [
  { id: "C01", name: "Flat Run", minimumTier: 1, available: true, pattern: "clear roof and straight coins" },
  { id: "C02", name: "Small Gap", minimumTier: 1, available: true, pattern: "short single-jump gap" },
  { id: "C03", name: "Cone Jump", minimumTier: 1, available: true, pattern: "readable ground hazard and jump coins" },
  { id: "C04", name: "Raised Roof", minimumTier: 2, available: true, pattern: "80px rise and reserved landing" },
  { id: "C05", name: "Double Gap", minimumTier: 2, available: true, pattern: "two small gaps with a clear middle roof" },
  { id: "C06", name: "Coin Arc", minimumTier: 2, available: true, pattern: "ballistic coins through a gap" },
  { id: "C07", name: "High Route", minimumTier: 1, available: true, pattern: "optional aircon or elevated sign route" },
  { id: "C08", name: "Steam Vent", minimumTier: 3, available: false, pattern: "blocked: steam vent artwork missing" },
] as const;
export type DifficultyTier = "Learn" | "Flow" | "Pressure" | "Danger" | "Survival";
export interface Difficulty {
  tier: DifficultyTier;
  level: number;
  speedMultiplier: number;
  /** Minimum seconds between readable ground hazards. */
  hazardInterval: number;
  recovery: boolean;
}
/** A 2.5-second low-pressure beat starts at 12s, then every 14 seconds. */
export function isRecoveryAt(seconds: number) {
  return seconds >= 12 && (seconds - 12) % 14 < 2.5;
}
export function difficultyAt(seconds: number): Difficulty {
  const t = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const recovery = isRecoveryAt(t);
  if (t < 20) return { tier: "Learn", level: 1, speedMultiplier: 1, hazardInterval: 3.6, recovery };
  if (t < 45) return { tier: "Flow", level: 2, speedMultiplier: 1.05 + (t - 20) / 25 * 0.05, hazardInterval: 2.8, recovery };
  if (t < 75) return { tier: "Pressure", level: 3, speedMultiplier: 1.15 + (t - 45) / 30 * 0.1, hazardInterval: 2.3, recovery };
  if (t < 120) return { tier: "Danger", level: 4, speedMultiplier: 1.3 + (t - 75) / 45 * 0.15, hazardInterval: 1.9, recovery };
  return { tier: "Survival", level: 5, speedMultiplier: 1.5, hazardInterval: 1.6, recovery };
}
export interface Roof {
  x: number;
  y: number;
  w: number;
  kind: number;
  chunk?: ChunkId;
  /** Estimated encounter time at the beginning of this roof. */
  elapsed?: number;
  rocket?: boolean;
}
export class PlayerMotion {
  x = 240;
  y = START_ROOF_Y;
  vy = 0;
  jumps = 0;
  grounded = true;
  coyote = COYOTE;
  buffer = 0;
  requestJump() {
    this.buffer = BUFFER;
  }
  step(dt: number, roofs: Roof[]): "jump" | "land" | undefined {
    let event: "jump" | "land" | undefined;
    this.coyote = this.grounded ? COYOTE : Math.max(0, this.coyote - dt);
    if (
      this.buffer > 0 &&
      (this.grounded || this.coyote > 0 || this.jumps < 2)
    ) {
      if (!this.grounded && this.coyote === 0 && this.jumps === 0)
        this.jumps = 1;
      if (this.jumps < 2) {
        this.vy = -JUMP;
        this.jumps++;
        this.grounded = false;
        this.coyote = 0;
        this.buffer = 0;
        event = "jump";
      }
    }
    this.buffer = Math.max(0, this.buffer - dt);
    const old = this.y;
    this.vy += GRAVITY * dt;
    this.y += this.vy * dt;
    this.grounded = false;
    if (this.vy >= 0) {
      const roof = roofs.find(
        (p) =>
          this.x + 18 > p.x &&
          this.x - 18 < p.x + p.w &&
          old <= p.y + 1 &&
          this.y >= p.y,
      );
      if (roof) {
        this.y = roof.y;
        this.vy = 0;
        this.grounded = true;
        if (this.jumps > 0) event = "land";
        this.jumps = 0;
      }
    }
    return event;
  }
}
export function speedAt(distance: number, elapsed?: number) {
  // Keep distance-only callers useful; the live scene supplies its run clock.
  return Math.min(MAX_RUN_SPEED, BASE_RUN_SPEED * difficultyAt(elapsed ?? distance / BASE_RUN_SPEED).speedMultiplier);
}
/** Conservative single jump at worst (highest) next roof, with 100px landing reserve.
 * Every gap is less than 45% of that flight range. Double jump adds recovery margin. */
export function safeGap(speed: number, rise: number, desired: number) {
  const discriminant = JUMP * JUMP - 2 * GRAVITY * Math.max(0, rise);
  const flight = (JUMP + Math.sqrt(Math.max(0, discriminant))) / GRAVITY;
  return Math.max(60, Math.min(desired, speed * flight * 0.45));
}
export class PlatformGenerator {
  index = 0;
  private random: () => number;
  private nextRocketAt = 10;
  constructor(random: () => number = Math.random) {
    this.random = random;
  }
  next(previous: Roof, speed: number, elapsed?: number): Roof {
    this.index++;
    // Long bridge → medium platform at the same height, then high / low beats.
    const y = this.index === 1 ? START_ROOF_Y : this.index % 2 === 0 ? HIGH_ROOF_Y : START_ROOF_Y;
    const gap = safeGap(
      speed,
      previous.y - y,
      85 + this.random() * 45 + Math.min(25, this.index),
    );
    // Reintroduce a longer low platform regularly for obstacle beats, with
    // short high roofs and the alternate low roof reserved for gap recovery.
    const kind = this.index % 2 === 0 ? 6 : this.index % 4 === 1 ? 2 : 7;
    // Height determines uniform scale and width, so every source image ends on GROUND.
    const previousElapsed = previous.elapsed ?? Math.min(0, (previous.x - PLAYER_SCREEN_X) / speed);
    const encounter = elapsed ?? previousElapsed + (previous.w + gap) / speed;
    const difficulty = difficultyAt(encounter);
    const w = deckWidth(y, kind);
    let chunk: ChunkId;
    if (difficulty.recovery) chunk = w >= 1250 ? "C01" : "C02";
    else if (w >= 1250) {
      chunk = encounter >= 15 && Math.floor(this.index / 4) % 3 !== 0 ? "C07" : "C03";
    } else if (difficulty.level === 1) chunk = "C02";
    else chunk = (["C04", "C05", "C06"] as const)[this.index % 3];
    if (chunk === "C04" && y !== HIGH_ROOF_Y) chunk = "C06";
    const rocket = w >= 1250 && encounter >= this.nextRocketAt;
    if (rocket) this.nextRocketAt = encounter + 25;
    return { x: previous.x + previous.w + gap, y, w, kind, chunk, elapsed: encounter, rocket };
  }
}

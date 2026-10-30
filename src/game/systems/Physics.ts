import { deckWidth } from "../WorldConfig.ts";
export const GRAVITY = 1900;
export const JUMP = 650;
export const COYOTE = 0.1;
export const BUFFER = 0.12;
export const STEP = 1 / 120;
export interface Roof {
  x: number;
  y: number;
  w: number;
  kind: number;
}
export class PlayerMotion {
  x = 240;
  y = 440;
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
export function speedAt(distance: number) {
  return Math.min(420, 290 + distance / 220);
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
  constructor(random: () => number = Math.random) {
    this.random = random;
  }
  next(previous: Roof, speed: number): Roof {
    this.index++;
    const target = [430, 365, 420, 345, 400, 455][this.index % 6];
    const y = Math.max(
      330,
      Math.min(
        470,
        previous.y + Math.max(-65, Math.min(65, target - previous.y)),
      ),
    );
    const gap = safeGap(
      speed,
      previous.y - y,
      85 + this.random() * 45 + Math.min(25, this.index),
    );
    const kind = [7, 6, 3, 7, 6, 2][this.index % 6];
    // Height determines uniform scale and width, so every source image ends on GROUND.
    return { x: previous.x + previous.w + gap, y, w: deckWidth(y, kind), kind };
  }
}

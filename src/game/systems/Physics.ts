export const GRAVITY = 1900;
export const JUMP = 720;
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
  x = 185;
  y = 860;
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
  return Math.min(490, 310 + distance / 160);
}
/** Conservative single jump at worst (highest) next roof, with 100px landing reserve.
 * Every gap is less than 45% of that flight range. Double jump adds recovery margin. */
export function safeGap(speed: number, rise: number, desired: number) {
  const discriminant = JUMP * JUMP - 2 * GRAVITY * Math.max(0, rise);
  const flight = (JUMP + Math.sqrt(Math.max(0, discriminant))) / GRAVITY;
  return Math.max(80, Math.min(desired, speed * flight * 0.45));
}
export class PlatformGenerator {
  index = 0;
  private random: () => number;
  constructor(random: () => number = Math.random) {
    this.random = random;
  }
  next(previous: Roof, speed: number): Roof {
    this.index++;
    const y = Math.max(
      800,
      Math.min(940, previous.y + [0, -45, 0, 40][this.index % 4]),
    );
    const gap = safeGap(
      speed,
      previous.y - y,
      85 + this.random() * 65 + Math.min(35, this.index),
    );
    const kind = [2, 3, 7, 1][this.index % 4];
    // At maximum speed even the shortest roof offers >1 second of reaction time.
    return {
      x: previous.x + previous.w + gap,
      y,
      w: kind === 1 ? 1050 : Math.max(speed * 2, 550 + this.random() * 190),
      kind,
    };
  }
}

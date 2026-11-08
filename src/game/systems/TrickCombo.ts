/** One pending kickflip per flight. Successful style events share a timed streak. */
export class TrickCombo {
  pending = false;
  private usedThisFlight = false;
  combo = 0;
  points = 0;
  remaining = 0;
  bestMultiplier = 1;

  get multiplier() {
    if (this.combo >= 9) return 4;
    if (this.combo >= 6) return 3;
    if (this.combo >= 4) return 2;
    if (this.combo >= 2) return 1.5;
    return 1;
  }

  request(grounded: boolean) {
    if (grounded || this.pending || this.usedThisFlight) return false;
    this.pending = true;
    this.usedThisFlight = true;
    return true;
  }

  land() {
    this.usedThisFlight = false;
    if (!this.pending) return 0;
    this.pending = false;
    return this.award(100);
  }

  award(base: number) {
    this.combo += 1;
    this.remaining = 6;
    this.bestMultiplier = Math.max(this.bestMultiplier, this.multiplier);
    const points = Math.round(base * this.multiplier);
    this.points += points;
    return points;
  }

  /** Call only while the run is active so pause never consumes combo time. */
  tick(dt: number) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.remaining = Math.max(0, this.remaining - dt);
    if (this.remaining <= 1e-9) {
      this.remaining = 0;
      this.combo = 0;
    }
  }

  crash() {
    this.pending = false;
    this.combo = 0;
    this.remaining = 0;
  }
}

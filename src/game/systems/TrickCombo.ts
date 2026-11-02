/** One pending kickflip per flight. Only a safe landing banks points. */
export class TrickCombo {
  pending = false;
  combo = 0;
  points = 0;

  request(grounded: boolean) {
    if (grounded || this.pending) return false;
    this.pending = true;
    return true;
  }

  land() {
    if (!this.pending) {
      this.combo = 0;
      return 0;
    }
    this.pending = false;
    this.combo = Math.min(5, this.combo + 1);
    const award = 100 * this.combo;
    this.points += award;
    return award;
  }

  crash() {
    this.pending = false;
    this.combo = 0;
  }
}

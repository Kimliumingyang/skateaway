export interface SaveData {
  best: number;
  wallet: number;
  records: { score: number; coins: number; date: string }[];
  music: boolean;
  sfx: boolean;
}
const defaults = (): SaveData => ({
  best: 0,
  wallet: 0,
  records: [],
  music: true,
  sfx: true,
});
export class SaveManager {
  data: SaveData = defaults();
  persistent = true;
  constructor() {
    try {
      const d = JSON.parse(localStorage.getItem("skateaway.v1") || "null");
      if (d) {
        this.data = {
          best: Number.isFinite(d.best) ? Math.max(0, d.best) : 0,
          wallet: Number.isFinite(d.wallet) ? Math.max(0, d.wallet) : 0,
          records: Array.isArray(d.records)
            ? d.records
                .filter(
                  (r: any) =>
                    Number.isFinite(r.score) &&
                    Number.isFinite(r.coins) &&
                    typeof r.date === "string",
                )
                .slice(0, 10)
            : [],
          music: typeof d.music === "boolean" ? d.music : true,
          sfx: typeof d.sfx === "boolean" ? d.sfx : true,
        };
      }
    } catch {
      this.persistent = false;
    }
  }
  save() {
    try {
      localStorage.setItem("skateaway.v1", JSON.stringify(this.data));
    } catch {
      this.persistent = false;
    }
  }
  finish(score: number, coins: number) {
    this.data.best = Math.max(this.data.best, score);
    this.data.wallet += coins;
    this.data.records.push({
      score,
      coins,
      date: new Date().toISOString().slice(0, 10),
    });
    this.data.records.sort((a, b) => b.score - a.score);
    this.data.records = this.data.records.slice(0, 10);
    this.save();
  }
}
export const save = new SaveManager();

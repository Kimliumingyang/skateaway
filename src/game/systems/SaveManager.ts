import { LEGEND_CATALOG, emptyLegendTotals, type LegendId, type LegendMetric, type LegendTotals } from "./StreetLegends.ts";

export interface RunDetails {
  distance?: number;
  maxCombo?: number;
  bonus?: number;
  rookieBonus?: number;
  seconds?: number;
  deathCause?: "FALL" | "OBSTACLE" | "SEAGULL" | "ELECTRIC" | "OTHER";
}

export interface RunRecord extends RunDetails {
  score: number;
  coins: number;
  date: string;
}

export interface SaveData {
  best: number;
  wallet: number;
  records: RunRecord[];
  bestDistance: number;
  longestRun: number;
  bestCombo: number;
  rookieCompleted: string[];
  pendingRookieBonus: number;
  runSerial: number;
  legendTotals: LegendTotals;
  legendUnlocked: Partial<Record<LegendId, string>>;
  music: boolean;
  sfx: boolean;
  vibration: boolean;
}
const defaults = (): SaveData => ({
  best: 0,
  wallet: 0,
  records: [],
  bestDistance: 0,
  longestRun: 0,
  bestCombo: 1,
  rookieCompleted: [],
  pendingRookieBonus: 0,
  runSerial: 0,
  legendTotals: emptyLegendTotals(),
  legendUnlocked: {},
  music: true,
  sfx: true,
  vibration: false,
});

const validAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const amount = (value: unknown) => (validAmount(value) ? value : 0);

function runDetails(value: unknown): RunDetails {
  if (!value || typeof value !== "object") return {};
  const details: RunDetails = {};
  for (const key of ["distance", "maxCombo", "bonus", "rookieBonus", "seconds"] as const) {
    const n = (value as Record<string, unknown>)[key];
    if (validAmount(n)) details[key] = n;
  }
  const deathCause = (value as Record<string, unknown>).deathCause;
  if (["FALL", "OBSTACLE", "SEAGULL", "ELECTRIC", "OTHER"].includes(String(deathCause)))
    details.deathCause = deathCause as RunDetails["deathCause"];
  return details;
}

function runRecord(value: unknown): RunRecord | undefined {
  if (!value || typeof value !== "object") return undefined;
  const r = value as Record<string, unknown>;
  if (!validAmount(r.score) || !validAmount(r.coins) || typeof r.date !== "string")
    return undefined;
  return { score: r.score, coins: r.coins, date: r.date, ...runDetails(r) };
}

export class SaveManager {
  data: SaveData = defaults();
  persistent = true;
  constructor() {
    try {
      const d = JSON.parse(localStorage.getItem("skateaway.v1") || "null");
      if (d && typeof d === "object") {
        this.data = {
          best: amount(d.best),
          wallet: amount(d.wallet),
          records: Array.isArray(d.records)
            ? d.records
                .map(runRecord)
                .filter(
                  (r: RunRecord | undefined): r is RunRecord => r !== undefined,
                )
                .sort((a: RunRecord, b: RunRecord) => b.score - a.score)
                .slice(0, 10)
            : [],
          bestDistance: amount(d.bestDistance),
          longestRun: amount(d.longestRun),
          bestCombo: amount(d.bestCombo) || 1,
          rookieCompleted: Array.isArray(d.rookieCompleted)
            ? d.rookieCompleted.filter((id: unknown): id is string => typeof id === "string") : [],
          pendingRookieBonus: amount(d.pendingRookieBonus),
          runSerial: validAmount(d.runSerial) ? d.runSerial : (Array.isArray(d.records) ? d.records.length : 0),
          legendTotals: Object.fromEntries(Object.keys(emptyLegendTotals()).map(key =>
            [key, amount(d.legendTotals?.[key])])) as unknown as LegendTotals,
          legendUnlocked: Object.fromEntries(LEGEND_CATALOG.flatMap(legend =>
            typeof d.legendUnlocked?.[legend.id] === "string"
              ? [[legend.id, d.legendUnlocked[legend.id]]] : [])) as Partial<Record<LegendId, string>>,
          music: typeof d.music === "boolean" ? d.music : true,
          sfx: typeof d.sfx === "boolean" ? d.sfx : true,
          vibration: typeof d.vibration === "boolean" ? d.vibration : false,
        };
        for (const record of this.data.records) {
          this.data.bestDistance = Math.max(this.data.bestDistance, record.distance ?? 0);
          this.data.longestRun = Math.max(this.data.longestRun, record.seconds ?? 0);
          this.data.bestCombo = Math.max(this.data.bestCombo, record.maxCombo ?? 1);
        }
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
  finish(score: number, coins: number, details?: RunDetails) {
    const runScore = amount(score);
    const runCoins = amount(coins);
    const extra = runDetails(details);
    this.data.best = Math.max(this.data.best, runScore);
    this.data.bestDistance = Math.max(this.data.bestDistance, extra.distance ?? 0);
    this.data.longestRun = Math.max(this.data.longestRun, extra.seconds ?? 0);
    this.data.bestCombo = Math.max(this.data.bestCombo, extra.maxCombo ?? 1);
    this.data.wallet += runCoins + (extra.bonus ?? 0) + this.data.pendingRookieBonus;
    this.data.pendingRookieBonus = 0;
    this.data.records.push({
      score: runScore,
      coins: runCoins,
      date: new Date().toISOString().slice(0, 10),
      ...extra,
    });
    this.data.records.sort((a, b) => b.score - a.score);
    this.data.records = this.data.records.slice(0, 10);
    this.save();
  }
  unlockRookie(id: string, reward: number) {
    if (this.data.rookieCompleted.includes(id)) return false;
    this.data.rookieCompleted.push(id);
    this.data.pendingRookieBonus += reward;
    this.save();
    return true;
  }
  startRun() {
    const serial = this.data.runSerial++;
    this.save();
    return serial;
  }
  recordLegend(metric: LegendMetric, count = 1) {
    if (!Number.isFinite(count) || count <= 0) return [];
    this.data.legendTotals[metric] += count;
    const unlocked = LEGEND_CATALOG.filter(legend => legend.metric === metric &&
      !this.data.legendUnlocked[legend.id] && this.data.legendTotals[metric] >= legend.target);
    for (const legend of unlocked) this.data.legendUnlocked[legend.id] = new Date().toISOString();
    this.save();
    return unlocked;
  }
}
export const save = new SaveManager();

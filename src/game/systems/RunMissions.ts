export type RunMissionId =
  | "M01" | "M02" | "M03" | "M04" | "M05" | "M06"
  | "M07" | "M08" | "M09" | "M10" | "M11" | "M12";

export interface RunMetrics {
  coins: number;
  seconds: number;
  gaps: number;
  doubles: number;
  tricks: number;
  high: number;
  consecutiveGaps?: number;
  cleanBuildings?: number;
  buildings?: number;
  landedBuilding5?: number;
  openingComplete?: number;
}

type Metric = keyof RunMetrics;
export interface RunMission {
  id: RunMissionId;
  title: string;
  short: string;
  target: number;
  progress: number;
  reward: number;
  complete: boolean;
  tier: "easy" | "skill";
  metric: Metric;
  /** Streak progress returns to zero after a penalty, while completion stays earned. */
  streak?: boolean;
}
type Definition = Omit<RunMission, "progress" | "complete">;

export const MISSION_CATALOG: readonly Definition[] = [
  { id: "M01", title: "Coin Hunter", short: "COINS", target: 15, reward: 20, tier: "easy", metric: "coins" },
  { id: "M02", title: "Keep Rolling", short: "SURVIVE", target: 30, reward: 20, tier: "easy", metric: "seconds" },
  { id: "M03", title: "Rooftop Hopper", short: "GAP STREAK", target: 3, reward: 25, tier: "skill", metric: "consecutiveGaps", streak: true },
  { id: "M04", title: "Double Up", short: "DOUBLE JUMPS", target: 5, reward: 30, tier: "skill", metric: "doubles" },
  { id: "M05", title: "High Flyer", short: "HIGH PLATFORMS", target: 2, reward: 30, tier: "skill", metric: "high" },
  { id: "M06", title: "Clean Ride", short: "CLEAN BUILDINGS", target: 3, reward: 30, tier: "skill", metric: "cleanBuildings", streak: true },
  { id: "M07", title: "Street Collector", short: "COINS", target: 30, reward: 40, tier: "easy", metric: "coins" },
  { id: "M08", title: "Sky Walker", short: "BUILDING 5", target: 1, reward: 35, tier: "skill", metric: "landedBuilding5" },
  { id: "M09", title: "Don't Look Down", short: "BUILDINGS", target: 8, reward: 45, tier: "easy", metric: "buildings" },
  { id: "M10", title: "Trick Master", short: "SAFE TRICKS", target: 3, reward: 40, tier: "skill", metric: "tricks" },
  { id: "M11", title: "Stay Alive", short: "SURVIVE", target: 60, reward: 50, tier: "easy", metric: "seconds" },
  { id: "M12", title: "Roof Legend", short: "FIRST CIRCUIT", target: 1, reward: 60, tier: "easy", metric: "openingComplete" },
] as const;

const easy = MISSION_CATALOG.filter(mission => mission.tier === "easy");
const skill = ["M04", "M05", "M03", "M06", "M08", "M10"]
  .map(id => MISSION_CATALOG.find(mission => mission.id === id)!);

/** Two distinct, feasible goals. Complete flags and their rewards are irreversible within a run. */
export class RunMissions {
  readonly missions: RunMission[];
  private settled = false;

  constructor(seed = 0) {
    const index = Number.isFinite(seed) ? Math.max(0, Math.trunc(seed)) : 0;
    this.missions = [easy[index % easy.length], skill[index % skill.length]]
      .map(mission => ({ ...mission, progress: 0, complete: false }));
  }

  update(metrics: RunMetrics): RunMission[] {
    const newlyCompleted: RunMission[] = [];
    for (const mission of this.missions) {
      const value = metrics[mission.metric];
      if (value === undefined || !Number.isFinite(value)) continue;
      const progress = Math.min(mission.target, Math.max(0, Math.floor(value)));
      mission.progress = mission.streak && !mission.complete ? progress : Math.max(mission.progress, progress);
      if (!mission.complete && mission.progress >= mission.target) {
        mission.complete = true;
        newlyCompleted.push(mission);
      }
    }
    return newlyCompleted;
  }

  get bonus() { return this.missions.reduce((sum, mission) => sum + (mission.complete ? mission.reward : 0), 0); }
  get summary() { return this.missions.map(mission => `${mission.short} ${mission.progress}/${mission.target}${mission.complete ? ` +${mission.reward}` : ""}`); }
  settle() { if (this.settled) return 0; this.settled = true; return this.bonus; }
}

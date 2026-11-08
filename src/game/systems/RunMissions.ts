export type RunMissionId = "coins15" | "survive30" | "gaps3" | "double5" | "tricks3" | "high2";
export interface RunMetrics { coins: number; seconds: number; gaps: number; doubles: number; tricks: number; high: number }
export interface RunMission { id: RunMissionId; title: string; target: number; progress: number; reward: number; complete: boolean }
const easy = [
  { id: "coins15", title: "Collect 15 coins", target: 15, reward: 20 },
  { id: "survive30", title: "Survive 30 seconds", target: 30, reward: 20 },
  { id: "gaps3", title: "Clear 3 gaps", target: 3, reward: 25 },
] as const;
const skill = [
  { id: "double5", title: "Double-jump 5 times", target: 5, reward: 30 },
  { id: "tricks3", title: "Land 3 Kickflips", target: 3, reward: 40 },
  { id: "high2", title: "Reach 2 high platforms", target: 2, reward: 30 },
] as const;
/** One easy and one skill goal per run; rewards settle once at Run Ended. */
export class RunMissions {
  readonly missions: RunMission[];
  private settled = false;
  constructor(seed = 0) {
    const index = Number.isFinite(seed) ? ((Math.trunc(seed) % 3) + 3) % 3 : 0;
    this.missions = [easy[index], skill[index]].map(({ id, title, target, reward }) =>
      ({ id, title, target, reward, progress: 0, complete: false }));
  }
  update(metrics: RunMetrics) {
    const counts: Record<RunMissionId, number> = {
      coins15: metrics.coins, survive30: metrics.seconds, gaps3: metrics.gaps,
      double5: metrics.doubles, tricks3: metrics.tricks, high2: metrics.high,
    };
    for (const mission of this.missions) {
      const value = counts[mission.id];
      if (!Number.isFinite(value)) continue;
      mission.progress = Math.min(mission.target, Math.max(mission.progress, Math.floor(value)));
      mission.complete = mission.progress >= mission.target;
    }
  }
  get bonus() { return this.missions.reduce((sum, m) => sum + (m.complete ? m.reward : 0), 0); }
  get summary() { return this.missions.map(m => `${m.title}: ${m.progress}/${m.target}${m.complete ? ` +${m.reward} coins` : ""}`); }
  settle() { if (this.settled) return 0; this.settled = true; return this.bonus; }
}

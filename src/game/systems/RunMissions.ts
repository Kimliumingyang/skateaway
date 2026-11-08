export type RunMissionId = "coins" | "survive" | "tricks";

export interface RunMission {
  id: RunMissionId;
  title: string;
  target: number;
  progress: number;
  reward: number;
  complete: boolean;
}

const catalog = [
  { id: "coins", title: "Collect 30 coins", target: 30, reward: 30 },
  { id: "survive", title: "Survive 60 seconds", target: 60, reward: 60 },
  { id: "tricks", title: "Complete 5 tricks", target: 5, reward: 50 },
] satisfies Omit<RunMission, "progress" | "complete">[];

/** Two local run goals. Settlement returns a reward; the caller banks it. */
export class RunMissions {
  readonly missions: RunMission[];
  private settled = false;

  constructor(seed = 0) {
    const start = Number.isFinite(seed)
      ? ((Math.trunc(seed) % catalog.length) + catalog.length) % catalog.length
      : 0;
    this.missions = [catalog[start], catalog[(start + 1) % catalog.length]].map(
      mission => ({ ...mission, progress: 0, complete: false }),
    );
  }

  update(coins: number, seconds: number, tricks: number) {
    const totals = { coins, survive: seconds, tricks };
    for (const mission of this.missions) {
      const total = totals[mission.id];
      if (!Number.isFinite(total)) continue;
      mission.progress = Math.min(
        mission.target,
        Math.max(mission.progress, Math.floor(total)),
      );
      mission.complete = mission.progress >= mission.target;
    }
  }

  get bonus() {
    return this.missions.reduce(
      (total, mission) => total + (mission.complete ? mission.reward : 0),
      0,
    );
  }

  get summary() {
    return this.missions.map(
      mission =>
        `${mission.title}: ${mission.progress}/${mission.target}${mission.complete ? ` +${mission.reward} coins` : ""}`,
    );
  }

  settle() {
    if (this.settled) return 0;
    this.settled = true;
    return this.bonus;
  }
}

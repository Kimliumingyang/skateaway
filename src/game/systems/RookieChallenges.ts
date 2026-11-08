import { save } from "./SaveManager.ts";

export const ROOKIE_CHALLENGES = [
  { id: "R01", title: "First Ride · clear the first gap", reward: 10 },
  { id: "R02", title: "Up We Go! · land on the CYBER sign", reward: 15 },
  { id: "R03", title: "Double Trouble · double-jump the next gap", reward: 20 },
  { id: "R04", title: "Rooftop Rookie · reach the high platform", reward: 20 },
  { id: "R05", title: "Sky Jumper · land on building 5", reward: 25 },
  { id: "R06", title: "No Fear! · cross the second building 4", reward: 30 },
  { id: "R07", title: "Welcome to the City · finish ten rooftops", reward: 50 },
] as const;
export type RookieEvent = { type: "land" | "high" | "pass"; order: number; doubleJump?: boolean };

/** Permanent, ordered beginner goals. An optional route can be retried next run. */
export class RookieChallenges {
  get current() { return ROOKIE_CHALLENGES.find(challenge => !save.data.rookieCompleted.includes(challenge.id)); }
  get progress() { return save.data.rookieCompleted.length; }
  observe(event: RookieEvent) {
    const current = this.current;
    if (!current) return undefined;
    const completed =
      (current.id === "R01" && event.type === "land" && event.order === 1) ||
      (current.id === "R02" && event.type === "high" && event.order === 1) ||
      (current.id === "R03" && event.type === "land" && event.order === 2 && !!event.doubleJump) ||
      (current.id === "R04" && event.type === "high" && event.order === 2) ||
      (current.id === "R05" && event.type === "land" && event.order === 4) ||
      (current.id === "R06" && event.type === "pass" && event.order === 6) ||
      (current.id === "R07" && event.type === "pass" && event.order === 9);
    return completed && save.unlockRookie(current.id, current.reward) ? current : undefined;
  }
}

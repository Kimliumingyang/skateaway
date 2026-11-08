export const LEGEND_CATALOG = [
  { id: "firstFlight", title: "First Flight", badge: "Rookie Badge", detail: "Make your first double jump", metric: "doubles", target: 1 },
  { id: "roofSurfer", title: "Roof Surfer", badge: "Skate Badge", detail: "Clear 100 roof gaps", metric: "gaps", target: 100 },
  { id: "coinAddict", title: "Coin Addict", badge: "Coin Badge", detail: "Collect 1,000 coins", metric: "coins", target: 1000 },
  { id: "noFear", title: "No Fear", badge: "Courage Badge", detail: "Pass 10 buildings in one run without a penalty", metric: "flawless", target: 1 },
  { id: "trickster", title: "Trickster", badge: "Trick Badge", detail: "Land 100 tricks", metric: "tricks", target: 100 },
  { id: "nightRider", title: "Night Rider", badge: "Night Rider Badge", detail: "Survive 120 seconds in one run", metric: "survive120", target: 1 },
  { id: "skylineLegend", title: "Skyline Legend", badge: "Legend Badge", detail: "Pass 500 buildings", metric: "buildings", target: 500 },
] as const;
export type LegendId = (typeof LEGEND_CATALOG)[number]["id"];
export type LegendMetric = (typeof LEGEND_CATALOG)[number]["metric"];
export type LegendTotals = Record<"doubles" | "gaps" | "coins" | "tricks" | "buildings" | "flawless" | "survive120", number>;
export const emptyLegendTotals = (): LegendTotals => ({ doubles: 0, gaps: 0, coins: 0, tricks: 0,
  buildings: 0, flawless: 0, survive120: 0 });

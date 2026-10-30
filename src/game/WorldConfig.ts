export const WIDTH = 1334;
export const HEIGHT = 750;
export const GROUND = 700;
export const PLAYER_SCREEN_X = 240;
/** Measured source-space walkable decks; images retain their original aspect ratio. */
export const DECKS: Record<
  number,
  { width: number; top: number; height: number }
> = {
  2: { width: 1950, top: 150, height: 667 },
  3: { width: 950, top: 285, height: 867 },
  6: { width: 700, top: 130, height: 938 },
  7: { width: 1465, top: 10, height: 744 },
};
export function deckScale(y: number, kind: number) {
  const d = DECKS[kind];
  return (GROUND - y) / (d.height - d.top);
}
export function deckWidth(y: number, kind: number) {
  return DECKS[kind].width * deckScale(y, kind);
}

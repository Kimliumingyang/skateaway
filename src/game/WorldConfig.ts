export const WIDTH = 1920;
export const HEIGHT = 1080;
export const GROUND = HEIGHT;
export const PLAYER_SCREEN_X = 220;
/** Full-HD composition: small skater, clear forward view, grounded buildings. */
export const PLAYER_HEIGHT = 180;
export const PLAYER_BODY_HEIGHT = PLAYER_HEIGHT * 0.8;
export const COIN_SPACING = 240;
export const COIN_FOOT_OFFSET = 74;
export const BASE_RUN_SPEED = 430;
export const MAX_RUN_SPEED = BASE_RUN_SPEED * 1.5;
export const START_ROOF_Y = 720;
export const HIGH_ROOF_Y = 640;
export const CAMERA_BASE_Y = 0;
/** Measured source-space walkable decks; images retain their original aspect ratio. */
export const DECKS: Record<
  number,
  { width: number; top: number; height: number }
> = {
  1: { width: 4400, top: 150, height: 583 },
  2: { width: 1950, top: 150, height: 667 },
  3: { width: 950, top: 285, height: 867 },
  4: { width: 1150, top: 150, height: 986 },
  5: { width: 440, top: 85, height: 1007 },
  6: { width: 700, top: 130, height: 938 },
  7: { width: 1465, top: 10, height: 744 },
  8: { width: 620, top: 95, height: 1147 },
};
export function deckScale(y: number, kind: number) {
  const d = DECKS[kind];
  return (GROUND - y) / (d.height - d.top);
}
export function deckWidth(y: number, kind: number) {
  return DECKS[kind].width * deckScale(y, kind);
}

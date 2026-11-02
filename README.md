# SkateAway · YiDD Studio

A playable landscape HTML5 rooftop runner built with Phaser 3, TypeScript and Vite. Original artwork is preserved under `Asset/`; ASCII-named runtime copies live in `public/assets/`.

## Run

Requires Node.js 22.18+ (Node 24 recommended) and npm.

```sh
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`). On a phone on the same network, use the printed network URL. The game fits a 1334×750 landscape area and letterboxes the remaining space.

```sh
npm run build
npm run preview
npm test
```

Browser acceptance tests require the dev server in another terminal:

```sh
# Uses /usr/bin/chromium if installed; otherwise install Playwright Chromium:
npx playwright install chromium
npm run test:browser
```

Playwright snapshots are written to ignored `work/`. Tests cover 1440×900 desktop and 844×390 landscape touch input. `npm test` checks jumping, coyote time, buffered input, swept landings and 10,000 generated rooftop transitions, 1,000 simulated jump landings, and grounded building/deck alignment.

## Controls and rules

- Space / click / tap: jump; press again in the air to double jump. Two jumps maximum per airtime. Landing resets jumps.
- P / Escape or pause button: pause. Resume, settings, restart and menu are functional.
- Avoid cones, boxes, banana peels, warning signs and gaps. Falling ends the run.
- Score = floor(distance in world pixels / 10) + 25 × collected coins. HUD distance uses 10 pixels per meter.
- Coins, best score, top 10 local runs and music/SFX preferences persist in localStorage. Storage errors fall back to session memory.
- Music starts after interaction. Settings save immediately. Music pauses when the document is hidden; gameplay pauses too.

## Architecture

`src/game/scenes/` contains boot, menu, gameplay and a modal scene for pause/settings/ranking/results. `systems/Physics.ts` owns deterministic 120 Hz motion and bounded platform generation; `SaveManager.ts` owns validated persistence; `AudioManager.ts` owns supplied music and synthesized feedback. `entities/Player.ts` renders the user-provided character cutout. `WorldConfig.ts` defines the shared ground line and source deck geometry. `ui/Controls.ts` provides shared interactive controls. Coins and roof views are pooled; off-screen world objects are bounded. Event handlers are removed on shutdown.

Rooftops alternate controlled height patterns. Gap bounds use speed, gravity, jump velocity and relative roof rise, capped at 45% of a conservative single-jump flight range. Hazards are limited to roofs with enough travel time for obstacle clearance and the next takeoff. Double jump supplies recovery and higher coin routes. Colliders use separate logical dimensions, with swept vertical roof landing checks.

## Artwork and limitations

See [asset inventory](docs/ASSET_MANIFEST.md) and [development report](docs/DEVELOPMENT_REPORT.md). The original archive has no independent character animation. The user later supplied a character reference, now processed into a single-frame transparent cutout at `Asset/Characters/character-cutout.png` and rendered in both menu and gameplay. Tilt and bob are procedural, not a claimed animation sheet. Original buildings 2/3/6/7 use measured deck geometry and uniform scales: all building bottoms end at world y=700 while roof heights vary from 330 to 470. Roof width follows each source aspect ratio; short buildings omit hazards. Falling to the street or hitting a taller facade ends the run. No sprite stretching is used.

Coin revives, advertising, online leaderboards and shops are deferred. The supplied revive button contains a baked-in advertising badge and is not used. No external SDK or service is simulated. Canvas 2D is used for predictable software-rendered browser performance. Mobile device hardware, Safari audio, actual soundtrack loop seams, and extended play balance still need device testing. The production bundle includes Phaser (~1.5 MB uncompressed); Vite reports its large-chunk advisory.

To regenerate runtime copies and inventory from the original repository assets, install Python Pillow and run `python scripts/assets.py`. The script never overwrites originals or extracts the ZIP.

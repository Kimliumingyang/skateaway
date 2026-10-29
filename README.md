# SkateAway · YiDD Studio

A playable portrait HTML5 rooftop runner built with Phaser 3, TypeScript and Vite. Original artwork is preserved under `Asset/`; ASCII-named runtime copies live in `public/assets/`.

## Run

Requires Node.js 22.18+ (Node 24 recommended) and npm.

```sh
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`). On a phone on the same network, use the printed network URL. The game fits a 750×1334 portrait area and letterboxes the remaining space.

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

Playwright snapshots are written to ignored `work/`. Tests cover 1200×900 desktop and 390×844 touch input. `npm test` checks jumping, coyote time, buffered input, swept landings and 10,000 generated rooftop transitions.

## Controls and rules

- Space / click / tap: jump; press again in the air to double jump. Two jumps maximum per airtime. Landing resets jumps.
- P / Escape or pause button: pause. Resume, settings, restart and menu are functional.
- Avoid cones, boxes, banana peels, warning signs and gaps. Falling ends the run.
- Score = floor(distance in world pixels / 10) + 25 × collected coins. HUD distance uses 10 pixels per meter.
- Coins, best score, top 10 local runs and music/SFX preferences persist in localStorage. Storage errors fall back to session memory.
- Music starts after interaction. Settings save immediately. Music pauses when the document is hidden; gameplay pauses too.

## Architecture

`src/game/scenes/` contains boot, menu, gameplay and a modal scene for pause/settings/ranking/results. `systems/Physics.ts` owns deterministic 120 Hz motion and bounded platform generation; `SaveManager.ts` owns validated persistence; `AudioManager.ts` owns supplied music and synthesized feedback. `entities/Player.ts` draws the explicitly temporary skater. `ui/Controls.ts` provides shared interactive controls. Coins and roof views are pooled; off-screen world objects are bounded. Event handlers are removed on shutdown.

Rooftops alternate controlled height patterns. Gap bounds use speed, gravity, jump velocity and relative roof rise, capped at 45% of a conservative single-jump flight range. Wider roofs at high speeds leave room for obstacle clearance and the next takeoff. Double jump supplies recovery and higher coin routes. Colliders use separate logical dimensions, with swept vertical roof landing checks.

## Artwork and limitations

See [asset inventory](docs/ASSET_MANIFEST.md) and [development report](docs/DEVELOPMENT_REPORT.md). No independent character sprite or animation frames were present. The menu uses the original flattened title/character background only as decoration with real buttons. Gameplay uses a labeled temporary vector skater. Original platform railings are decoration; a supplemental flat neon ledge marks the collision surface. No sprite stretching is used.

Coin revives, advertising, online leaderboards and shops are deferred. The supplied revive button contains a baked-in advertising badge and is not used. No external SDK or service is simulated. Canvas 2D is used for predictable software-rendered browser performance. Mobile device hardware, Safari audio, actual soundtrack loop seams, and extended play balance still need device testing. The production bundle includes Phaser (~1.5 MB uncompressed); Vite reports its large-chunk advisory.

To regenerate runtime copies and inventory from the original repository assets, install Python Pillow and run `python scripts/assets.py`. The script never overwrites originals or extracts the ZIP.

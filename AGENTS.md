# SkateAway — agent instructions (read first)

This repository is the source of truth for SkateAway, a landscape 2D endless rooftop skateboarding game. Work like a senior gameplay engineer and technical artist. Focus on real playable gameplay rather than static UI mockups.

## Project and repository facts
- Source assets are already in `Asset/Skateaway/` and `Asset/音乐资源/`; `Asset.zip` is also present as an archive. Inspect the extracted files first before trying to unzip the archive.
- Real art includes `Asset/Skateaway/bg_sky.png`, `bg_buildings_far.png`, `Gamestartbg.png`, 8 images inside `Buildings/`, UI buttons, dialogs under `弹窗/`, and collectible/obstacle sprites under `障碍物:道具:建筑装饰/`. Audio tracks are in `Asset/音乐资源/`.
- Non-English paths, spaces, colons, double periods and filenames like `gameover_title.png.png` are intentional source filenames. Do not silently change paths or break imports. Prefer copying processed runtime assets into ASCII-named `public/assets/`, retaining original source assets.
- Current logical canvas: 1920×1080 (landscape), with proportional scaling and responsive letterboxing. The original 750×1334 portrait layout is a historical asset reference.
- Visual direction: purple/magenta neon cyberpunk, playful street graffiti, thick cartoon linework, vivid yellow accents. Keep the supplied design; don't substitute random generic art.
- Current primary gameplay specification: `docs/GAMEPLAY_SPEC_RECONCILIATION.md`. Read it before coding. `docs/CODEX_ART_INTEGRATION_SESSION_02.md` is the historical art integration brief; its portrait target and early collision rules are superseded by the current specification.
- The standalone V0.2 HTML prototype previously delivered in ChatGPT is NOT necessarily in this repo. Never assume missing files exist.

## MVP gameplay contract
- Auto-scrolling/auto-running to the right (camera follows); the player uses single tap / click / Space to jump and again to double-jump. No third jump until landing.
- Roof gaps, falling and lethal collisions (including caution signs, cracks and building facades) end a run. Cone / box / banana contacts are nonlethal and break Combo; banana also locks tricks for 0.6 seconds. Coins are collectible; score increases; retry actually restarts the game.
- Create only reachable obstacle/platform arrangements; adjust speed, spacing and jump physics to ensure fair play.
- Functional start, pause, settings, game over, ranking and retry screens. On mobile, all important actions must have touch-friendly controls.
- Score, player rankings and currency are LIVE data, not burned-in screenshot text.
- Persist high score and audio settings in localStorage. Global leaderboard and real rewarded ads are out of scope until services/SDKs are configured.

## Implementation workflow
1. Inspect the existing repository fully and create `docs/ASSET_MANIFEST.md` recording the actual files, purpose, sprite sizes and animation/atlas assumptions. State clearly whether a genuine transparent character sprite/animation exists. Never claim to have used missing art.
2. If there is no web game app yet, initialize a modest Vite + TypeScript + Phaser 3 app; do not install or scaffold large unrelated frameworks.
3. Implement a fully playable game loop with assets under `Asset/Skateaway/` as source and organized runtime textures. Keep rendering/collider sizes decoupled.
4. Check art scale, transparency, alignment, HUD readability and viewport positioning.
5. Run `npm install`, `npm run build`, and tests if present. Play-test controls and state transitions in a browser if available. Report checks actually run, not imagined.
6. Work on a feature branch / PR if the environment supports it. Commit meaningful milestones; do not overwrite original art.
7. End each task with a brief Chinese handoff: implemented features, exact changed files, testing outcomes, missing assets, and next task.

## Priorities
P0 playable runner + real art + responsive menus.
P1 better feel: coyote time, jump buffer, landing feedback, obstacles and combo.
P2 cosmetics, leaderboard backend, ad SDK, store.

Don't stop at planning, but don't imply that external services are linked or deployed until verified.

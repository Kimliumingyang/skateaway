# SkateAway — Codex Art Integration Session 02

## Goal
Replace placeholder artwork in the playable SkateAway prototype with the real assets included in the repository's `Asset.zip`. Deliver a functional, playable browser build with the user's actual characters, background art, UI, obstacles, and effects. Never claim assets are integrated until they are visible in-game.

## Inputs
- `Asset.zip` on the repository's `main` branch (user uploaded it; approximately 25MB).
- Reference design: portrait 750×1334; neon purple / magenta cyberpunk skateboarding.
- Previous offline gameplay prototype can be provided as `SkateAway_Art_Integrated_V0.2.html`. If missing, create a new runnable project with Vite, TypeScript and Phaser 3, following this spec. Do not assume this HTML file is present in GitHub.
- Core loop: player auto-moves to the right, tap/click/Space jumps, tap again for double jump, platform gaps + obstacles cause death, collect coins, score and restart.

## First inspect the archive (mandatory)
1. List every file in `Asset.zip` with filename, media type, dimensions, animation frames and estimated memory size.
2. Unzip to `public/assets/` using safe paths (prevent zip-slip). Preserve the archive unchanged as the source.
3. Generate and commit `docs/ASSET_MANIFEST.md` mapping art files to their runtime use.
4. Identify the genuine transparent player asset(s), animations, coins, obstacles, foreground tiles, far skyline/backdrops, menus, spritesheets and UI buttons. If any asset is absent, document that and use a visibly named placeholder. Do not silently crop full screenshots to imply a transparent animation sprite.

## Implement
- Render player from actual sprite frames. Keep a physics hitbox separate from rendered dimensions. Provide idle/skate, jump, double jump and landing frames when present.
- Render exact user-supplied platform and city art as correctly scrolling layers, with no baked-in score/coins/characters in the collision layer. Keep foreground / background scrolling independent.
- Replace procedural coin and obstacle graphics with actual sprites while preserving collisions and scoring.
- Render the original title, death/retry, pause, settings and ranking UI. Where supplied panels are flattened screenshots, place dynamic score, rankings and functional buttons in interactive overlays; never show fake scores as live data.
- Support responsive portrait rendering around a 750×1334 design area with letterboxing and touch targets.
- Preserve core loop, two jumps per airtime, pause/resume, local ranking, settings persistence and retry. Do not add real rewarded ads or online rankings without an SDK/backend.
- Include appropriate sound / music only when source files are present. Missing assets must not block boot.
- Keep assets under version control (Git LFS if required and available); prefer a source `assets/` folder over loading a ZIP in the browser.

## Acceptance tests
1. `npm install && npm run build` works, no console errors.
2. In a browser, Play enters an actual gameplay scene using the supplied art.
3. First and second jump work; third midair jump does not.
4. The player can fall in gaps, hit obstacles, pick up coins, die and retry.
5. Screens and touch/click targets work: menu, pause, settings, ranking, retry.
6. Text and score are dynamic (don't simply present the source's static 4536 example).
7. Test in desktop and portrait mobile viewport.
8. Provide a browser screenshot, local run instructions, exact list of assets replaced, missing art inventory, and commit/PR URL.
9. Do not stop after planning: implement and test, then report.

## Note
The ChatGPT art integration v0.2 offline HTML uses only the original UI screenshots and two 2048×120 city panorama files previously attached in the chat. The 25MB GitHub ZIP could not be extracted through the connected GitHub contents API due to binary-size/encoding limitations. Codex should inspect the repository directly to access that ZIP and complete the full sprite replacement.

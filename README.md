# SkateAway · YiDD Studio

A playable HTML5 rooftop skateboarding game built with Phaser 3, TypeScript and Vite. The logical canvas is **1920×1080**, with proportional scaling and letterboxing on desktop and mobile. Supplied source artwork stays under `Asset/`; ASCII-named runtime copies live in `public/assets/`.

The current gameplay upgrade follows the two supplied design PDFs. [Gameplay decisions and delivery status](docs/GAMEPLAY_SPEC_RECONCILIATION.md) distinguish the intended scope, missing assets and verified implementation. The feature implementation is complete: 38 unit tests, 22 distinct browser scenarios and the production build pass. [GitHub Pages deployment](https://github.com/Kimliumingyang/skateaway/actions/runs/42430236024) succeeded for the gameplay build. Earlier session reports are retained in [docs/archive](docs/archive/README.md).

Playable preview: https://kimliumingyang.github.io/skateaway/preview/?v=gameplay-docs-20261108

## Run

Requires Node.js 22.18+ (Node 24 recommended) and npm.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. Phones on the same network can use the printed network URL. Landscape orientation gives the largest playable view.

```sh
npm run check
npm run build -- --base=./
npm run preview
```

Browser tests require the dev server in another terminal:

```sh
# Uses /usr/bin/chromium when available; otherwise install Chromium first.
npx playwright install chromium
npm run test:browser
```

Test output and browser captures go to ignored `work/`. Current verification results belong in the [playtest guide](docs/PLAYTEST_GUIDE.md); archived test counts describe earlier revisions.

## Controls and gameplay scope

- Space / click / tap: jump; press again in the air for a double jump. Landing restores both jumps.
- J / the TRICK button: attempt a trick in the air. A successful landing banks the style reward.
- P / Escape / the pause button: pause. Resume, settings, restart and menu remain available.
- Coins, best score, top ten local runs and audio preferences persist in localStorage. Storage failures fall back to session memory.

The upgrade implements fair rooftop chunks, optional high routes, Clean Landing and Near Miss rewards, six-second style combos, nonlethal bumps, five difficulty phases, run missions and the supplied Rocket pickup. Star effects, 300-coin revive and rewarded-ad revive are deferred. Specific implementation status is tracked in the [reconciliation](docs/GAMEPLAY_SPEC_RECONCILIATION.md). Missing art limits which catalog objects can ship with the supplied visuals.

The selected score rule is `floor(distance / 10) + 10 × collected coins + banked style points`. Combo multiplies style points only, using ×1 / ×1.5 / ×2 / ×3 / ×4. The selected pacing keeps the first 20 seconds gentle, caps normal speed at 150% and uses harder patterns plus regular recovery sections afterward.

## Code and assets

`src/game/scenes/` contains boot, menu, gameplay and modal screens. Gameplay logic lives in `src/game/systems/`; the player renderer lives in `entities/Player.ts`. `WorldConfig.ts` defines shared geometry and configuration. Images and collision dimensions are separate; original source images retain their aspect ratios.

The [asset inventory](docs/ASSET_MANIFEST.md) lists the supplied images, sound and animation provenance. The player uses a transparent single-frame character cutout; movement tilt and bob are procedural. Impact crashes use the supplied APNG converted into a four-pose atlas with the original 782ms sequence timing. Genuine skating, jump, landing and trick animation frames are still missing.

Available catalog art includes buildings, two standable signs, an air conditioner, coins, cones, boxes, bananas, caution signs, cracks, a rocket and an energy stone. A star, candy, bird, balloon, brick stack and later specialist hazards require new assets; the energy stone is not relabeled as a star. See the full [missing asset list](docs/GAMEPLAY_SPEC_RECONCILIATION.md#missing-assets).

Coin revives (300 coins), real rewarded advertising, Star effects, online ranking services and a full cosmetic shop are deferred. Rocket uses the supplied pickup art for three seconds of boosted flight (+30% speed), followed by safe landing and 0.8 seconds of protection. Local rankings and the supplied music work independently of those services. Actual iOS / Android hardware, audio behavior and longer-term balance require device playtests.

To regenerate the original runtime copies and [dimension table](docs/ASSET_DIMENSIONS.md), install Python Pillow and run `python scripts/assets.py`. It preserves original source artwork, does not extract `Asset.zip` and leaves the maintained asset manifest / provenance notes unchanged.

Chinese upload checklist: [待补素材与上传说明](docs/MISSING_ASSETS.zh-CN.md).

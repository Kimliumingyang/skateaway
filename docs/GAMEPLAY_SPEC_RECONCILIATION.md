# Gameplay 2.0 — specification decisions and delivery status

This document reconciles the two attached product references: **《SkateAway · 霓虹屋顶滑板跑酷》完整游戏策划案** (gameplay GDD) and **《SkateAway 滑板小子》** (items, pacing and economy; dated August 8, 2026). Both PDFs were read in full. Values are initial design targets subject to playtesting. Historical development reports live in [archive](archive/README.md).

Status: the implemented feature scope below is complete. 38 unit tests, 22 distinct browser scenarios, `npm run check` and the relative-path production build pass. Preview deployment is pending.

## Decisions where documents differ

| Topic | Source difference | Selected rule |
|---|---|---|
| Collision damage | Item table makes every ground object lethal; gameplay 2.0 distinguishes bumps from lethal hazards. | Gameplay 2.0 wins: cone / box bumps break Combo, banana also disables tricks for 0.6s. Gaps, building facades and explicitly lethal hazards end a run. Caution signs and ground cracks remain lethal. |
| Speed | GDD suggests `min(380 + 2.5t, 650)`; pacing document gives five phases and a 150% cap. | Five phases at 0–20 / 20–45 / 45–75 / 75–120 / 120+ seconds. Speed tops out at 150%; later difficulty comes from patterns. Physics and speed remain tuned together in the current Full HD world. |
| Combo | Earlier prototype used ×1 through ×5 and broke Combo on any plain landing. | GDD event thresholds: 0–1 → ×1; 2–3 → ×1.5; 4–5 → ×2; 6–8 → ×3; 9+ → ×4. Six seconds without a successful style event ends Combo. Plain landings do not independently break it. |
| Score | Item document says 1 meter = 1 point; earlier build gave 25 points per coin. | One meter is 10 logical pixels. Score is `floor(distance / 10) + coins × 10 + style`. Only style receives Combo multiplication. Each coin remains one bank currency unit. |
| Star | Catalog initially leaves it TBD; later notes specify shield + magnet. | Shield + coin magnet is the intended effect. Exact Star art is missing, so do not relabel the energy stone or claim Star is integrated. |
| Revive | GDD permits deferral in P0; items explicitly asks for 300 coins or rewarded ad. | Defer both the 300-coin revive and rewarded-ad revive until the next release. The GDD explicitly permits P0 without revive. Preserve once-only run settlement first; no revive / ad path is claimed for this release. |
| Run length | GDD targets new players 30–60s / skilled 90–180s; items targets average 60–90s. | First 20s teach controls; average 60–90s is the balance target. These are playtest goals, not measured player results. |
| Jump feel | GDD supplies new physics starting values and variable-height jumps. | Keep the existing tuned Full HD jump / gravity for this release, including 100ms coyote time and 120ms buffer. Variable jump height and new numeric jump tuning are deferred. |
| Layout | Original integration brief targets portrait; later repository work already uses Full HD landscape. | Retain the current 1920×1080 landscape canvas, proportional scaling, supplied art and responsive controls. |

## Current P0 implementation

The rows below describe this release's code scope, rather than every goal in the source PDFs. Unit, browser and build validation pass; preview publication remains pending until confirmed in the delivery record. No absent artwork is replaced with an unrelated sprite.

| System | Implemented scope |
|---|---|
| Jumping | Existing Full HD jump / gravity, automatic scrolling, two jumps only, 100ms coyote time, 120ms buffer and top-surface landings. Rendering and physics dimensions remain separate. |
| Trick | One Kickflip per airtime through J / touch TRICK. Base reward 100; safe landing banks it. A hit or fall cancels pending points. The animation does not alter the jump trajectory. No separate Double Kickflip. |
| Clean Landing | +50 base style points after crossing a real gap and descending into the next platform's 20–55% region; one event per landing. |
| Near Miss | +75 base style points when clearing close above a hazard; once per obstacle. |
| Combo | ×1 / ×1.5 / ×2 / ×3 / ×4 at the selected event thresholds; expires after six active seconds; pause freezes its timer. Plain landings preserve it. Bumps, death and restart clear the streak. |
| Score / currency | `floor(distance / 10) + coins × 10 + banked style`. Combo multiplies style only. Each coin is one currency unit; collected coins and completed mission bonuses settle once on death. Retry is free. |
| Chunk patterns | Asset-ready C01–C07 pattern tags compose flat runs, small gaps, cone jumps, raised roofs, double gaps, coin arcs and high routes. C08 is explicitly unavailable because Steam Vent art is missing. These are bounded rooftop patterns, not eight separate authored maps. |
| Optional routes | Two variants use supplied aircon / cyber sign / neon sign platforms over a clear main roof. Each variant adds six upper-route bonus coins, arranged around the two platform centers at −80 / 0 / +80px. The base 300px coin grid stays unchanged; the return area is reserved. |
| Reachability | Gap limits use current speed, gravity, jump and roof rise. Generated roofs reserve landing / takeoff space. Optional upper routes preserve the main roof and avoid hazard-filled merges. Generation and route tests are required before release. |
| Hazards | Cone / box / banana are nonlethal and break Combo. Banana also locks tricks for 0.6s. Caution signs, cracks, building facades and falls remain lethal. No flying / steam / drone hazards ship without their art. |
| Difficulty | Learn 0–20s, Flow 20–45s, Pressure 45–75s, Danger 75–120s, Survival 120s+. Normal speed caps at 150%. Current minimum hazard spacing is tuned conservatively for the Full HD geometry: 3.6 / 2.8 / 2.3 / 1.9 / 1.6 seconds. |
| Recovery | A 2.5s lower-pressure beat starts at 12s and repeats every 14s; hazard placement reserves its approach and landing. Short roofs and optional-route roofs stay clear. |
| Missions | Two visible goals per run selected from collect 30 coins (+30), survive 60s (+60) and land five Kickflips (+50). Finalize the bonus once; show it separately in results. |
| Rocket | Existing pickup art gives three seconds of boosted flight at +30% speed. If the timer ends over a gap, flight continues to a safe rooftop; descent then has 0.8s protection. No Star sprite / shield / magnet is claimed. |
| State flow | Menu → immediate running; pause / immediate resume; death animation → results; retry clears the previous run and starts promptly. Start / resume countdowns are deferred. No revive option is included. |
| Local save | Persist bank coins, best score, music / SFX / vibration preferences and top ten local runs. Run metadata includes distance, best multiplier, coins, mission bonus, duration and time; older saves remain compatible. |
| Feedback | Actual style award, Combo timer, mission progress, Rocket status and collision reason are shown in live UI. Existing supplied crash animation remains in use. |

## Design targets retained for later tuning

These are reference goals, not claims about the delivered feature set:

- GDD physics examples use gravity 1,600px/s², first jump −650px/s and second jump −620px/s, plus variable-height release. This release retains its existing Full HD values: gravity 2,700px/s² and jump speed 920px/s. A new numeric jump model / variable height is deferred.
- The source 3s start / resume countdown is deferred to preserve the current fast retry flow.
- Double Kickflip (160), Grind (80/s, capped at 240 per rail), ramp interactions and specialist dynamic / flying hazards remain future work.
- Low / high / risk route targets are 3–5 / 6–9 / 8–12 coins. Current high-route bonuses use the supplied platform art; exact average route yield needs balance testing.
- Source major-hazard intervals are approximately 2–3s / 1.5–2.5s / 1.2–2s / 0.9–1.5s through the first four phases. Current spacing is more conservative to fit the supplied rooftop geometry and keep readable reaction time.
- Average 60–90s runs and 75–100 coins per run are human playtest targets. The deferred 300-coin revive would then take roughly 3–4 runs; this economy is not yet measured.

## Available supplied assets

Checked the extracted `Asset/` files and `public/assets/`, including the runtime map and crash metadata. Original images are preserved; the original `Asset.zip` is not extracted again.

| Catalog need | Actual supplied art |
|---|---|
| City / rooftops | `sky.png`, `skyline.png`, eight `building*.png`, three decorative billboards |
| Standable objects | `sign-cyber.png`, `sign-neon.png`, `aircon.png` |
| Ground objects | `cone.png`, `box.png`, `banana.png`, `warning.png`, `crack.png` |
| Items | `coin.png`, `rocket.png`, `gem.png` (energy stone only) |
| Character | `Asset/Characters/character-cutout.png` / `public/assets/character.png`, one transparent frame |
| Impact crash | `crash.png` / `crash.json`: supplied 23-frame APNG packed as four unique poses, original 782ms sequence |
| Audio / interface | Three source music tracks; selected `Cyan Kickflip` runtime music; generated coin SFX and synthesized feedback; supplied buttons / panels plus current live graffiti UI |

## Missing assets

Do not quietly replace these with unrelated supplied sprites, crop a menu to imply animation, or describe a programmed effect as supplied animation.

| Priority | Required art / sound | Scope affected |
|---|---|---|
| P0 character polish | Genuine skate / run, jump, double-jump, landing and Kickflip transparent frames or atlas, with frame timing / anchors | Current single-frame character uses procedural motion. Impact crash already has supplied animation. |
| Item catalog | Star, candy and brick-stack sprites | Energy stone, coin and box are different objects. Candy gameplay remains TBD in the document. |
| Flying hazards | Balloon and bird animation / sprites, warning / flight audio | Both are absent; movement code alone cannot satisfy supplied-art integration. |
| Power-up feedback | Star shield / magnet visuals and activation / expiry SFX; rocket boost trail / activation / expiry feedback | Rocket pickup image exists; no supplied effect overlays or associated audio are present. |
| C08 / dynamic hazards | Steam vent, pre-warning mist / active steam art and sound | C08's exact visual content cannot ship from the current art set. |
| Later hazards | Drone, electrical wire / arc, swinging sign states and warnings | GDD dynamic / lethal catalog expansion. |
| Later interactions | Grind rail, spark / grind animation and audio, ramp with directional arrows | Full Grind / ramp route content. |
| Long-term progression | Additional boards / outfits / trails / graffiti, shop art and icon set | Cosmetic progression beyond the current P0. |

## Deferred scope

Coin revive (300 coins, at most once per run with safe repositioning and protection), rewarded-ad revive, variable-height jump tuning, Star shield / magnet pending its art, full Grind (80 points/s, 240 maximum per rail), C09–C12 specialist chunks, more city themes, full cosmetic shop, permanent character stat upgrades, multiplayer, online rankings and map editors are outside this P0 unless separately implemented and verified. A real rewarded-ad revive needs a configured provider; a simulated ad is not a released monetization feature.

## Verification and preview delivery record

`npm run check` passes: 38 unit tests and the TypeScript / Vite production build. `npm run build -- --base=./` also passes. All 22 distinct browser scenarios pass across the full run and targeted reruns (19 full-run passes, two targeted reruns, one additional edge case). The generator / asset cleanup also passes a regeneration check: the maintained manifest and all 104 pre-existing source / runtime / archive files remain byte-identical, while the separate dimensions table is regenerated.

The final browser checks cover keyboard / touch controls, pause / retry, rewards, persistence and new gameplay paths. A separate production smoke test also passes with the build mounted at simulated `/skateaway/preview/`: images, fonts and audio load with zero bad responses or page errors; two missions render, the Rocket pickup works, and pausing freezes active effects. Actual public deployment remains pending. Browser emulation is separate from real device balance testing.

Prepared preview URL: https://kimliumingyang.github.io/skateaway/preview/?v=gameplay-docs-20261108

Deployment is pending. This URL is not yet confirmation that the current upgrade is publicly available.

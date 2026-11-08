# SkateAway — current playtest guide

The game uses a 1920×1080 landscape canvas. Current gameplay decisions and the feature checklist are in [GAMEPLAY_SPEC_RECONCILIATION.md](GAMEPLAY_SPEC_RECONCILIATION.md). Old session reports are preserved in [archive](archive/README.md).

## Preview and local run

Prepared Pages preview: https://kimliumingyang.github.io/skateaway/preview/?v=gameplay-docs-20261108

The current gameplay build has been published; [GitHub Pages deployment](https://github.com/Kimliumingyang/skateaway/actions/runs/42430236024) succeeded for the gameplay build. Source changes do not automatically update `main/preview/`. Check the [delivery record](GAMEPLAY_SPEC_RECONCILIATION.md#verification-and-preview-delivery-record) before treating the public URL as the current build.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. For a production preview:

```sh
npm run build -- --base=./
npm run preview
```

Use HTTP; opening `dist/index.html` directly does not exercise normal browser asset loading.

## Controls

- Space / click / tap: jump; repeat in the air to double-jump. A third jump waits for landing.
- J / TRICK button: attempt an aerial trick.
- P / Escape / pause button: pause; resume, retry, settings and menu are available from the pause flow.
- Touch the TRICK button separately from the jump area.

## Acceptance pass

The implemented feature scope has passed the automated browser checks below. Use this acceptance pass for manual balance and device feedback.

1. Start from the menu. Check supplied city art, proportional building sprites, readable values, the player and both input controls. Landscape and portrait phones should keep the Full HD game proportional.
2. Test jump, double jump, rejected third jump and an input immediately before landing. The player must stand on an actual platform top before jumps refresh.
3. Cross both a normal gap and an optional high route. A reachable low route should remain available; each upper-route variant should offer six extra coins while preserving the base route.
4. Jump and press J. No style score is paid in midair; a safe landing pays it once. A hit or fall cancels pending style points. Repeated J must not farm one airtime.
5. Check Clean Landing / Near Miss feedback and the Combo threshold table. A plain landing preserves Combo within six seconds. Wait six active seconds and confirm expiration; pausing must freeze that time.
6. Touch a cone / box and check the nonlethal bump and Combo break. A banana should also prevent tricks for 0.6 seconds. Caution signs, cracks, falling and other lethal hazards should show an understandable death and real results.
7. Check the five difficulty phases, recovery sections and advance warnings. Watch for a ground / flying / gap combination that leaves no possible route. Missing exact catalog art should not be silently substituted.
8. Complete a coin / survival / trick mission. Results should grant each run's collected and bonus coins once. Retry is free and resets the run.
9. Collect the supplied Rocket. Check three seconds of boosted flight at +30% speed, safe landing and 0.8 seconds of protection after flight. Star and both 300-coin / ad revive paths are deferred; no unrelated sprite should stand in for them.
10. Use settings and return through pause / menu. Refresh and verify bank coins, best score, local top ten records and audio preferences. Repeat retry to look for duplicated inputs, sounds or world objects.

## Verification record

`npm run check` passes, including 38 unit tests and the TypeScript / Vite build. The relative-path production build also passes. All 22 distinct browser scenarios pass across the full run and targeted reruns. A separate production smoke test passes at simulated `/skateaway/preview/`: image / font / audio loading has zero bad responses or page errors, two missions render, Rocket collection works and pause freezes effects. [GitHub Pages deployment](https://github.com/Kimliumingyang/skateaway/actions/runs/42430236024) succeeded for the gameplay build. Public-host access is restricted in the execution environment, so deployment status comes from Pages while browser verification uses the production subpath. Archived counts apply only to their historical revisions.

```sh
npm run check
npm run test:browser
```

Browser tests require a running dev server. Tests may position real objects or use controlled steps to make specific collision paths reproducible; that does not establish average human run length or prove long-term difficulty balance.

## Feedback

Record the device / browser, screen orientation, run time, visible obstacle / platform, expected action and actual result. A screenshot and console error help investigate rendering or loading failures. For balance feedback, note coins per run, first-use understanding, double-jump use, high-route choice and whether the death felt avoidable.

Real iOS / Android touch, sound / vibration behavior and longer play sessions remain separate device checks. Missing asset details are in the [reconciliation](GAMEPLAY_SPEC_RECONCILIATION.md#missing-assets).

中文素材清单：[待补素材与上传说明](MISSING_ASSETS.zh-CN.md)。

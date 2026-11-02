# SkateAway crash animation preview

Source: feat/skateaway-crash-animation, commit 01fae32d64204883c0d0c4583ccb4d890d0d2354 (PR #4).
Build: npm run build -- --base=./
Play: https://kimliumingyang.github.io/skateaway/preview/?v=crash-animation-1

Uses the supplied transparent 23-frame APNG crash animation. Runtime atlas preserves original 782ms timing; replay appears 400ms after animation completion. Impacts play once; gap falls keep the falling effect. Opening 1 → 2 → 6 and 324px character/coin route retained. Source PRs unmerged.

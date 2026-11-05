# SkateAway Full-HD flow preview

Source: feat/skateaway-1080-flow, commit dda1f7f265dbb5176c53470c1d40138728603aea.
Build: npm run build -- --base=./
Play: https://kimliumingyang.github.io/skateaway/preview/?v=fullhd-flow-1

1920×1080 logical canvas; proportional 180px player; buildings flush with bottom y=1080 and fixed vertical camera. Static sky, subtle 6% city parallax. Raised coin lines guide jumpable obstacle beats using original cone, box, banana and warning art. Longer low roofs recur for sustained variety; short roofs and periodic recovery beats retain safe landing/takeoff room.

Menu and overlays retain the supplied layout at Full-HD scale. Trick, Combo, crash APNG and retry retained. Runtime image assets unchanged. 15 unit cases and 8 Chromium acceptance scenarios passed, including a 60-second real-collision obstacle/gap simulation. Not yet tested on physical iOS/Android.

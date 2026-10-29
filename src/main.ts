import Phaser from "phaser";
import "./style.css";
import { BootScene } from "./game/scenes/BootScene";
import { MenuScene } from "./game/scenes/MenuScene";
import { GameScene } from "./game/scenes/GameScene";
import { OverlayScene } from "./game/scenes/OverlayScene";
const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: "game",
  width: 750,
  height: 1334,
  backgroundColor: "#180c2e",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, pixelArt: false },
  input: { activePointers: 2 },
  scene: [BootScene, MenuScene, GameScene, OverlayScene],
});
// Scene inspection is intentionally available for browser acceptance checks and tuning.
(window as unknown as { skateaway: Phaser.Game }).skateaway = game;

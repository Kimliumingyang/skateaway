import Phaser from "phaser";
import { PLAYER_HEIGHT } from "../WorldConfig";
/** Single-frame skating art and the user's APNG-derived crash sequence. */
export class Player extends Phaser.GameObjects.Container {
  bodyArt: Phaser.GameObjects.Image;
  crashArt: Phaser.GameObjects.Sprite;
  constructor(scene: Phaser.Scene) {
    super(scene, 240, 440);
    scene.add.existing(this);
    this.setDepth(10);
    this.bodyArt = scene.add
      .image(0, 0, "character", "trimmed")
      .setOrigin(0.5, 1);
    this.bodyArt.setScale(PLAYER_HEIGHT / this.bodyArt.height);
    this.add(this.bodyArt);
    const crash = scene.cache.json.get("crash-data");
    // The atlas's standing pose was packed at 324px; match the skating pose's new height.
    const crashScale = PLAYER_HEIGHT / 324;
    this.crashArt = scene.add.sprite(24 * crashScale, 0, "crash", 0)
      .setOrigin(crash.originX, crash.originY).setScale(crashScale).setVisible(false);
    this.add(this.crashArt);
  }
  playCrash(onComplete: () => void) {
    this.bodyArt.setVisible(false);
    this.crashArt.setVisible(true);
    this.crashArt.once(Phaser.Animations.Events.ANIMATION_COMPLETE, onComplete);
    this.crashArt.play("crash");
  }
  pose(grounded: boolean, vy: number, time: number, trickElapsed = -1) {
    this.bodyArt.rotation = grounded
      ? Math.sin(time * 0.012) * 0.012
      : Phaser.Math.Clamp(vy / 4500, -0.12, 0.14);
    this.bodyArt.y = grounded ? Math.sin(time * 0.018) * 0.8 : 0;
    if (!grounded && trickElapsed >= 0 && trickElapsed < 0.4)
      this.bodyArt.rotation += Math.sin((trickElapsed / 0.4) * Math.PI * 2) * 0.35;
  }
}

import Phaser from "phaser";
import { PLAYER_HEIGHT } from "../WorldConfig";
/** Supplied skating art and APNG jump / crash poses; physics lives separately. */
export class Player extends Phaser.GameObjects.Container {
  bodyArt: Phaser.GameObjects.Image;
  jumpArt: Phaser.GameObjects.Sprite;
  doubleArt: Phaser.GameObjects.Sprite;
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
    const jump = scene.cache.json.get("jump-first-data");
    this.jumpArt = scene.add.sprite(0, 0, "jump-first", 0)
      .setOrigin(jump.originX, jump.originY)
      .setScale(PLAYER_HEIGHT / jump.referenceHeight).setVisible(false);
    this.add(this.jumpArt);
    this.doubleArt = scene.add.sprite(0, 0, "jump-double-v21", 0)
      .setOrigin(0.5, 1).setScale(PLAYER_HEIGHT / 480).setVisible(false);
    this.add(this.doubleArt);
    const crash = scene.cache.json.get("crash-data");
    // The atlas's standing pose was packed at 324px; match the skating pose's new height.
    const crashScale = PLAYER_HEIGHT / 324;
    this.crashArt = scene.add.sprite(24 * crashScale, 0, "crash", 0)
      .setOrigin(crash.originX, crash.originY).setScale(crashScale).setVisible(false);
    this.add(this.crashArt);
  }
  /** Lets grace / Rocket / stumble feedback follow the visible character. */
  get activeArt(): Phaser.GameObjects.Image | Phaser.GameObjects.Sprite {
    return this.doubleArt.visible ? this.doubleArt : this.jumpArt.visible ? this.jumpArt : this.bodyArt;
  }
  /** Called for an accepted physics jump only; playback never moves the player. */
  beginJump(jumpNumber: number) {
    if (this.crashArt.visible || (jumpNumber !== 1 && jumpNumber !== 2)) return;
    this.bodyArt.setVisible(false);
    this.jumpArt.stop().setVisible(jumpNumber === 1);
    this.doubleArt.stop().setVisible(jumpNumber === 2);
    if (jumpNumber === 1) this.jumpArt.play("jump-first");
    else this.doubleArt.play("jump-double-v21");
  }
  playCrash(onComplete: () => void) {
    this.jumpArt.stop().setVisible(false);
    this.doubleArt.stop().setVisible(false);
    this.bodyArt.setVisible(false);
    this.crashArt.setVisible(true);
    this.crashArt.once(Phaser.Animations.Events.ANIMATION_COMPLETE, onComplete);
    this.crashArt.play("crash");
  }
  pose(grounded: boolean, vy: number, time: number, trickElapsed = -1) {
    if (this.crashArt.visible) return;
    if (grounded && (this.jumpArt.visible || this.doubleArt.visible)) {
      this.jumpArt.stop().setVisible(false);
      this.doubleArt.stop().setVisible(false);
      this.bodyArt.setVisible(true);
    }
    const art = this.activeArt;
    art.rotation = grounded
      ? Math.sin(time * 0.012) * 0.012
      : Phaser.Math.Clamp(vy / 4500, -0.12, 0.14);
    art.y = grounded ? Math.sin(time * 0.018) * 0.8 : 0;
    if (!grounded && trickElapsed >= 0 && trickElapsed < 0.4)
      art.rotation += Math.sin((trickElapsed / 0.4) * Math.PI * 2) * 0.35;
  }
}

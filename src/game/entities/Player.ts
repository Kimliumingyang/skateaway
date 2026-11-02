import Phaser from "phaser";
/** Single-frame user-supplied character cutout; motion feedback is procedural, not a sprite animation. */
export class Player extends Phaser.GameObjects.Container {
  bodyArt: Phaser.GameObjects.Image;
  constructor(scene: Phaser.Scene) {
    super(scene, 240, 440);
    scene.add.existing(this);
    this.setDepth(10);
    this.bodyArt = scene.add
      .image(0, 0, "character", "trimmed")
      .setOrigin(0.5, 1);
    this.bodyArt.setScale(132 / this.bodyArt.height);
    this.add(this.bodyArt);
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

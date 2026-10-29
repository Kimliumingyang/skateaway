import Phaser from "phaser";
/** Explicit temporary vector skater. No independent character sprite is supplied. */
export class Player extends Phaser.GameObjects.Container {
  bodyArt: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) {
    super(scene, 185, 860);
    scene.add.existing(this);
    this.setDepth(10);
    this.bodyArt = scene.add.graphics();
    this.add(this.bodyArt);
    const g = this.bodyArt;
    g.lineStyle(7, 0x100c25, 1);
    g.fillStyle(0x1a1636);
    g.fillRoundedRect(-42, -12, 88, 13, 6);
    g.strokeRoundedRect(-42, -12, 88, 13, 6);
    g.fillStyle(0xf2ff38);
    g.fillRoundedRect(-43, -15, 88, 8, 4);
    g.fillStyle(0xef36c4);
    g.fillCircle(-26, 3, 8);
    g.fillCircle(28, 3, 8);
    g.lineStyle(13, 0x100c25);
    g.lineBetween(-16, -19, -11, -52);
    g.lineBetween(-11, -52, 12, -71);
    g.lineBetween(27, -20, 15, -42);
    g.lineBetween(15, -42, 12, -71);
    g.lineStyle(7, 0x82e9ff);
    g.lineBetween(-16, -19, -11, -52);
    g.lineBetween(-11, -52, 12, -71);
    g.lineBetween(27, -20, 15, -42);
    g.lineBetween(15, -42, 12, -71);
    g.fillStyle(0xd329c9);
    g.fillRoundedRect(-8, -105, 36, 42, 10);
    g.lineStyle(4, 0x100c25);
    g.strokeRoundedRect(-8, -105, 36, 42, 10);
    g.lineStyle(11, 0x100c25);
    g.lineBetween(0, -96, -20, -77);
    g.lineBetween(23, -94, 40, -109);
    g.lineStyle(6, 0xffcf93);
    g.lineBetween(0, -96, -20, -77);
    g.lineBetween(23, -94, 40, -109);
    g.fillStyle(0xffcf93);
    g.fillCircle(15, -122, 18);
    g.lineStyle(4, 0x100c25);
    g.strokeCircle(15, -122, 18);
    g.fillStyle(0xeaff35);
    g.fillRoundedRect(-5, -144, 43, 19, 7);
    g.fillRect(19, -132, 28, 6);
    g.fillStyle(0x17132d);
    g.fillRect(22, -123, 7, 6);
  }
  pose(grounded: boolean, vy: number, time: number) {
    this.bodyArt.rotation = grounded
      ? Math.sin(time * 0.015) * 0.018
      : Phaser.Math.Clamp(vy / 3500, -0.19, 0.23);
    this.bodyArt.y = grounded ? Math.sin(time * 0.02) * 1.5 : 0;
  }
}

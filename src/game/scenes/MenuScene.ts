import Phaser from "phaser";
import { label, fitMenuLayout } from "../ui/Controls";
import { marker, paint, graffitiButton, icon, ink } from "../ui/Graffiti";
import { save } from "../systems/SaveManager";
import { audio } from "../systems/AudioManager";
export class MenuScene extends Phaser.Scene {
  constructor() {
    super("Menu");
  }
  create() {
    this.cameras.main.fadeIn(180);
    this.add
      .tileSprite(0, 0, 1334, 750, "sky")
      .setOrigin(0)
      .setTileScale(750 / 1334);
    this.add
      .tileSprite(0, 160, 1334, 590, "skyline")
      .setOrigin(0)
      .setTileScale(590 / 1336);
    this.add.rectangle(667, 375, 1334, 750, 0x1a0d31, 0.35);
    this.add.circle(216, 122, 60, 0xffca7a, 0.86);
    this.add.circle(236, 114, 52, 0x865390, 0.2);
    // The familiar character and rooftop art remain the hero of the menu.
    this.add.ellipse(294, 389, 420, 510, 0x9b51b2, 0.14);
    const roof = this.add.image(-95, 548, "building1").setOrigin(0, 0);
    roof.setScale(0.3);
    const wall = this.add.graphics();
    wall.fillStyle(0x291638).fillPoints(
      [
        { x: 0, y: 605 },
        { x: 510, y: 623 },
        { x: 510, y: 750 },
        { x: 0, y: 750 },
      ],
      true,
    );
    wall.lineStyle(8, 0x160e28).lineBetween(0, 605, 510, 623);
    marker(this, 227, 695, "PEACE", 80, "#74428d").setAngle(-9).setAlpha(0.7);
    const character = this.add
      .image(290, 621, "character", "trimmed")
      .setOrigin(0.5, 1);
    character.setScale(472 / character.height);
    icon(this, 116, 537, "bolt", 50, ink.yellow).setAngle(14);
    icon(this, 468, 623, "crown", 37, ink.yellow).setAngle(16);
    paint(this, 923, 164, 620, 107, 0x130c22, -5);
    marker(this, 928, 151, "SKATEAWAY", 94, "#dbaae8")
      .setAngle(-5)
      .setStroke("#150c24", 5);
    icon(this, 711, 62, "crown", 54, ink.yellow).setAngle(-7);
    const underline = this.add.graphics();
    underline.lineStyle(5, ink.yellow).lineBetween(647, 233, 1194, 190);
    paint(this, 939, 256, 410, 43, 0xd9b5e4, -3);
    marker(this, 939, 253, "OWN THE ROOFTOPS", 24, "#22122f").setAngle(-3);
    graffitiButton(
      this,
      930,
      380,
      "PLAY",
      () => {
        audio.unlock();
        this.scene.start("Game");
      },
      452,
      {
        tone: "primary",
        icon: "play",
        height: 108,
        fontSize: 56,
        name: "play",
      },
    );
    const open = (mode: "settings" | "ranking" | "challenges") => {
      this.scene.launch("Overlay", { mode, origin: "Menu" });
      this.scene.pause();
    };
    graffitiButton(this, 793, 516, "SETTINGS", () => open("settings"), 235, {
      icon: "settings",
      height: 80,
      fontSize: 26,
      name: "settings",
    });
    graffitiButton(this, 1065, 516, "RANKS", () => open("ranking"), 235, {
      icon: "ranks",
      height: 80,
      fontSize: 30,
      name: "ranking",
    });
    graffitiButton(this, 930, 623, "STREET CHALLENGES", () => open("challenges"), 405, {
      icon: "crown", height: 62, fontSize: 25, name: "challenges",
    });
    label(
      this,
      930,
      673,
      `BEST ${save.data.best.toLocaleString()}   ·   BANK ${save.data.wallet.toLocaleString()} COINS   ·   ROOKIE ${save.data.rookieCompleted.length}/7`,
      23,
      "#edc9f2",
    );
    label(
      this,
      878,
      724,
      "TAP / SPACE TO JUMP  ·  TWICE TO DOUBLE JUMP",
      18,
      "#ba91d0",
    );
    if (!save.persistent)
      label(
        this,
        930,
        660,
        "Storage unavailable · progress lasts this session",
        17,
        "#e4c3eb",
      );
    fitMenuLayout(this);
  }
}

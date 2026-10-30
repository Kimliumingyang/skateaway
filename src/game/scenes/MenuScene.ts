import Phaser from "phaser";
import { label, artButton } from "../ui/Controls";
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
      .tileSprite(0, 220, 1334, 530, "skyline")
      .setOrigin(0)
      .setTileScale(530 / 1336);
    this.add.rectangle(667, 375, 1334, 750, 0x11091f, 0.42);
    const character = this.add
      .image(310, 650, "character", "trimmed")
      .setOrigin(0.5, 1);
    character.setScale(470 / character.height);
    label(this, 930, 165, "SKATEAWAY", 82, "#edff42").setAngle(-5);
    label(this, 930, 248, "OWN THE ROOFTOPS", 22, "#eeb5fa");
    artButton(
      this,
      930,
      365,
      "btn_start",
      () => {
        audio.unlock();
        this.scene.start("Game");
      },
      300,
    );
    label(
      this,
      930,
      470,
      `BEST ${save.data.best}    ·    BANK ${save.data.wallet} COINS`,
      22,
      "#edff42",
    );
    artButton(
      this,
      795,
      580,
      "btn_settings",
      () => this.scene.launch("Overlay", { mode: "settings", origin: "Menu" }),
      72,
    );
    artButton(
      this,
      1065,
      580,
      "ranking",
      () => this.scene.launch("Overlay", { mode: "ranking", origin: "Menu" }),
      72,
    );
    label(this, 795, 640, "SETTINGS", 18);
    label(this, 1065, 640, "LOCAL RANKS", 18);
    label(
      this,
      667,
      718,
      "TAP / SPACE · JUMP    ×2 · DOUBLE JUMP     /     YiDD STUDIO",
      18,
      "#d5b8f7",
    );
    if (!save.persistent)
      label(
        this,
        930,
        680,
        "Storage unavailable · progress lasts this session",
        16,
      );
  }
}

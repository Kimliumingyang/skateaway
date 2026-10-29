import Phaser from "phaser";
import { label, artButton, button } from "../ui/Controls";
import { save } from "../systems/SaveManager";
import { audio } from "../systems/AudioManager";
export class MenuScene extends Phaser.Scene {
  constructor() {
    super("Menu");
  }
  create() {
    this.cameras.main.fadeIn(180);
    this.add.image(375, 667, "menu");
    this.add.rectangle(375, 1090, 750, 490, 0x100820, 0.9);
    label(this, 375, 886, "OWN THE ROOFTOPS", 24, "#edff42");
    artButton(
      this,
      375,
      995,
      "btn_start",
      () => {
        audio.unlock();
        this.scene.start("Game");
      },
      341,
    );
    artButton(
      this,
      125,
      1140,
      "btn_settings",
      () => this.scene.launch("Overlay", { mode: "settings", origin: "Menu" }),
      90,
    );
    artButton(
      this,
      625,
      1140,
      "ranking",
      () => this.scene.launch("Overlay", { mode: "ranking", origin: "Menu" }),
      90,
    );
    label(this, 125, 1214, "SETTINGS", 18);
    label(this, 625, 1214, "LOCAL RANKS", 18);
    label(this, 375, 1125, `BEST  ${save.data.best}`, 28, "#eeff42");
    label(this, 375, 1170, `BANK  ${save.data.wallet} COINS`, 20);
    label(
      this,
      375,
      1280,
      "TAP / SPACE · JUMP     ×2 · DOUBLE JUMP",
      19,
      "#d5b8f7",
    );
    if (!save.persistent)
      label(
        this,
        375,
        1245,
        "Storage unavailable · progress lasts this session",
        17,
      );
  }
}

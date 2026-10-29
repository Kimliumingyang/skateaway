import Phaser from "phaser";
import { label } from "../ui/Controls";
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }
  preload() {
    const title = label(this, 375, 610, "SKATEAWAY", 54, "#eeff45");
    label(this, 375, 675, "Loading the rooftops…", 24);
    const bar = this.add.rectangle(175, 730, 0, 6, 0xf225de).setOrigin(0, 0.5);
    this.load.on("progress", (p: number) => (bar.width = 400 * p));
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      title.setText("Asset failed to load");
      console.error("Missing asset", file.key);
    });
    const names = [
      "menu",
      "sky",
      "skyline",
      "building1",
      "building2",
      "building3",
      "building7",
      "coin",
      "cone",
      "box",
      "banana",
      "warning",
      "sign-cyber",
      "sign-neon",
      "hotel",
      "yidd",
      "btn_start",
      "btn_pause",
      "btn_settings",
      "btn_retry",
      "btn_return",
      "btn_continue",
      "ranking",
      "gameover",
      "panel-pause",
      "panel-settings",
      "panel-ranking",
      "sound_on",
      "sound_off",
    ];
    for (const n of names)
      this.load.image(n, `${import.meta.env.BASE_URL}assets/${n}.png`);
  }
  create() {
    this.scene.start("Menu");
  }
}

import Phaser from "phaser";
import { label, fitMenuLayout } from "../ui/Controls";
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }
  preload() {
    const title = label(this, 667, 310, "SKATEAWAY", 54, "#eeff45");
    label(this, 667, 375, "Loading the rooftops…", 24);
    const bar = this.add.rectangle(467, 430, 0, 6, 0xf225de).setOrigin(0, 0.5);
    this.load.on("progress", (p: number) => (bar.width = 400 * p));
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      title.setText("Asset failed to load");
      console.error("Missing asset", file.key);
    });
    const names = [
      "menu",
      "character",
      "sky",
      "skyline",
      "building1",
      "building6",
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
    this.load.spritesheet("crash", `${import.meta.env.BASE_URL}assets/crash.png`, {
      frameWidth: 616,
      frameHeight: 412,
    });
    this.load.json("crash-data", `${import.meta.env.BASE_URL}assets/crash.json`);
    fitMenuLayout(this);
  }
  create() {
    this.textures.get("character").add("trimmed", 0, 150, 32, 880, 1265);
    if (!this.anims.exists("crash")) {
      this.anims.create({
        key: "crash",
        frames: this.cache.json.get("crash-data").frames,
        frameRate: 1000 / 34,
        repeat: 0,
      });
    }
    this.scene.start("Menu");
  }
}

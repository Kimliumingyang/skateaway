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
      "character",
      "sky",
      "skyline",
      "building1",
      "building6",
      "building2",
      "building7",
      "coin",
      "rocket",
      "crack",
      "aircon",
      "cone",
      "box",
      "banana",
      "warning",
      "sign-cyber",
      "sign-neon",
      "yidd",
      "hotel",
      "deep-earth",
    ];
    for (const n of names)
      this.load.image(n, `${import.meta.env.BASE_URL}assets/${n}.png`);
    this.load.spritesheet("crash", `${import.meta.env.BASE_URL}assets/crash.png`, {
      frameWidth: 616,
      frameHeight: 412,
    });
    this.load.json("crash-data", `${import.meta.env.BASE_URL}assets/crash.json`);
    for (const key of ["jump-first", "jump-double"]) {
      // Exact 1/3 source scale, with two transparent padding pixels per edge.
      this.load.spritesheet(key, `${import.meta.env.BASE_URL}assets/${key}.png`, {
        frameWidth: 378,
        frameHeight: 383,
      });
      this.load.json(`${key}-data`, `${import.meta.env.BASE_URL}assets/${key}.json`);
    }
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
    for (const key of ["jump-first", "jump-double"]) {
      if (this.anims.exists(key)) continue;
      const jump = this.cache.json.get(`${key}-data`);
      this.anims.create({
        key,
        frames: jump.frames,
        duration: jump.durationMs,
        repeat: 0,
      });
    }
    this.scene.start("Menu");
  }
}

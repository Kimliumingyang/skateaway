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
      "building3",
      "building4",
      "building5",
      "building7",
      "building8",
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
    this.load.spritesheet("jump-double-v21", `${import.meta.env.BASE_URL}assets/jump-double-v21.png`, {
      frameWidth: 362, frameHeight: 543,
    });
    for (const [name, count] of Object.entries({
      "seagull-fly": 8, "seagull-idle": 4, "seagull-squawk": 4,
      "seagull-hit": 4, "seagull-fall": 4, "seagull-disappear": 3,
      "balloon-idle": 5, "balloon-bob": 5, "balloon-shake": 5, "balloon-pop": 5,
    })) this.load.spritesheet(name, `${import.meta.env.BASE_URL}assets/${name}.png`, {
      frameWidth: 192, frameHeight: 192, endFrame: count - 1,
    });
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
    this.anims.create({ key: "jump-double-v21", frames: this.anims.generateFrameNumbers("jump-double-v21", { end: 7 }), frameRate: 12 });
    for (const [key, end, fps, repeat] of [
      ["seagull-fly", 7, 1000 / 130, -1], ["seagull-idle", 3, 1000 / 280, -1],
      ["seagull-squawk", 3, 1000 / 155, 0], ["seagull-hit", 3, 1000 / 160, 0],
      ["seagull-fall", 3, 1000 / 180, 0], ["seagull-disappear", 2, 1000 / 175, 0],
      ["balloon-idle", 4, 6, -1], ["balloon-bob", 4, 7, -1],
      ["balloon-shake", 4, 11, 0], ["balloon-pop", 4, 9, 0],
    ] as [string, number, number, number][]) {
      this.anims.create({ key, frames: this.anims.generateFrameNumbers(key, { end }), frameRate: fps, repeat });
    }
    this.scene.start("Menu");
  }
}

import Phaser from "phaser";
import { label, button, artButton } from "../ui/Controls";
import { save } from "../systems/SaveManager";
import { audio } from "../systems/AudioManager";
type Mode = "pause" | "settings" | "ranking" | "over";
export class OverlayScene extends Phaser.Scene {
  mode: Mode = "pause";
  origin = "Menu";
  returnMode: Mode = "pause";
  score = 0;
  coins = 0;
  constructor() {
    super("Overlay");
  }
  init(d: { mode: Mode; origin: string; score?: number; coins?: number }) {
    this.mode = d.mode;
    this.origin = d.origin;
    this.returnMode = d.mode;
    this.score = d.score ?? 0;
    this.coins = d.coins ?? 0;
  }
  create() {
    this.draw();
    const key = (e: KeyboardEvent) => {
      if (e.code === "Escape" && this.mode !== "over") this.close();
    };
    this.input.keyboard?.on("keydown", key);
    this.events.once("shutdown", () =>
      this.input.keyboard?.off("keydown", key),
    );
  }
  close() {
    if (this.mode === "settings" && this.returnMode === "pause") {
      this.mode = "pause";
      this.draw();
      return;
    }
    this.scene.stop();
    if (this.origin === "Game") this.scene.resume("Game");
  }
  draw() {
    this.children.removeAll(true);
    this.add.rectangle(375, 667, 750, 1334, 0x090414, 0.88);
    const panel =
      this.mode === "ranking"
        ? "panel-ranking"
        : this.mode === "settings"
          ? "panel-settings"
          : "panel-pause";
    const image = this.add.image(
      375,
      this.mode === "ranking" ? 630 : 400,
      panel,
    );
    image.setScale(650 / image.width);
    // Separate opaque body provides room for dynamic content without covering it with baked-in values.
    this.add
      .rectangle(375, 740, 640, 860, 0x20103e, 0.98)
      .setStrokeStyle(2, 0xa346ed);
    this.add.rectangle(375, 310, 640, 6, 0xf3ff3e);
    label(
      this,
      375,
      370,
      {
        pause: "TAKE A BREATHER",
        settings: "YOUR MIX",
        ranking: "LOCAL LEGENDS",
        over: "RUN ENDED",
      }[this.mode],
      36,
      "#f0ff47",
    );
    if (this.mode === "pause") {
      label(this, 375, 465, "The city can wait.", 24, "#d5b8f7");
      artButton(this, 375, 610, "btn_continue", () => this.close(), 125);
      button(this, 375, 785, "SETTINGS", () => {
        this.returnMode = "pause";
        this.mode = "settings";
        this.draw();
      });
      button(this, 375, 895, "RESTART", () => {
        this.scene.stop("Game");
        this.scene.start("Game");
        this.scene.stop();
      });
      button(this, 375, 1005, "RETURN TO MENU", () => this.menu());
    } else if (this.mode === "settings") {
      label(
        this,
        375,
        470,
        "Saved automatically on this device",
        21,
        "#d5b8f7",
      );
      for (const [i, key] of (["music", "sfx"] as const).entries()) {
        label(
          this,
          270,
          610 + i * 145,
          key === "music" ? "MUSIC" : "SOUND FX",
          30,
        );
        artButton(
          this,
          510,
          610 + i * 145,
          save.data[key] ? "sound_on" : "sound_off",
          () => {
            audio.unlock();
            save.data[key] = !save.data[key];
            save.save();
            audio.sync();
            this.draw();
          },
          112,
        );
      }
      button(this, 375, 980, "SAVE & CLOSE", () => this.close());
    } else if (this.mode === "ranking") {
      label(this, 375, 445, "TOP 10 · ON THIS DEVICE", 20, "#d5b8f7");
      if (!save.data.records.length)
        label(this, 375, 640, "Your first run starts the story.", 24);
      save.data.records.forEach((r, i) => {
        label(
          this,
          130,
          520 + i * 47,
          String(i + 1).padStart(2, "0"),
          22,
          "#ef42d1",
        );
        label(this, 365, 520 + i * 47, String(r.score), 24, "#eeff42");
        label(this, 555, 520 + i * 47, `${r.coins} C`, 20);
      });
      button(this, 375, 1080, "CLOSE", () => this.close());
    } else {
      const im = this.add.image(375, 240, "gameover");
      im.setScale(460 / im.width);
      label(this, 375, 485, "DISTANCE + COIN BONUS", 19, "#d5b8f7");
      label(this, 375, 560, String(this.score).padStart(6, "0"), 70, "#eeff42");
      label(this, 375, 650, `BEST  ${save.data.best}`, 28);
      label(
        this,
        375,
        713,
        `+ ${this.coins} COINS    ·    BANK ${save.data.wallet}`,
        24,
        "#f5b9ee",
      );
      artButton(
        this,
        375,
        865,
        "btn_retry",
        () => {
          this.scene.stop("Game");
          this.scene.start("Game");
          this.scene.stop();
        },
        320,
      );
      button(this, 375, 1030, "RETURN TO MENU", () => this.menu());
    }
    label(this, 375, 1235, "YiDD STUDIO  /  SKATEAWAY", 18, "#a17cc1");
  }
  menu() {
    this.scene.stop("Game");
    this.scene.start("Menu");
    this.scene.stop();
  }
}

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
  restart() {
    this.scene.stop("Game");
    this.scene.start("Game");
  }
  draw() {
    this.children.removeAll(true);
    this.add.rectangle(667, 375, 1334, 750, 0x090414, 0.86);
    const panel = this.add.image(667, 372, "panel-pause");
    panel.setScale(900 / panel.width);
    this.add
      .rectangle(667, 375, 860, 650, 0x20103e, 0.97)
      .setStrokeStyle(2, 0xa346ed);
    this.add.rectangle(667, 53, 860, 5, 0xf3ff3e);
    label(
      this,
      667,
      105,
      {
        pause: "TAKE A BREATHER",
        settings: "YOUR MIX",
        ranking: "LOCAL LEGENDS",
        over: "RUN ENDED",
      }[this.mode],
      36,
      "#eeff42",
    );
    if (this.mode === "pause") {
      label(this, 667, 173, "The city can wait.", 23, "#d5b8f7");
      artButton(this, 667, 275, "btn_continue", () => this.close(), 110);
      button(this, 667, 400, "SETTINGS", () => {
        this.returnMode = "pause";
        this.mode = "settings";
        this.draw();
      });
      button(this, 667, 505, "RESTART", () => this.restart());
      button(this, 667, 610, "RETURN TO MENU", () => this.menu());
    } else if (this.mode === "settings") {
      label(
        this,
        667,
        178,
        "Saved automatically on this device",
        21,
        "#d5b8f7",
      );
      for (const [i, key] of (["music", "sfx"] as const).entries()) {
        label(
          this,
          540,
          300 + i * 125,
          key === "music" ? "MUSIC" : "SOUND FX",
          28,
        );
        artButton(
          this,
          805,
          300 + i * 125,
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
      button(this, 667, 590, "SAVE & CLOSE", () => this.close());
    } else if (this.mode === "ranking") {
      label(this, 667, 162, "TOP 10 · ON THIS DEVICE", 19, "#d5b8f7");
      if (!save.data.records.length)
        label(this, 667, 355, "Your first run starts the story.", 24);
      save.data.records.forEach((r, i) => {
        label(
          this,
          410,
          205 + i * 36,
          String(i + 1).padStart(2, "0"),
          21,
          "#ef42d1",
        );
        label(this, 660, 205 + i * 36, String(r.score), 23, "#eeff42");
        label(this, 920, 205 + i * 36, `${r.coins} C`, 21);
      });
      button(this, 667, 625, "CLOSE", () => this.close());
    } else {
      label(this, 667, 188, "DISTANCE + COIN BONUS", 19, "#d5b8f7");
      label(this, 667, 265, String(this.score).padStart(6, "0"), 68, "#eeff42");
      label(this, 667, 345, `BEST ${save.data.best}`, 27);
      label(
        this,
        667,
        400,
        `+ ${this.coins} COINS   ·   BANK ${save.data.wallet}`,
        23,
        "#f5b9ee",
      );
      artButton(this, 667, 505, "btn_retry", () => this.restart(), 280);
      button(this, 667, 625, "RETURN TO MENU", () => this.menu());
    }
    label(this, 667, 728, "YiDD STUDIO / SKATEAWAY", 16, "#a17cc1");
  }
  menu() {
    this.scene.stop("Game");
    this.scene.start("Menu");
  }
}

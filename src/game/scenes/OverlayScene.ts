import Phaser from "phaser";
import { label, fitMenuLayout } from "../ui/Controls";
import {
  panel,
  paint,
  marker,
  graffitiButton,
  iconButton,
  icon,
  toggle,
  ink,
} from "../ui/Graffiti";
import { save } from "../systems/SaveManager";
import { audio } from "../systems/AudioManager";
type Mode = "pause" | "settings" | "ranking" | "over";
export class OverlayScene extends Phaser.Scene {
  mode: Mode = "pause";
  origin = "Menu";
  returnMode: Mode = "pause";
  score = 0;
  coins = 0;
  bonus = 0;
  rookieBonus = 0;
  maxCombo = 1;
  reason = "";
  missionSummary: string[] = [];
  constructor() {
    super("Overlay");
  }
  init(d: { mode: Mode; origin: string; score?: number; coins?: number; bonus?: number; rookieBonus?: number; maxCombo?: number; reason?: string; missionSummary?: string[] }) {
    this.mode = d.mode;
    this.origin = d.origin;
    this.returnMode = d.mode;
    this.score = d.score ?? 0;
    this.coins = d.coins ?? 0;
    this.bonus = d.bonus ?? 0;
    this.rookieBonus = d.rookieBonus ?? 0;
    this.maxCombo = d.maxCombo ?? 1;
    this.reason = d.reason ?? "";
    this.missionSummary = d.missionSummary ?? [];
  }
  create() {
    this.draw();
    const key = (e: KeyboardEvent) => {
      if (!e.repeat && e.code === "Escape" && this.mode !== "over")
        this.close();
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
    this.scene.resume(this.origin);
  }
  restart() {
    this.scene.stop("Game");
    this.scene.start("Game");
  }
  menu() {
    this.scene.stop("Game");
    this.scene.start("Menu");
  }
  draw() {
    this.children.removeAll(true);
    // Full-screen hit shield prevents popup taps reaching the menu or jump input.
    this.add
      .rectangle(667, 375, 1334, 750, 0x120920, 0.57)
      .setInteractive()
      .on(
        "pointerdown",
        (
          _p: Phaser.Input.Pointer,
          _x: number,
          _y: number,
          e: Phaser.Types.Input.EventData,
        ) => e.stopPropagation(),
      );
    panel(this, 667, 381, 846, 608);
    if (this.mode === "pause") {
      marker(this, 667, 146, "TAKE A BREATHER", 44).setAngle(-2);
      label(this, 667, 213, "The city can wait.", 29, "#d5a8e6");
      this.add.rectangle(667, 240, 170, 2, ink.purple, 0.5);
      graffitiButton(this, 667, 313, "RESUME", () => this.close(), 480, {
        tone: "primary",
        icon: "play",
        height: 88,
        fontSize: 40,
        name: "resume",
      });
      graffitiButton(this, 667, 423, "RESTART", () => this.restart(), 480, {
        icon: "restart",
        height: 80,
        fontSize: 36,
        name: "restart",
      });
      graffitiButton(this, 667, 529, "RETURN TO MENU", () => this.menu(), 480, {
        icon: "home",
        height: 80,
        fontSize: 30,
        name: "menu",
      });
      graffitiButton(
        this,
        667,
        617,
        "SETTINGS",
        () => {
          this.returnMode = "pause";
          this.mode = "settings";
          this.draw();
        },
        230,
        { icon: "settings", height: 48, fontSize: 20, name: "settings" },
      );
      icon(this, 1008, 614, "crown", 63, ink.yellow).setAngle(12);
    } else {
      const title = {
        settings: "SETTINGS",
        ranking: "LOCAL LEGENDS",
        over: "RUN ENDED",
      }[this.mode];
      paint(
        this,
        667,
        110,
        this.mode === "ranking" ? 490 : 440,
        78,
        ink.purple,
        -2,
      );
      marker(
        this,
        686,
        105,
        title,
        this.mode === "ranking" ? 38 : 47,
        "#1b1029",
      ).setAngle(-2);
      icon(
        this,
        this.mode === "ranking" ? 405 : 433,
        107,
        this.mode === "settings"
          ? "settings"
          : this.mode === "over"
            ? "skull"
            : "ranks",
        64,
        this.mode === "over" ? ink.purple : ink.yellow,
      ).setAngle(-9);
      if (this.mode !== "over")
        iconButton(this, 1074, 106, "close", () => this.close(), 70);
      if (this.mode === "settings") this.settings();
      else if (this.mode === "ranking") this.ranking();
      else this.over();
    }
    fitMenuLayout(this);
  }
  settings() {
    const supported = typeof navigator.vibrate === "function";
    const rows = [
      { key: "music", title: "MUSIC", icon: "music" },
      { key: "sfx", title: "SFX", icon: "sound" },
      { key: "vibration", title: "VIBRATION", icon: "phone" },
    ] as const;
    for (const [i, row] of rows.entries()) {
      const y = 275 + i * 119;
      this.add.rectangle(667, y + 55, 650, 2, 0x805390, 0.38);
      icon(this, 377, y, row.icon, 41, ink.light);
      label(this, 541, y, row.title, 34, "#e5bfe9").setOrigin(0, 0.5).setX(434);
      toggle(
        this,
        932,
        y,
        save.data[row.key],
        () => {
          audio.unlock();
          save.data[row.key] = !save.data[row.key];
          save.save();
          audio.sync();
          if (row.key === "vibration" && save.data.vibration)
            navigator.vibrate?.(25);
          this.draw();
        },
        row.key,
        row.key === "vibration" && !supported,
      );
      if (row.key === "vibration" && !supported)
        label(this, 784, y, "UNAVAILABLE", 15, "#a57cbb");
    }
    label(this, 667, 624, "Saved automatically on this device", 21, "#bf94d2");
  }
  ranking() {
    label(this, 667, 172, `BEST ${save.data.best} · ${save.data.bestDistance}m · ${Math.floor(save.data.longestRun)}s · COMBO ×${save.data.bestCombo}`, 20, "#d6b1e4");
    label(this, 667, 198, `ROOKIE ${save.data.rookieCompleted.length}/7 · TOP 10 ON THIS DEVICE`, 18, "#d6b1e4");
    const data = save.data.records;
    if (!data.length) {
      icon(this, 667, 310, "crown", 66, ink.yellow);
      label(this, 667, 392, "Your first run starts the story.", 28, "#e5bfe9");
    } else {
      label(this, 398, 224, "RANK", 17, "#b589cb");
      label(this, 679, 224, "SCORE", 17, "#b589cb");
      label(this, 944, 224, "COINS", 17, "#b589cb");
      data.forEach((r, i) => {
        const y = 268 + i * 30;
        if (i < 3) this.add.rectangle(667, y, 655, 29, 0x83539b, 0.12);
        marker(
          this,
          398,
          y,
          String(i + 1).padStart(2, "0"),
          20,
          i < 3 ? "#ffcb38" : "#c795d8",
        );
        label(this, 679, y, r.score.toLocaleString(), 24, "#ffdb72");
        label(this, 944, y, String(r.coins), 21, "#ddbae6");
      });
    }
    graffitiButton(this, 667, 626, "CLOSE", () => this.close(), 265, {
      height: 58,
      fontSize: 26,
      name: "close-ranking",
    });
  }
  over() {
    label(this, 667, 197, this.reason || "DISTANCE + COINS + STYLE", 20, "#dfbae9");
    marker(this, 650, 284, String(this.score).padStart(6, "0"), 96).setStroke(
      "#150c24",
      3,
    );
    icon(this, 966, 276, "crown", 71, ink.yellow).setAngle(13);
    paint(this, 667, 371, 300, 46, 0x88559f, 0);
    label(
      this,
      667,
      367,
      `BEST ${save.data.best.toLocaleString()}`,
      29,
      "#efd5f4",
    );
    label(
      this,
      667,
      442,
      `+${this.coins} COINS  +${this.bonus} MISSION  +${this.rookieBonus} ROOKIE  ·  BANK ${save.data.wallet.toLocaleString()}`,
      28,
      "#e8c5ed",
    );
    icon(this, 332, 418, "bolt", 62, ink.yellow).setAngle(10);
    label(this, 667, 480, `BEST COMBO ×${this.maxCombo} · DISTANCE RECORD ${save.data.bestDistance}m`, 20, "#bd91ce");
    label(this, 667, 517, this.missionSummary.join("   ·   ") || "SHALL WE REPLAY?", 18, "#bd91ce");
    graffitiButton(this, 477, 568, "RETRY", () => this.restart(), 282, {
      tone: "primary",
      icon: "restart",
      height: 84,
      fontSize: 37,
      name: "retry",
    });
    graffitiButton(this, 837, 568, "RETURN TO MENU", () => this.menu(), 346, {
      icon: "home",
      height: 84,
      fontSize: 25,
      name: "menu",
    });
  }
}

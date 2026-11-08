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
import { ROOKIE_CHALLENGES } from "../systems/RookieChallenges";
import { RunMissions, type RunMission } from "../systems/RunMissions";
import { LEGEND_CATALOG, type LegendId } from "../systems/StreetLegends";
type Mode = "pause" | "settings" | "ranking" | "challenges" | "over";
type ChallengeTab = "rookie" | "missions" | "legends" | "records";
type MissionResult = Pick<RunMission, "id" | "title" | "progress" | "target" | "reward" | "complete">;
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
  missionResults: MissionResult[] = [];
  newRecords: string[] = [];
  newLegends: LegendId[] = [];
  newRookies: string[] = [];
  activeTab: ChallengeTab = "rookie";
  constructor() {
    super("Overlay");
  }
  init(d: { mode: Mode; origin: string; score?: number; coins?: number; bonus?: number; rookieBonus?: number; maxCombo?: number; reason?: string; missionSummary?: string[]; missionResults?: MissionResult[]; newRecords?: string[]; newLegends?: LegendId[]; newRookies?: string[] }) {
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
    this.missionResults = d.missionResults ?? [];
    this.newRecords = d.newRecords ?? [];
    this.newLegends = d.newLegends ?? [];
    this.newRookies = d.newRookies ?? [];
    this.activeTab = d.mode === "challenges" && d.origin === "Game" ? "missions" : "rookie";
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
    if ((this.mode === "settings" || this.mode === "challenges") && this.returnMode === "pause") {
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
      const active = this.scene.get("Game") as Phaser.Scene & { missions?: RunMissions };
      const progress = active.missions?.summary ?? [];
      label(this, 667, 209, progress[0] ?? "The city can wait.", 24, "#d5a8e6");
      if (progress[1]) label(this, 667, 239, progress[1], 24, "#d5a8e6");
      this.add.rectangle(667, 270, 170, 2, ink.purple, 0.5);
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
        804,
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
      graffitiButton(this, 530, 617, "TASKS", () => {
        this.returnMode = "pause";
        this.activeTab = "missions";
        this.mode = "challenges";
        this.draw();
      }, 230, { icon: "ranks", height: 48, fontSize: 20, name: "pause-challenges" });
      icon(this, 1008, 614, "crown", 63, ink.yellow).setAngle(12);
    } else {
      const title = {
        settings: "SETTINGS",
        ranking: "LOCAL LEGENDS",
        challenges: "STREET CHALLENGES",
        over: "RUN ENDED",
      }[this.mode];
      paint(
        this,
        667,
        110,
        this.mode === "ranking" || this.mode === "challenges" ? 490 : 440,
        78,
        ink.purple,
        -2,
      );
      marker(
        this,
        686,
        105,
        title,
        this.mode === "ranking" || this.mode === "challenges" ? 38 : 47,
        "#1b1029",
      ).setAngle(-2);
      icon(
        this,
        this.mode === "ranking" || this.mode === "challenges" ? 405 : 433,
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
      else if (this.mode === "challenges") this.challenges();
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
  challenges() {
    const tabs: { id: ChallengeTab; text: string }[] = [
      { id: "rookie", text: "ROOKIE" }, { id: "missions", text: "MISSIONS" },
      { id: "legends", text: "LEGENDS" }, { id: "records", text: "BEST" },
    ];
    tabs.forEach((tab, index) => graffitiButton(this, 361 + index * 203, 180, tab.text,
      () => { this.activeTab = tab.id; this.draw(); }, 188,
      { tone: this.activeTab === tab.id ? "primary" : "secondary", height: 48,
        fontSize: 19, name: `challenge-${tab.id}` }));
    if (this.activeTab === "rookie") {
      label(this, 667, 220, `FIRST CIRCUIT · ${save.data.rookieCompleted.length}/7 COMPLETE`, 18, "#eac5ef");
      const next = ROOKIE_CHALLENGES.findIndex(task => !save.data.rookieCompleted.includes(task.id));
      ROOKIE_CHALLENGES.forEach((task, index) => {
        const y = 265 + index * 51;
        const done = save.data.rookieCompleted.includes(task.id);
        const now = index === next;
        this.add.rectangle(667, y, 720, 46, now ? 0x9356aa : 0x704b88, now ? 0.42 : 0.18);
        marker(this, 340, y, task.id, 18, done ? "#eeff42" : "#dca8e9");
        label(this, 384, y, task.title, 19, done ? "#eeff42" : "#f4dff4").setOrigin(0, 0.5);
        label(this, 967, y, done ? "DONE" : now ? "+" + task.reward : "LOCKED", 17,
          done ? "#eeff42" : now ? "#ffcb38" : "#a47cb2");
      });
      label(this, 667, 645, "First-time rewards are banked at Run Ended. Missed optional jumps can be retried.", 16, "#b996ca");
    } else if (this.activeTab === "missions") {
      const active = this.origin === "Game" && this.scene.get("Game") as Phaser.Scene & { missions?: RunMissions };
      const missions = active && active.missions ? active.missions : new RunMissions(save.data.runSerial);
      label(this, 667, 232, this.origin === "Game" ? "THIS RUN · 1 EASY + 1 SKILL" : "NEXT RUN · 1 EASY + 1 SKILL", 21, "#eeff42");
      missions.missions.forEach((mission, index) => {
        const y = 340 + index * 162;
        this.add.rectangle(667, y, 720, 142, 0x704b88, 0.25);
        marker(this, 363, y - 40, mission.tier.toUpperCase(), 21, "#ffcb38");
        label(this, 412, y - 40, `${mission.id} · ${mission.title}`, 28, "#f4dff4").setOrigin(0, 0.5);
        label(this, 941, y - 40, `+${mission.reward}`, 23, "#eeff42");
        label(this, 365, y + 8, `${mission.short}  ${mission.progress}/${mission.target}`, 24, "#e4c6ed").setOrigin(0, 0.5);
        this.add.rectangle(659, y + 47, 574, 13, 0x241533);
        this.add.rectangle(372, y + 47, 574 * mission.progress / mission.target, 13,
          mission.complete ? 0xeeff42 : 0xf52bc9).setOrigin(0, 0.5);
      });
      label(this, 667, 647, "Progress updates while skating · rewards settle once after the run.", 17, "#b996ca");
    } else if (this.activeTab === "legends") {
      label(this, 667, 220, `${Object.keys(save.data.legendUnlocked).length}/7 BADGES UNLOCKED · SAVED ON THIS DEVICE`, 18, "#eac5ef");
      LEGEND_CATALOG.forEach((legend, index) => {
        const y = 266 + index * 51;
        const unlocked = !!save.data.legendUnlocked[legend.id];
        const total = Math.min(legend.target, save.data.legendTotals[legend.metric]);
        this.add.rectangle(667, y, 720, 46, 0x704b88, unlocked ? 0.36 : 0.18);
        icon(this, 336, y, "crown", 27, unlocked ? ink.yellow : ink.purple);
        label(this, 374, y - 10, `${legend.title} · ${legend.badge}`, 19,
          unlocked ? "#eeff42" : "#f4dff4").setOrigin(0, 0.5);
        label(this, 374, y + 11, legend.detail, 14, "#b996ca").setOrigin(0, 0.5);
        label(this, 956, y, unlocked ? "DONE" : `${total}/${legend.target}`, 18,
          unlocked ? "#eeff42" : "#d7b1e5");
      });
    } else {
      const records = [
        ["BEST SCORE", save.data.best.toLocaleString()],
        ["BEST DISTANCE", `${save.data.bestDistance} m`],
        ["LONGEST RUN", `${Math.floor(save.data.longestRun)} s`],
        ["BEST COMBO", `×${save.data.bestCombo}`],
      ];
      records.forEach(([title, value], index) => {
        const x = index % 2 === 0 ? 465 : 868;
        const y = index < 2 ? 330 : 510;
        this.add.rectangle(x, y, 345, 145, 0x704b88, 0.32);
        label(this, x, y - 41, title, 20, "#d8aee8");
        marker(this, x, y + 20, value, 43, "#eeff42");
      });
      label(this, 667, 636, "Each record is saved independently. Keep skating to beat your own best.", 17, "#b996ca");
    }
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
      this.newRecords.length ? "NEW RECORD!" : `BEST ${save.data.best.toLocaleString()}`,
      29,
      "#efd5f4",
    );
    label(
      this,
      667,
      438,
      `+${this.coins} COINS  +${this.bonus} MISSION  +${this.rookieBonus} ROOKIE  ·  BANK ${save.data.wallet.toLocaleString()}`,
      24,
      "#e8c5ed",
    );
    icon(this, 332, 418, "bolt", 62, ink.yellow).setAngle(10);
    const unlocks = [
      ...this.newRookies.map(id => `ROOKIE ${id}`),
      ...this.newLegends.map(id => LEGEND_CATALOG.find(legend => legend.id === id)?.badge ?? id),
    ];
    label(this, 667, 397, this.newRecords.length ? this.newRecords.join(" · ") :
      `BEST DISTANCE ${save.data.bestDistance}m · COMBO ×${save.data.bestCombo}`, 17, "#dfbae9");
    if (unlocks.length) label(this, 667, 464, `UNLOCKED · ${unlocks.join(" · ")}`, 17, "#eeff42");
    if (this.missionResults.length) this.missionResults.forEach((mission, index) => {
      label(this, 667, 486 + index * 27,
        `${mission.complete ? "COMPLETE" : "IN PROGRESS"} · ${mission.title} ${mission.progress}/${mission.target}${mission.complete ? ` · +${mission.reward} COINS` : ""}`,
        18, mission.complete ? "#eeff42" : "#d6b1e4");
    });
    else label(this, 667, 502, this.missionSummary.join("   ·   ") || "SHALL WE REPLAY?", 18, "#bd91ce");
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

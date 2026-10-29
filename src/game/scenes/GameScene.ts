import Phaser from "phaser";
import {
  PlayerMotion,
  PlatformGenerator,
  STEP,
  speedAt,
  type Roof,
} from "../systems/Physics";
import { Player } from "../entities/Player";
import { label, artButton } from "../ui/Controls";
import { save } from "../systems/SaveManager";
import { audio } from "../systems/AudioManager";
interface PlatformView {
  roof: Roof;
  art: Phaser.GameObjects.Image;
  ledge: Phaser.GameObjects.Rectangle;
}
interface Item {
  x: number;
  y: number;
  type: "coin" | "cone" | "box" | "banana" | "warning";
  active: boolean;
  sprite: Phaser.GameObjects.Image;
}
export class GameScene extends Phaser.Scene {
  motion!: PlayerMotion;
  player!: Player;
  generator!: PlatformGenerator;
  roofs: PlatformView[] = [];
  roofModels: Roof[] = [];
  roofPool: PlatformView[] = [];
  items: Item[] = [];
  pool: Phaser.GameObjects.Image[] = [];
  distance = 0;
  coins = 0;
  score = 0;
  dead = false;
  accumulator = 0;
  sky!: Phaser.GameObjects.TileSprite;
  far!: Phaser.GameObjects.TileSprite;
  hud!: Phaser.GameObjects.Text;
  best!: Phaser.GameObjects.Text;
  tick = 0;
  constructor() {
    super("Game");
  }
  create() {
    this.cameras.main.fadeIn(180);
    this.motion = new PlayerMotion();
    this.generator = new PlatformGenerator();
    this.roofs = [];
    this.roofModels = [];
    this.roofPool = [];
    this.items = [];
    this.pool = [];
    this.distance = 0;
    this.coins = 0;
    this.score = 0;
    this.dead = false;
    this.accumulator = 0;
    this.tick = 0;
    this.sky = this.add
      .tileSprite(0, 0, 750, 1334, "sky")
      .setOrigin(0)
      .setScrollFactor(0);
    this.far = this.add
      .tileSprite(0, 330, 750, 1000, "skyline")
      .setOrigin(0)
      .setScrollFactor(0);
    this.far.setTileScale(0.75);
    this.add
      .rectangle(375, 80, 750, 160, 0x100820, 0.85)
      .setScrollFactor(0)
      .setDepth(20);
    this.hud = label(this, 190, 80, "", 30, "#eeff42").setDepth(21);
    this.best = label(this, 478, 70, `BEST ${save.data.best}`, 20).setDepth(21);
    artButton(this, 675, 78, "btn_pause", () => this.pause(), 76).setDepth(21);
    label(
      this,
      375,
      1224,
      "TAP / SPACE TO JUMP · TAP AGAIN FOR DOUBLE",
      19,
      "#eeff42",
    ).setDepth(20);
    label(
      this,
      375,
      1272,
      "TEMP SKATER · ORIGINAL CHARACTER FRAMES NEEDED",
      15,
      "#b399cc",
    ).setDepth(20);
    this.addRoof({ x: -100, y: 860, w: 1050, kind: 1 });
    this.populateUntil(2500);
    this.player = new Player(this);
    const jump = () => {
      if (!this.dead) this.motion.requestJump();
    };
    const pointer = (p: Phaser.Input.Pointer) => {
      if (p.y > 170) jump();
    };
    const key = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "Space") {
        e.preventDefault();
        jump();
      }
      if (e.code === "KeyP" || e.code === "Escape") this.pause();
    };
    const visibility = () => {
      audio.sync();
      if (document.hidden) this.pause();
    };
    this.input.on("pointerdown", pointer);
    this.input.keyboard?.on("keydown", key);
    document.addEventListener("visibilitychange", visibility);
    this.events.once("shutdown", () => {
      this.input.off("pointerdown", pointer);
      this.input.keyboard?.off("keydown", key);
      document.removeEventListener("visibilitychange", visibility);
    });
  }
  addRoof(roof: Roof) {
    const recycled = this.roofPool.pop();
    const texture = `building${roof.kind}`,
      im = (recycled?.art ?? this.add.image(0, 0, texture))
        .setTexture(texture)
        .setPosition(roof.x, roof.y)
        .setOrigin(0, 0)
        .setDepth(2)
        .setVisible(true);
    im.setScale(roof.w / im.width);
    // Flat neon rooftop aligns the logical surface; railings in source artwork remain decorative.
    const ledge = (recycled?.ledge ?? this.add.rectangle(0, 0, 1, 7, 0xb464e9))
      .setPosition(roof.x, roof.y)
      .setSize(roof.w, 7)
      .setOrigin(0, 0)
      .setDepth(3)
      .setVisible(true);
    this.roofs.push({ roof, art: im, ledge });
    this.roofModels.push(roof);
    if (this.generator.index > 0) {
      if (this.generator.index % 3 !== 0) {
        const types = ["cone", "box", "banana", "warning"] as const;
        this.addItem(
          roof.x + roof.w * 0.56,
          roof.y,
          types[this.generator.index % 4],
        );
      }
      for (let i = 0; i < 5; i++) {
        const arc =
          this.generator.index % 2 === 0 ? Math.sin((i / 4) * Math.PI) * 95 : 0;
        this.addItem(roof.x + 65 + i * 57, roof.y - 70 - arc, "coin");
      }
      if (this.generator.index % 3 === 0) {
        for (let i = 0; i < 3; i++)
          this.addItem(
            roof.x - 85 + i * 40,
            roof.y - 180 - Math.sin((i / 2) * Math.PI) * 55,
            "coin",
          );
      }
    }
  }
  addItem(x: number, y: number, type: Item["type"]) {
    const sprite = (this.pool.pop() ?? this.add.image(0, 0, type))
      .setTexture(type)
      .setPosition(x, y)
      .setOrigin(0.5, type === "coin" ? 0.5 : 1)
      .setVisible(true)
      .setActive(true)
      .setDepth(5)
      .setAlpha(1);
    const width = type === "coin" ? 43 : type === "banana" ? 56 : 62;
    sprite.setScale(width / sprite.width);
    this.items.push({ x, y, type, active: true, sprite });
  }
  populateUntil(x: number) {
    while (this.roofs.at(-1)!.roof.x + this.roofs.at(-1)!.roof.w < x)
      this.addRoof(
        this.generator.next(this.roofs.at(-1)!.roof, speedAt(this.distance)),
      );
  }
  pause() {
    if (this.dead || this.scene.isPaused()) return;
    this.scene.launch("Overlay", { mode: "pause", origin: "Game" });
    this.scene.pause();
  }
  burst(x: number, y: number, color: number) {
    for (let i = 0; i < 6; i++) {
      const p = this.add.rectangle(x, y, 7, 7, color).setDepth(15);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-70, 70),
        y: y - Phaser.Math.Between(25, 90),
        alpha: 0,
        angle: 120,
        duration: 350,
        onComplete: () => p.destroy(),
      });
    }
  }
  update(_time: number, delta: number) {
    if (this.dead) return;
    this.accumulator += Math.min(delta / 1000, 0.05);
    while (this.accumulator >= STEP && !this.dead) {
      this.fixedUpdate(STEP);
      this.accumulator -= STEP;
    }
    const x = this.motion.x;
    this.player.setPosition(x, this.motion.y);
    this.player.pose(this.motion.grounded, this.motion.vy, this.tick * 1000);
    this.cameras.main.scrollX = x - 185;
    this.sky.tilePositionX = this.distance * 0.08;
    this.far.tilePositionX = this.distance * 0.23;
    this.hud.setText(
      `${String(this.score).padStart(6, "0")}\n${this.coins} COINS`,
    );
    this.best.setText(
      `BEST ${Math.max(save.data.best, this.score)}\n${Math.floor(this.distance / 10)} m`,
    );
  }
  fixedUpdate(dt: number) {
    this.tick += dt;
    const speed = speedAt(this.distance);
    this.distance += speed * dt;
    this.motion.x += speed * dt;
    const event = this.motion.step(dt, this.roofModels);
    if (event) {
      audio.tone(event === "jump" ? "jump" : "land");
      this.burst(
        this.motion.x,
        this.motion.y,
        event === "jump" ? 0xf52bc9 : 0xbcecff,
      );
    }
    this.score = Math.floor(this.distance / 10) + this.coins * 25;
    this.populateUntil(this.motion.x + 1900);
    while (this.roofs[0]?.roof.x + this.roofs[0].roof.w < this.motion.x - 600) {
      const p = this.roofs.shift()!;
      this.roofModels.shift();
      p.art.setVisible(false);
      p.ledge.setVisible(false);
      this.roofPool.push(p);
    }
    for (const item of this.items) {
      if (!item.active) continue;
      const dx = Math.abs(item.x - this.motion.x),
        foot = this.motion.y;
      if (item.type === "coin") {
        if (dx < 42 && Math.abs(item.y - (foot - 65)) < 65) {
          item.active = false;
          item.sprite.setVisible(false);
          this.coins++;
          audio.tone("coin");
          this.burst(item.x, item.y, 0xeeff42);
        }
      } else {
        const h = item.type === "banana" ? 28 : 65;
        if (dx < 36 && foot > item.y - h + 8 && foot - 105 < item.y - 5) {
          this.die();
          break;
        }
      }
    }
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (this.items[i].x < this.motion.x - 500) {
        this.pool.push(this.items[i].sprite.setVisible(false).setActive(false));
        this.items.splice(i, 1);
      }
    }
    if (this.motion.y > 1440) this.die();
  }
  die() {
    if (this.dead) return;
    this.dead = true;
    audio.tone("death");
    this.cameras.main.shake(180, 0.009);
    this.burst(this.motion.x, this.motion.y - 65, 0xff3dbf);
    save.finish(this.score, this.coins);
    this.tweens.add({
      targets: this.player,
      angle: 95,
      alpha: 0,
      y: this.motion.y + 130,
      duration: 450,
    });
    this.time.delayedCall(600, () => {
      this.scene.launch("Overlay", {
        mode: "over",
        origin: "Game",
        score: this.score,
        coins: this.coins,
      });
      this.scene.pause();
    });
  }
}

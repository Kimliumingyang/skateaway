import Phaser from "phaser";
import {
  WIDTH,
  HEIGHT,
  GROUND,
  PLAYER_SCREEN_X,
  PLAYER_HEIGHT,
  PLAYER_BODY_HEIGHT,
  COIN_FOOT_OFFSET,
  CAMERA_BASE_Y,
  deckScale,
  deckWidth,
} from "../WorldConfig";
import {
  PlayerMotion,
  PlatformGenerator,
  STEP,
  speedAt,
  type Roof,
} from "../systems/Physics";
import { layoutRoofItems, type LevelItemType } from "../systems/LevelItems";
import { Player } from "../entities/Player";
import { label, artButton } from "../ui/Controls";
import { save } from "../systems/SaveManager";
import { audio } from "../systems/AudioManager";
import { TrickCombo } from "../systems/TrickCombo";
interface PlatformView {
  roof: Roof;
  art: Phaser.GameObjects.Image;
  ledge: Phaser.GameObjects.Rectangle;
}
interface Item {
  x: number;
  y: number;
  type: LevelItemType;
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
  tricks = new TrickCombo();
  trickStarted = -1;
  trickHint!: Phaser.GameObjects.Text;
  trickButton!: Phaser.GameObjects.Rectangle;
  trickButtonText!: Phaser.GameObjects.Text;
  hintUntil = 0;
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
    this.tricks = new TrickCombo();
    this.trickStarted = -1;
    this.hintUntil = 0;
    this.sky = this.add
      .tileSprite(0, 0, WIDTH, HEIGHT, "sky")
      .setOrigin(0)
      .setScrollFactor(0);
    this.far = this.add
      .tileSprite(0, 50, WIDTH, 650, "skyline")
      .setOrigin(0)
      .setScrollFactor(0);
    this.sky.setTileScale(HEIGHT / 1334);
    this.far.setTileScale(650 / 1336);
    this.add
      .rectangle(WIDTH / 2, GROUND + 25, WIDTH, 50, 0x120d24)
      .setScrollFactor(0)
      .setDepth(4);
    this.add
      .rectangle(WIDTH / 2, GROUND + 2, WIDTH, 4, 0xeb38d5)
      .setScrollFactor(0)
      .setDepth(4);
    this.hud = label(this, 150, 48, "", 30, "#eeff42").setDepth(21);
    this.hud.setStroke("#28113c", 5);
    this.best = label(this, 1045, 43, `BEST ${save.data.best}`, 20).setDepth(
      21,
    );
    artButton(this, 1268, 47, "btn_pause", () => this.pause(), 64).setDepth(21);
    label(
      this,
      WIDTH / 2,
      727,
      "TAP / SPACE · JUMP    ×2 · DOUBLE JUMP    J · TRICK    P / ESC · PAUSE",
      18,
      "#e6cdf8",
    ).setDepth(20);
    this.addRoof({ x: -100, y: 440, w: deckWidth(440, 1), kind: 1 });
    this.populateUntil(2500);
    this.player = new Player(this);
    this.trickHint = label(this, 200, 130, "", 26, "#eeff42").setDepth(21)
      .setStroke("#28113c", 4);
    this.trickButton = this.add.rectangle(WIDTH - 110, HEIGHT - 100, 180, 80, 0x36116c)
      .setStrokeStyle(3, 0xbc6bff).setScrollFactor(0).setDepth(21)
      .setInteractive({ useHandCursor: true });
    this.trickButtonText = label(this, WIDTH - 110, HEIGHT - 100, "TRICK · J", 26)
      .setDepth(22);
    this.trickButton.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number,
      event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.performTrick();
    });
    const jump = () => {
      if (!this.dead) this.motion.requestJump();
    };
    const pointer = (p: Phaser.Input.Pointer) => {
      if (p.y > 100) jump();
    };
    const key = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "Space") {
        e.preventDefault();
        jump();
      }
      if (e.code === "KeyP" || e.code === "Escape") this.pause();
      if (e.code === "KeyJ") this.performTrick();
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
  performTrick() {
    if (this.dead || !this.scene.isActive() || !this.tricks.request(this.motion.grounded)) return;
    this.trickStarted = this.tick;
    this.trickHint.setText("KICKFLIP · LAND TO BANK");
    this.hintUntil = Infinity;
  }
  addRoof(roof: Roof) {
    const previous = this.roofs.at(-1)?.roof;
    const beforePrevious = this.roofs.at(-2)?.roof;
    const recycled = this.roofPool.pop();
    const texture = `building${roof.kind}`,
      im = (recycled?.art ?? this.add.image(0, 0, texture))
        .setTexture(texture)
        .setPosition(roof.x, roof.y)
        .setOrigin(0, 0)
        .setDepth(2)
        .setVisible(true);
    im.setScale(deckScale(roof.y, roof.kind));
    im.y = GROUND - im.displayHeight;
    // Flat neon rooftop aligns the logical surface; railings in source artwork remain decorative.
    const ledge = (recycled?.ledge ?? this.add.rectangle(0, 0, 1, 7, 0xb464e9))
      .setPosition(roof.x, roof.y)
      .setSize(roof.w, 7)
      .setOrigin(0, 0)
      .setDepth(3)
      .setVisible(true);
    this.roofs.push({ roof, art: im, ledge });
    this.roofModels.push(roof);
    // Plan a roof once its outgoing jump destination is known, ahead of the camera.
    for (const spawn of previous ? layoutRoofItems(
      previous,
      this.generator.index - 1,
      speedAt(this.distance),
      { previous: beforePrevious, next: roof },
    ) : []) {
      this.addItem(spawn.x, spawn.y, spawn.type);
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
    // Keep one destination beyond the horizon so even the long opening has its route planned.
    while (this.roofs.at(-1)!.roof.x < x)
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
    if (this.dead) return;
    const x = this.motion.x;
    this.player.setPosition(x, this.motion.y);
    this.player.pose(this.motion.grounded, this.motion.vy, this.tick * 1000,
      this.trickStarted < 0 ? -1 : this.tick - this.trickStarted);
    this.trickButton.setAlpha(!this.motion.grounded && !this.tricks.pending ? 1 : 0.55);
    this.trickButtonText.setAlpha(this.trickButton.alpha);
    if (this.tick >= this.hintUntil) this.trickHint.setText("");
    this.cameras.main.scrollX = x - PLAYER_SCREEN_X;
    // Lower the roof line to y≈500; only follow vertically when a jump would reach the HUD.
    this.cameras.main.scrollY = Math.min(CAMERA_BASE_Y, this.motion.y - PLAYER_HEIGHT - 110);
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
    const oldX = this.motion.x;
    this.motion.x += speed * dt;
    const wasGrounded = this.motion.grounded;
    const event = this.motion.step(dt, this.roofModels);
    const landed = !wasGrounded && this.motion.grounded;
    if (event) {
      audio.tone(event === "jump" ? "jump" : "land");
      this.burst(
        this.motion.x,
        this.motion.y,
        event === "jump" ? 0xf52bc9 : 0xbcecff,
      );
    }
    this.updateScore();
    this.populateUntil(this.motion.x + WIDTH + 800);
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
        if (dx < 44 && Math.abs(item.y - (foot - COIN_FOOT_OFFSET)) < PLAYER_HEIGHT * 0.35) {
          item.active = false;
          item.sprite.setVisible(false);
          this.coins++;
          audio.tone("coin");
          this.burst(item.x, item.y, 0xeeff42);
        }
      } else {
        const h = item.type === "banana" ? 28 : 65;
        if (dx < 36 && foot > item.y - h + 8 && foot - PLAYER_BODY_HEIGHT < item.y - 5) {
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
    // A missed high roof hits its facade instead of passing through the building.
    for (const roof of this.roofModels) {
      if (
        oldX + 18 <= roof.x &&
        this.motion.x + 18 > roof.x &&
        this.motion.y > roof.y + 12 &&
        this.motion.y - PLAYER_BODY_HEIGHT < GROUND
      ) {
        this.die();
        break;
      }
    }
    if (this.motion.y >= GROUND + 8) this.die("fall");
    // Resolve after hazards: touching an obstacle on the landing step cannot bank a trick.
    if (!this.dead && landed) {
      const award = this.tricks.land();
      this.trickStarted = -1;
      if (award) {
        this.trickHint.setText(`KICKFLIP +${award}${this.tricks.combo > 1 ? `\nCOMBO ×${this.tricks.combo}` : ""}`);
        this.hintUntil = this.tick + 1.2;
      }
    }
    this.updateScore();
  }
  updateScore() {
    this.score = Math.floor(this.distance / 10) + this.coins * 25 + this.tricks.points;
  }
  die(reason: "impact" | "fall" = "impact") {
    if (this.dead) return;
    this.dead = true;
    this.tricks.crash();
    this.trickStarted = -1;
    this.trickHint.setText("");
    this.updateScore();
    audio.tone("death");
    this.cameras.main.shake(180, 0.009);
    this.burst(this.motion.x, this.motion.y - 65, 0xff3dbf);
    save.finish(this.score, this.coins);
    const showReplay = () => {
      this.scene.launch("Overlay", {
        mode: "over",
        origin: "Game",
        score: this.score,
        coins: this.coins,
      });
      this.scene.pause();
    };
    this.player.setPosition(this.motion.x, this.motion.y);
    if (reason === "impact") {
      // Freeze the run, let the sprite animation finish, then hold the final pose.
      this.player.playCrash(() => this.time.delayedCall(400, showReplay));
    } else {
      // Falling into a gap retains a falling pose rather than landing in midair.
      this.tweens.add({
        targets: this.player,
        angle: 95,
        alpha: 0.6,
        y: this.motion.y + 40,
        duration: 450,
      });
      this.time.delayedCall(1200, showReplay);
    }
  }
}

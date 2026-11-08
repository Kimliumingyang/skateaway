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
  START_ROOF_Y,
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
import { layoutRoofItems, HAZARDS, PLATFORM_ITEMS, PICKUP_ITEMS, type LevelItemType } from "../systems/LevelItems";
import { Player } from "../entities/Player";
import { label } from "../ui/Controls";
import { marker, graffitiButton, iconButton } from "../ui/Graffiti";
import { save } from "../systems/SaveManager";
import { audio } from "../systems/AudioManager";
import { TrickCombo } from "../systems/TrickCombo";
import { RunMissions } from "../systems/RunMissions";
import { StreetInteractions } from "../systems/StreetInteractions";
import { RookieChallenges, type RookieEvent } from "../systems/RookieChallenges";
interface PlatformView {
  roof: Roof;
  art: Phaser.GameObjects.Image;
  ledge: Phaser.GameObjects.Rectangle;
  billboard: Phaser.GameObjects.Image;
}
interface Item {
  x: number;
  y: number;
  type: LevelItemType;
  active: boolean;
  sprite: Phaser.GameObjects.Image;
  model?: Roof;
  nearMissAwarded?: boolean;
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
  hudCoins!: Phaser.GameObjects.Text;
  best!: Phaser.GameObjects.Text;
  tick = 0;
  tricks = new TrickCombo();
  trickStarted = -1;
  trickHint!: Phaser.GameObjects.Text;
  trickButton!: Phaser.GameObjects.Container;
  hintUntil = 0;
  missionHud!: Phaser.GameObjects.Text;
  rookieHud!: Phaser.GameObjects.Text;
  statusHud!: Phaser.GameObjects.Text;
  tutorial!: Phaser.GameObjects.Text;
  missions = new RunMissions();
  missionNotified = new Set<string>();
  runSequence = 0;
  successfulTricks = 0;
  gapsCleared = 0;
  doubleJumps = 0;
  highPlatforms = 0;
  lastHighPlatform?: Roof;
  lastPassedOrder = -1;
  doubledFromRoof2 = false;
  rookie = new RookieChallenges();
  missionBonus = 0;
  rookieBonus = 0;
  stumbleRemaining = 0;
  graceRemaining = 0;
  rocketRemaining = 0;
  rocketFlying = false;
  takeoffRoof?: Roof;
  lastSupport?: Roof;
  deathReason = "";
  deathCause: "FALL" | "OBSTACLE" | "SEAGULL" | "ELECTRIC" | "OTHER" = "OTHER";
  interactions!: StreetInteractions;
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
    this.missions = new RunMissions(save.data.records.length + this.runSequence++);
    this.missionNotified = new Set();
    this.successfulTricks = 0;
    this.gapsCleared = this.doubleJumps = this.highPlatforms = 0;
    this.lastHighPlatform = undefined;
    this.lastPassedOrder = -1;
    this.doubledFromRoof2 = false;
    this.missionBonus = 0;
    this.rookieBonus = 0;
    this.stumbleRemaining = this.graceRemaining = this.rocketRemaining = 0;
    this.rocketFlying = false;
    this.takeoffRoof = this.lastSupport = undefined;
    this.deathReason = "";
    this.deathCause = "OTHER";
    this.interactions = new StreetInteractions(this);
    this.events.once("shutdown", () => this.interactions.clear());
    this.sky = this.add
      .tileSprite(0, 0, WIDTH, HEIGHT, "sky")
      .setOrigin(0)
      .setScrollFactor(0);
    this.far = this.add
      .tileSprite(0, 0, WIDTH, HEIGHT, "skyline")
      .setOrigin(0)
      .setScrollFactor(0);
    this.sky.setTileScale(HEIGHT / 1334);
    this.far.setTileScale(HEIGHT / 1336);
    this.hud = marker(this, 58, 48, "", 52).setOrigin(0,0.5).setDepth(21);
    this.hudCoins = label(this, 58, 106, "", 37, "#ca82d0").setOrigin(0,0.5).setDepth(21)
      .setStroke("#28113c", 3);
    this.hud.setStroke("#28113c", 5);
    this.best = label(this, WIDTH - 360, 52, `BEST ${save.data.best}`, 27).setDepth(
      21,
    );
    iconButton(this, WIDTH - 96, 66, "pause", () => this.pause(), 90).setDepth(21);
    label(
      this,
      WIDTH / 2,
      HEIGHT - 28,
      "TAP / SPACE · JUMP    ×2 · DOUBLE JUMP    J · TRICK    P / ESC · PAUSE",
      24,
      "#e6cdf8",
    ).setDepth(20);
    this.addRoof({ x: -100, y: START_ROOF_Y, w: deckWidth(START_ROOF_Y, 1), kind: 1,
      order: 0,
      elapsed: (-100 - this.motion.x) / speedAt(0, 0) });
    this.populateUntil(WIDTH + 800);
    this.player = new Player(this);
    this.trickHint = marker(this, 300, 190, "", 30).setDepth(21)
      .setStroke("#28113c", 4);
    this.missionHud = label(this, WIDTH / 2 - 100, HEIGHT - 82, "", 24, "#efd5f4").setDepth(21)
      .setStroke("#28113c", 3);
    this.rookieHud = label(this, WIDTH / 2, 107, "", 24, "#eeff42").setDepth(21)
      .setStroke("#28113c", 3);
    this.statusHud = label(this, WIDTH - 370, 130, "", 24, "#eeff42").setDepth(21)
      .setStroke("#28113c", 3);
    this.tutorial = label(this, WIDTH / 2, 154, "", 30, "#eeff42").setDepth(21)
      .setStroke("#28113c", 4);
    this.trickButton = graffitiButton(this, WIDTH - 160, HEIGHT - 144, "TRICK · J",
      () => this.performTrick(), 260, { tone: "primary", icon: "bolt", height: 108,
        fontSize: 31, name: "trick", trigger: "down" }).setDepth(21);
    const jump = () => {
      if (!this.dead) this.motion.requestJump();
    };
    const pointer = (p: Phaser.Input.Pointer) => {
      if (p.y > 140) jump();
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
    if (this.dead || !this.scene.isActive() || this.stumbleRemaining > 0 || this.rocketFlying || !this.tricks.request(this.motion.grounded)) return;
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
    // Supplied signs decorate the facade; their art does not add a collision surface.
    const sign = roof.kind === 2 ? "hotel" : roof.kind === 6 ? "deep-earth" : "yidd";
    const billboard = (recycled?.billboard ?? this.add.image(0, 0, sign))
      .setTexture(sign).setDepth(3).setVisible(true);
    billboard.setScale(Math.min(135 / billboard.height, roof.w * 0.68 / billboard.width));
    billboard.setPosition(roof.x + roof.w * 0.38, roof.y + 100 + billboard.displayHeight / 2);
    this.roofs.push({ roof, art: im, ledge, billboard });
    this.roofModels.push(roof);
    this.interactions.spawn(roof, this.generator.index);
    // Plan a roof once its outgoing jump destination is known, ahead of the camera.
    for (const spawn of previous ? layoutRoofItems(
      previous,
      this.generator.index - 1,
      speedAt(this.distance, this.tick),
      { previous: beforePrevious, next: roof,
        elapsed: this.tick + Math.max(0, (previous.x - this.motion.x) / speedAt(this.distance, this.tick)) },
    ) : []) {
      this.addItem(spawn.x, spawn.y, spawn.type, previous?.order);
    }
  }
  addItem(x: number, y: number, type: Item["type"], order?: number) {
    const sprite = (this.pool.pop() ?? this.add.image(0, 0, type))
      .setTexture(type)
      .setPosition(x, y)
      .setOrigin(0.5, type === "coin" || type === "rocket" ? 0.5 : 1)
      .setVisible(true)
      .setActive(true)
      .setDepth(5)
      .setAlpha(1);
    const item: Item = { x, y, type, active: true, sprite };
    if (type === "coin") sprite.setScale(48 / sprite.width);
    else if (type === "rocket") sprite.setScale(PICKUP_ITEMS.rocket.height / sprite.height);
    else if (type in PLATFORM_ITEMS) {
      const size = PLATFORM_ITEMS[type as keyof typeof PLATFORM_ITEMS];
      sprite.setDisplaySize(size.width, size.height).setY(y + size.height);
      item.model = { x: x - size.width / 2, y, w: size.width, kind: 0, order };
    } else {
      const size = HAZARDS[type as keyof typeof HAZARDS];
      sprite.setScale(size.height / sprite.height);
    }
    this.items.push(item);
  }
  populateUntil(x: number) {
    // Keep one destination beyond the horizon so even the long opening has its route planned.
    while (this.roofs.at(-1)!.roof.x < x)
      this.addRoof(
        this.generator.next(this.roofs.at(-1)!.roof, speedAt(this.distance, this.tick)),
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
    this.trickButton.setAlpha(!this.motion.grounded && !this.tricks.pending && this.stumbleRemaining <= 0 && !this.rocketFlying ? 1 : 0.55);
    this.player.activeArt.setAlpha(this.graceRemaining > 0 ? 0.55 + Math.sin(this.tick * 35) * 0.25 : 1);
    this.player.activeArt.setTint(this.rocketFlying ? 0xffdd85 : 0xffffff);
    if (this.stumbleRemaining > 0) this.player.activeArt.rotation += Math.sin(this.tick * 40) * 0.16;
    this.missionHud.setText(this.missions.summary.join("    ·    "));
    this.rookieHud.setText(this.rookie.current ? `ROOKIE ${this.rookie.progress + 1}/7 · ${this.rookie.current.title}` : "ROOKIE CHALLENGES COMPLETE");
    this.statusHud.setText(this.rocketFlying ? this.rocketRemaining > 0 ? `ROCKET ${Math.ceil(this.rocketRemaining)}s` : "ROCKET · SAFE LANDING" :
      this.stumbleRemaining > 0 ? "OFF BALANCE · TRICK LOCKED" :
      this.tricks.combo > 0 ? `COMBO ×${this.tricks.multiplier} · ${this.tricks.remaining.toFixed(1)}s` : "");
    this.tutorial.setText(this.tick < 5 ? "TAP / SPACE TO JUMP" : this.tick < 10 ? "TAP AGAIN FOR DOUBLE JUMP" :
      this.tick < 18 ? "FOLLOW COINS · SIGNS ARE SAFE PLATFORMS" : this.tick < 24 ? "PRESS J / TRICK IN THE AIR" : "");
    if (this.tick >= this.hintUntil) this.trickHint.setText("");
    this.cameras.main.scrollX = x - PLAYER_SCREEN_X;
    // Fixed vertical camera keeps every building base on the bottom pixel.
    this.cameras.main.scrollY = CAMERA_BASE_Y;
    this.sky.tilePositionX = 0;
    this.far.tilePositionX = this.distance * 0.06;
    this.hud.setText(
      String(this.score).padStart(6, "0"),
    );
    this.hudCoins.setText(`${this.coins} COINS`);
    this.best.setText(
      `BEST ${Math.max(save.data.best, this.score)}\n${Math.floor(this.distance / 10)} m`,
    );
  }
  fixedUpdate(dt: number) {
    this.tick += dt;
    this.tricks.tick(dt);
    this.stumbleRemaining = Math.max(0, this.stumbleRemaining - dt);
    this.graceRemaining = Math.max(0, this.graceRemaining - dt);
    this.rocketRemaining = Math.max(0, this.rocketRemaining - dt);
    const speed = speedAt(this.distance, this.tick) * (this.rocketFlying ? 1.3 : this.stumbleRemaining > 0 ? 0.8 : 1);
    this.distance += speed * dt;
    const oldX = this.motion.x;
    this.motion.x += speed * dt;
    const wasGrounded = this.motion.grounded;
    const supports = [...this.roofModels, ...this.items.flatMap(item => item.active && item.model ? [item.model] : [])];
    const groundSupport = wasGrounded ? this.supportAt(supports, oldX) : undefined;
    const event = this.motion.step(dt, supports);
    if (wasGrounded && !this.motion.grounded) this.takeoffRoof = groundSupport ?? this.lastSupport;
    if (this.rocketFlying) {
      const under = this.roofModels.find(roof => this.motion.x >= roof.x && this.motion.x <= roof.x + roof.w);
      if (this.rocketRemaining <= 0 && under && under.x + under.w - this.motion.x > speed * 0.25 + 24) {
        this.rocketFlying = false;
        this.graceRemaining = 0.8;
        this.motion.y = under.y - 30;
        this.motion.vy = 90;
      } else {
        const ahead = under ?? this.roofModels.find(roof => roof.x > this.motion.x);
        if (ahead) this.motion.y = Math.min(this.motion.y, ahead.y - 120);
        this.motion.vy = 0;
      }
      this.motion.grounded = false;
    }
    const landed = !wasGrounded && this.motion.grounded;
    if (this.motion.grounded) this.lastSupport = this.supportAt(supports);
    if (this.motion.grounded && this.lastSupport?.kind === 0 && this.lastHighPlatform !== this.lastSupport) {
      this.highPlatforms++;
      this.lastHighPlatform = this.lastSupport;
      this.rookieEvent({ type: "high", order: this.lastSupport.order ?? -1 });
    }
    if (event) {
      if (event === "jump" && !this.rocketFlying) this.player.beginJump(this.motion.jumps);
      if (event === "jump" && this.motion.jumps === 2) this.doubleJumps++;
      if (event === "jump" && this.motion.jumps === 2 && this.takeoffRoof?.order === 1)
        this.doubledFromRoof2 = true;
      audio.tone(event === "jump" ? "jump" : "land");
      this.burst(
        this.motion.x,
        this.motion.y,
        event === "jump" ? 0xf52bc9 : 0xbcecff,
      );
    }
    this.updateScore();
    this.populateUntil(this.motion.x + WIDTH + 800);
    for (const roof of this.roofModels) {
      if ((roof.order ?? -1) > this.lastPassedOrder && this.motion.x >= roof.x + roof.w) {
        this.lastPassedOrder = roof.order ?? -1;
        this.rookieEvent({ type: "pass", order: this.lastPassedOrder });
      }
    }
    this.interactions.step(dt, this.motion, speed, () => {
      if (!this.dead && !this.rocketFlying && this.graceRemaining <= 0)
        this.die("impact", "HIT A SILLY SEAGULL", "SEAGULL");
    }, (x, y) => {
      this.motion.vy = -920 * 1.15;
      this.motion.grounded = false;
      this.styleHint("BALLOON BOUNCE!");
      this.burst(x, y, 0xffd75e);
      audio.tone("jump");
    });
    if (this.dead) return;
    while (this.roofs[0]?.roof.x + this.roofs[0].roof.w < this.motion.x - 600) {
      const p = this.roofs.shift()!;
      this.roofModels.shift();
      p.art.setVisible(false);
      p.ledge.setVisible(false);
      p.billboard.setVisible(false);
      this.roofPool.push(p);
    }
    for (const item of this.items) {
      if (!item.active || item.model) continue;
      const dx = Math.abs(item.x - this.motion.x), foot = this.motion.y;
      if (item.type === "coin" || item.type === "rocket") {
        if (dx < 44 && Math.abs(item.y - (foot - COIN_FOOT_OFFSET)) < (this.rocketFlying ? 140 : PLAYER_HEIGHT * 0.35)) {
          item.active = false;
          item.sprite.setVisible(false);
          if (item.type === "coin") {
            this.coins++;
            audio.tone("coin");
            this.burst(item.x, item.y, 0xeeff42);
          } else {
            this.rocketRemaining = 3;
            this.rocketFlying = true;
            this.motion.buffer = 0;
            this.tricks.pending = false;
            this.styleHint("ROCKET · 3s FLIGHT BOOST");
            this.burst(item.x, item.y, 0xff9c35);
          }
        }
        continue;
      }
      const hazard = HAZARDS[item.type as keyof typeof HAZARDS];
      if (dx < hazard.width * 0.38 + 15 && foot > item.y - hazard.height + 8 && foot - PLAYER_BODY_HEIGHT < item.y - 5) {
        if (this.rocketFlying || this.graceRemaining > 0) continue;
        if (item.type === "cone" || item.type === "box" || item.type === "banana") {
          item.active = false;
          item.sprite.setVisible(false);
          this.tricks.crash();
          this.trickStarted = -1;
          this.graceRemaining = 0.7;
          this.stumbleRemaining = item.type === "banana" ? 0.6 : 0.25;
          this.styleHint(item.type === "banana" ? "SLIP! · COMBO LOST · TRICK LOCKED" : "BUMP! · COMBO LOST");
          this.burst(item.x, item.y - 25, 0xff9c35);
          audio.tone("land");
        } else {
          this.die(item.type === "crack" ? "fall" : "impact", item.type === "crack" ? "MISSED THE CRACK" : "HIT A CAUTION SIGN");
          break;
        }
      } else if (!item.nearMissAwarded && !this.rocketFlying && this.graceRemaining <= 0 && !this.motion.grounded && oldX <= item.x && this.motion.x > item.x &&
        foot <= item.y - hazard.height + 8 && foot > item.y - hazard.height - 38) {
        item.nearMissAwarded = true;
        const award = this.tricks.award(75);
        this.styleHint(`NEAR MISS +${award} · COMBO ×${this.tricks.multiplier}`);
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
        if (!this.rocketFlying) this.die("impact", "HIT THE BUILDING FACADE");
        break;
      }
    }
    if (this.motion.y >= GROUND + 8 && !this.rocketFlying) this.die("fall", "FELL BETWEEN ROOFS");
    // Resolve after hazards: touching an obstacle on the landing step cannot bank a trick.
    if (!this.dead && landed) {
      const didTrick = this.tricks.pending;
      const award = this.tricks.land();
      if (didTrick && award) this.successfulTricks++;
      this.trickStarted = -1;
      const support = this.lastSupport;
      const ratio = support ? (this.motion.x - support.x) / support.w : -1;
      const crossedGap = support && this.takeoffRoof && support !== this.takeoffRoof &&
        this.takeoffRoof.x + this.takeoffRoof.w < support.x;
      if (crossedGap) this.gapsCleared++;
      if (crossedGap && support?.kind !== 0) this.rookieEvent({ type: "land", order: support?.order ?? -1,
        doubleJump: this.doubledFromRoof2 });
      this.doubledFromRoof2 = false;
      const clean = crossedGap && ratio >= 0.2 && ratio <= 0.55 && this.graceRemaining <= 0 ? this.tricks.award(50) : 0;
      if (award || clean) this.styleHint(`${award ? `KICKFLIP +${award}` : ""}${clean ? `  CLEAN LANDING +${clean}` : ""}\nCOMBO ×${this.tricks.multiplier}`);
      this.takeoffRoof = undefined;
    }
    this.updateMissions();
    this.updateScore();
  }
  updateScore() {
    this.score = Math.floor(this.distance / 10) + this.coins * 10 + this.tricks.points;
  }
  updateMissions() {
    this.missions.update({ coins: this.coins, seconds: this.tick, gaps: this.gapsCleared,
      doubles: this.doubleJumps, tricks: this.successfulTricks, high: this.highPlatforms });
    if (!this.dead) for (const mission of this.missions.missions) {
      if (mission.complete && !this.missionNotified.has(mission.id)) {
        this.missionNotified.add(mission.id);
        this.styleHint(`MISSION COMPLETE! · ${mission.title}\n+${mission.reward} COINS`);
      }
    }
  }
  rookieEvent(event: RookieEvent) {
    const award = this.rookie.observe(event);
    if (award) this.styleHint(`CHALLENGE COMPLETE! · ${award.title}\n+${award.reward} COINS`);
  }
  supportAt(supports: Roof[], x = this.motion.x) {
    return supports.find(roof => x + 18 > roof.x && x - 18 < roof.x + roof.w && Math.abs(this.motion.y - roof.y) < 2);
  }
  styleHint(text: string) {
    this.trickHint.setText(text);
    this.hintUntil = this.tick + 1.8;
  }
  die(reason: "impact" | "fall" = "impact", explanation = "COLLISION",
      cause: "FALL" | "OBSTACLE" | "SEAGULL" | "ELECTRIC" | "OTHER" = reason === "fall" ? "FALL" : "OBSTACLE") {
    if (this.dead) return;
    this.dead = true;
    this.deathReason = explanation;
    this.deathCause = cause;
    this.interactions.clear();
    this.updateMissions();
    this.missionBonus = this.missions.settle();
    this.rookieBonus = save.data.pendingRookieBonus;
    this.tricks.crash();
    this.trickStarted = -1;
    this.trickHint.setText("");
    this.updateScore();
    audio.tone("death");
    if (save.data.vibration) navigator.vibrate?.(80);
    this.cameras.main.shake(180, 0.009);
    this.burst(this.motion.x, this.motion.y - 65, 0xff3dbf);
    save.finish(this.score, this.coins, { distance: Math.floor(this.distance / 10),
      maxCombo: this.tricks.bestMultiplier, bonus: this.missionBonus, seconds: this.tick,
      rookieBonus: this.rookieBonus, deathCause: this.deathCause });
    const showReplay = () => {
      this.scene.launch("Overlay", {
        mode: "over",
        origin: "Game",
        score: this.score,
        coins: this.coins,
        bonus: this.missionBonus,
        rookieBonus: this.rookieBonus,
        missionSummary: this.missions.summary,
        maxCombo: this.tricks.bestMultiplier,
        reason: this.deathReason,
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

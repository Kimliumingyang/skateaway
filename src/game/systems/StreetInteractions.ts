import Phaser from "phaser";
import type { Roof, PlayerMotion } from "./Physics.ts";

type BirdState = "FLYING" | "STUNNED" | "FALLING" | "REMOVED";
type BalloonState = "BOBBING" | "SHAKING" | "POPPING" | "REMOVED";
interface Bird { sprite: Phaser.GameObjects.Sprite; x: number; y: number; state: BirdState; age: number }
interface Balloon { sprite: Phaser.GameObjects.Sprite; x: number; y: number; state: BalloonState; age: number }

/** World-space event objects. Visual frames never determine collision size. */
export class StreetInteractions {
  birds: Bird[] = [];
  balloons: Balloon[] = [];
  constructor(private scene: Phaser.Scene) {}

  spawn(roof: Roof, index: number) {
    // Keep the authored ten-roof lesson and all short landing/takeoff zones clear.
    if (index < 10 || roof.w < 550 || index % 4 !== 0) return;
    const x = roof.x + roof.w * 0.58;
    if (index % 8 === 0) {
      const y = roof.y - 100;
      const sprite = this.scene.add.sprite(x, y, "balloon-bob").setDepth(8).setScale(0.85).play("balloon-bob");
      this.balloons.push({ sprite, x, y, state: "BOBBING", age: 0 });
    } else {
      const y = roof.y - 205;
      const sprite = this.scene.add.sprite(x + 180, y, "seagull-fly").setDepth(8).setScale(0.8).play("seagull-fly");
      this.birds.push({ sprite, x: x + 180, y, state: "FLYING", age: 0 });
    }
  }

  step(dt: number, motion: PlayerMotion, speed: number, onBirdHit: () => void, onBalloon: (x: number, y: number) => void) {
    for (const bird of this.birds) {
      bird.age += dt;
      if (bird.state === "FLYING") {
        bird.x -= speed * 0.18 * dt;
        bird.sprite.setPosition(bird.x, bird.y + Math.sin(bird.age * 5) * 9);
        // Only the body core interacts; wings are decorative.
        if (Math.abs(motion.x - bird.x) < 46 && Math.abs(motion.y - 90 - bird.sprite.y) < 42) {
          bird.state = "STUNNED";
          bird.age = 0;
          bird.sprite.play("seagull-hit");
          onBirdHit();
        }
      } else if (bird.state === "STUNNED" && bird.age > 0.58) {
        bird.state = "FALLING";
        bird.age = 0;
        bird.sprite.play("seagull-fall");
      } else if (bird.state === "FALLING") {
        bird.sprite.y += 250 * dt;
        if (bird.age > 0.8) { bird.state = "REMOVED"; bird.sprite.destroy(); }
      }
      if (bird.state !== "REMOVED" && bird.x < motion.x - 600) { bird.state = "REMOVED"; bird.sprite.destroy(); }
    }
    this.birds = this.birds.filter(bird => bird.state !== "REMOVED");
    for (const balloon of this.balloons) {
      balloon.age += dt;
      if (balloon.state === "BOBBING") {
        balloon.sprite.setPosition(balloon.x + Math.sin(balloon.age * 1.3) * 18,
          balloon.y + Math.sin(balloon.age * 3) * 10);
        // Descending feet must contact the top of the balloon's body; rope is visual only.
        if (motion.vy > 0 && Math.abs(motion.x - balloon.sprite.x) < 52 &&
          motion.y >= balloon.sprite.y - 56 && motion.y <= balloon.sprite.y - 12) {
          balloon.state = "SHAKING";
          balloon.age = 0;
          balloon.sprite.play("balloon-shake");
          onBalloon(balloon.x, balloon.y);
        }
      } else if (balloon.state === "SHAKING" && balloon.age > 0.46) {
        balloon.state = "POPPING";
        balloon.age = 0;
        balloon.sprite.play("balloon-pop");
      } else if (balloon.state === "POPPING" && balloon.age > 0.57) {
        balloon.state = "REMOVED";
        balloon.sprite.destroy();
      }
      if (balloon.state !== "REMOVED" && balloon.x < motion.x - 600) {
        balloon.state = "REMOVED"; balloon.sprite.destroy();
      }
    }
    this.balloons = this.balloons.filter(balloon => balloon.state !== "REMOVED");
  }

  clear() {
    for (const item of [...this.birds, ...this.balloons]) item.sprite.destroy();
    this.birds = [];
    this.balloons = [];
  }
}

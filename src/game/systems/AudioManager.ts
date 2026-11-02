import { save } from "./SaveManager";
class AudioManager {
  music = new Audio(`${import.meta.env.BASE_URL}assets/music.mp3`);
  context?: AudioContext;
  unlocked = false;
  constructor() {
    this.music.loop = true;
    this.music.volume = 0.32;
  }
  unlock() {
    this.unlocked = true;
    try {
      this.context ??= new AudioContext();
      void this.context.resume().catch(() => {});
    } catch {}
    this.sync();
  }
  sync() {
    if (this.unlocked && save.data.music && !document.hidden)
      void this.music.play().catch(() => {});
    else this.music.pause();
  }
  tone(kind: "jump" | "coin" | "land" | "death") {
    if (!save.data.sfx || !this.context) return;
    const ctx = this.context,
      o = ctx.createOscillator(),
      g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    const f = { jump: 340, coin: 1000, land: 100, death: 160 }[kind];
    o.type = kind === "death" ? "sawtooth" : "sine";
    o.frequency.setValueAtTime(f, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      kind === "death" ? 35 : f * 1.6,
      ctx.currentTime + 0.13,
    );
    g.gain.setValueAtTime(0.07, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    o.start();
    o.stop(ctx.currentTime + 0.2);
  }
}
export const audio = new AudioManager();

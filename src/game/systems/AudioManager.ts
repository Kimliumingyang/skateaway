import { save } from "./SaveManager";
class AudioManager {
  music = new Audio(`${import.meta.env.BASE_URL}assets/music.mp3`);
  context?: AudioContext;
  unlocked = false;
  coinBuffer?: AudioBuffer;
  coinLoading?: Promise<void>;
  coinVoices = new Set<AudioBufferSourceNode>();
  lastCoin = -1;
  constructor() {
    this.music.loop = true;
    this.music.volume = 0.32;
  }
  unlock() {
    this.unlocked = true;
    try {
      this.context ??= new AudioContext();
      void this.context.resume().catch(() => {});
      void this.loadCoin();
    } catch {}
    this.sync();
  }
  loadCoin() {
    if (this.coinBuffer || !this.context) return;
    const context = this.context;
    this.coinLoading ??= fetch(`${import.meta.env.BASE_URL}assets/sfx/coin.wav`)
      .then(response => {
        if (!response.ok) throw new Error("Coin SFX unavailable");
        return response.arrayBuffer();
      })
      .then(data => context.decodeAudioData(data))
      .then(buffer => { this.coinBuffer = buffer; })
      .catch(() => { this.coinLoading = undefined; });
    return this.coinLoading;
  }
  playCoin() {
    const context = this.context!;
    if (context.currentTime - this.lastCoin < 0.035) return;
    this.lastCoin = context.currentTime;
    if (this.coinVoices.size >= 4) {
      const oldest = this.coinVoices.values().next().value!;
      this.coinVoices.delete(oldest);
      oldest.stop();
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = this.coinBuffer!;
    gain.gain.value = 0.22;
    source.connect(gain).connect(context.destination);
    this.coinVoices.add(source);
    source.onended = () => { this.coinVoices.delete(source); source.disconnect(); gain.disconnect(); };
    source.start();
  }
  sync() {
    if (!save.data.sfx || document.hidden) {
      for (const voice of this.coinVoices) voice.stop();
      this.coinVoices.clear();
    }
    if (this.unlocked && save.data.music && !document.hidden)
      void this.music.play().catch(() => {});
    else this.music.pause();
  }
  tone(kind: "jump" | "coin" | "land" | "death") {
    if (!save.data.sfx || !this.context) return;
    if (kind === "coin" && this.coinBuffer) { this.playCoin(); return; }
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

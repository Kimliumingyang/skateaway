import Phaser from "phaser";
export const textStyle = {
  fontFamily: "Arial, sans-serif",
  fontSize: "26px",
  color: "#f8f0ff",
};
export function label(
  s: Phaser.Scene,
  x: number,
  y: number,
  t: string,
  size = 26,
  color = "#f8f0ff",
) {
  return s.add
    .text(x, y, t, { ...textStyle, fontSize: size, color })
    .setOrigin(0.5)
    .setScrollFactor(0);
}
export function button(
  s: Phaser.Scene,
  x: number,
  y: number,
  t: string,
  action: () => void,
  w = 400,
) {
  const bg = s.add
    .rectangle(x, y, w, 76, 0x36116c)
    .setStrokeStyle(2, 0xbc6bff)
    .setScrollFactor(0);
  const tx = label(s, x, y, t, 26);
  bg.setInteractive({ useHandCursor: true })
    .on("pointerover", () => bg.setFillStyle(0x6821a6))
    .on("pointerout", () => bg.setFillStyle(0x36116c))
    .on("pointerdown", () => {
      bg.setScale(0.97);
      tx.setScale(0.97);
    })
    .on("pointerup", () => {
      bg.setScale(1);
      tx.setScale(1);
      action();
    });
  return bg;
}
export function artButton(
  s: Phaser.Scene,
  x: number,
  y: number,
  key: string,
  action: () => void,
  width?: number,
) {
  const b = s.add.image(x, y, key).setScrollFactor(0);
  if (width) b.setScale(width / b.width);
  return b
    .setInteractive({ useHandCursor: true })
    .on("pointerover", () => b.setTint(0xe5d4ff))
    .on("pointerout", () => b.clearTint())
    .on("pointerup", action);
}

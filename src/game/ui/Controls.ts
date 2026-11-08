import Phaser from "phaser";
import { WIDTH } from "../WorldConfig";

/** Keep the supplied menu layout while fitting the new 16:9 logical canvas. */
export function fitMenuLayout(scene: Phaser.Scene) {
  const children = scene.children.getChildren().slice();
  scene.add.container(0, 0, children).setScale(WIDTH / 1334);
}

export const textStyle = {
  fontFamily: '"Kalam", Arial, sans-serif',
  fontStyle: "bold",
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

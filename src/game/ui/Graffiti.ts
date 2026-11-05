import Phaser from "phaser";

export const ink = {
  dark: 0x160e28,
  panel: 0x2b1b42,
  purple: 0xae7bc7,
  light: 0xddb5e9,
  yellow: 0xffcb38,
};
export type Icon =
  | "play"
  | "restart"
  | "home"
  | "settings"
  | "ranks"
  | "close"
  | "pause"
  | "music"
  | "sound"
  | "phone"
  | "crown"
  | "skull"
  | "bolt";
type G = Phaser.GameObjects.Graphics;
function polygon(
  g: G,
  points: number[],
  fill: number,
  stroke = ink.dark,
  width = 3,
) {
  const vertices = points.reduce<{ x: number; y: number }[]>((a, n, i) => {
    if (i % 2 === 0) a.push({ x: n, y: points[i + 1] });
    return a;
  }, []);
  g.fillStyle(fill).fillPoints(vertices, true);
  if (width) g.lineStyle(width, stroke).strokePoints(vertices, true);
}

export function marker(
  s: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size = 34,
  color = "#ffcb38",
) {
  return s.add
    .text(x, y, text, {
      fontFamily: '"Permanent Marker", Arial, sans-serif',
      fontSize: size,
      color,
    })
    .setOrigin(0.5)
    .setScrollFactor(0);
}

/** Small, scalable ink icons; never emoji or baked-in button labels. */
export function icon(
  s: Phaser.Scene,
  x: number,
  y: number,
  name: Icon,
  size = 36,
  color: number = ink.dark,
) {
  const g = s.add.graphics({ x, y }).setScrollFactor(0);
  g.setScale(size / 40)
    .fillStyle(color)
    .lineStyle(4, color);
  const line = (points: number[]) => {
    g.beginPath().moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2)
      g.lineTo(points[i], points[i + 1]);
    g.strokePath();
  };
  switch (name) {
    case "play":
      polygon(g, [-10, -17, 17, 0, -10, 17], color, color, 2);
      break;
    case "pause":
      g.fillRoundedRect(-12, -15, 8, 30, 1).fillRoundedRect(5, -15, 8, 30, 1);
      break;
    case "close":
      line([-12, -12, 12, 12]);
      line([12, -12, -12, 12]);
      break;
    case "home":
      polygon(
        g,
        [
          -18, -2, 0, -18, 18, -2, 11, -2, 11, 17, 3, 17, 3, 5, -4, 5, -4, 17,
          -12, 17, -12, -2,
        ],
        color,
        color,
        0,
      );
      break;
    case "restart":
      g.beginPath().arc(0, 0, 14, 0.4, 5.5, false).strokePath();
      polygon(g, [9, -18, 18, -7, 4, -8], color, color, 0);
      break;
    case "ranks":
      g.fillRect(-18, 0, 9, 17)
        .fillRect(-4, -15, 9, 32)
        .fillRect(10, -7, 9, 24);
      break;
    case "settings": {
      const teeth: number[] = [];
      for (let i = 0; i < 32; i++) {
        const a = (i * Math.PI) / 16;
        const r = i % 4 < 2 ? 19 : 15;
        teeth.push(Math.cos(a) * r, Math.sin(a) * r);
      }
      polygon(g, teeth, color, color, 1);
      g.fillStyle(ink.panel).fillCircle(0, 0, 8);
      break;
    }
    case "music":
      line([-7, 8, -7, -13, 12, -17, 12, 6]);
      g.fillCircle(-12, 10, 7).fillCircle(7, 8, 7);
      break;
    case "sound":
      polygon(
        g,
        [-17, -7, -9, -7, 2, -16, 2, 16, -9, 7, -17, 7],
        color,
        color,
        0,
      );
      g.beginPath().arc(4, 0, 11, -1.1, 1.1).strokePath();
      g.beginPath().arc(4, 0, 19, -1.0, 1.0).strokePath();
      break;
    case "phone":
      g.strokeRoundedRect(-10, -18, 20, 36, 3).fillCircle(0, 12, 1.5);
      line([-16, -9, -16, 9]);
      line([16, -9, 16, 9]);
      break;
    case "bolt":
      polygon(
        g,
        [3, -22, -18, 4, -3, 3, -9, 22, 18, -7, 2, -5],
        color,
        ink.dark,
        1,
      );
      break;
    case "crown":
      line([
        -20, -12, -12, 10, 13, 10, 21, -14, 4, -2, -2, -21, -8, -2, -20, -12,
      ]);
      line([-12, 16, 13, 16]);
      g.fillCircle(-20, -14, 3).fillCircle(-2, -23, 3).fillCircle(21, -16, 3);
      break;
    case "skull":
      g.strokeCircle(0, -3, 15);
      line([-10, 9, -10, 18, 10, 18, 10, 9]);
      line([-8, -8, -2, -2]);
      line([-2, -8, -8, -2]);
      line([3, -8, 9, -2]);
      line([9, -8, 3, -2]);
      line([-4, 11, -4, 17]);
      line([4, 11, 4, 17]);
      break;
  }
  return g;
}

/** A deterministic brush stroke, with ragged ends and a little paint drip. */
export function paint(
  s: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number = ink.purple,
  angle = -2,
) {
  const g = s.add.graphics({ x, y }).setScrollFactor(0).setAngle(angle);
  polygon(
    g,
    [
      -w / 2 + 12,
      -h / 2 + 4,
      -w / 2 + 45,
      -h / 2 - 3,
      w / 2 - 10,
      -h / 2,
      w / 2,
      -h / 2 + 8,
      w / 2 - 10,
      -h / 2 + 14,
      w / 2 + 5,
      0,
      w / 2 - 7,
      8,
      w / 2 - 1,
      h / 2 - 5,
      w / 2 - 48,
      h / 2 + 3,
      -w / 2,
      h / 2,
      -w / 2 + 9,
      h / 2 - 13,
      -w / 2 - 7,
      5,
      -w / 2 + 7,
      -2,
      -w / 2,
      -h / 2 + 15,
    ],
    color,
    ink.dark,
    2,
  );
  g.fillStyle(color)
    .fillRoundedRect(w / 2 - 33, h / 2 - 4, 5, 17, 2)
    .fillCircle(w / 2 - 31, h / 2 + 16, 3);
  return g;
}

export function panel(
  s: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const g = s.add.graphics({ x, y }).setScrollFactor(0);
  const l = -w / 2,
    r = w / 2,
    t = -h / 2,
    b = h / 2;
  polygon(
    g,
    [l + 14, t + 12, r + 7, t + 4, r + 15, b + 10, l + 3, b + 16],
    0x10091b,
    0x10091b,
    6,
  );
  polygon(
    g,
    [l + 8, t + 5, r - 9, t - 2, r + 2, b - 10, l - 3, b],
    ink.panel,
    ink.dark,
    7,
  );
  g.lineStyle(4, ink.purple).strokePoints(
    [
      { x: l + 15, y: t + 14 },
      { x: r - 18, y: t + 9 },
      { x: r - 8, y: b - 19 },
      { x: l + 7, y: b - 11 },
    ],
    true,
  );
  g.lineStyle(1, 0x855a9e)
    .lineBetween(l + 25, t + 20, r - 35, t + 14)
    .lineBetween(l + 15, b - 24, r - 20, b - 26);
  // Halftone ink in the corners, without obscuring text.
  for (let row = 0; row < 11; row++)
    for (let col = 0; col < 9; col++) {
      if (col + row > 13) continue;
      g.fillStyle(ink.purple, 0.1 + (row % 3) * 0.035).fillCircle(
        l + 18 + col * 6,
        b - 19 - row * 6,
        1.3,
      );
      g.fillCircle(r - 17 - col * 6, t + 19 + row * 6, 1.3);
    }
  for (const [tx, ty, a] of [
    [l + 12, t + 10, -37],
    [r - 11, t + 10, 42],
    [l + 10, b - 4, 38],
    [r - 15, b - 9, -37],
  ]) {
    const tape = s.add
      .graphics({ x: x + tx, y: y + ty })
      .setAngle(a)
      .setScrollFactor(0);
    polygon(
      tape,
      [-37, -10, 30, -12, 35, -7, 36, 9, -34, 11, -32, 5, -38, 0],
      0xc99adb,
      ink.dark,
      3,
    );
    tape.lineStyle(1, 0xf0d4f6, 0.5).lineBetween(-28, -6, 24, -6);
  }
  return g;
}

interface ButtonOptions {
  tone?: "primary" | "secondary";
  icon?: Icon;
  height?: number;
  fontSize?: number;
  name?: string;
  trigger?: "down" | "up";
}
export function graffitiButton(
  s: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  action: () => void,
  w = 400,
  options: ButtonOptions = {},
) {
  const h = options.height ?? 80,
    fill = options.tone === "primary" ? ink.yellow : ink.purple;
  const hitHeight = Math.max(h, 84);
  const c = s.add
    .container(x, y)
    .setSize(w, hitHeight)
    .setScrollFactor(0)
    .setName(`ui-${options.name ?? text.toLowerCase().replaceAll(" ", "-")}`);
  const g = s.add.graphics();
  const l = -w / 2,
    r = w / 2,
    t = -h / 2,
    b = h / 2;
  polygon(
    g,
    [l + 9, t + 11, r + 4, t + 4, r - 12, b + 10, l - 10, b + 14],
    0x10091d,
    0x10091d,
    4,
  );
  polygon(
    g,
    [
      l + 10,
      t + 1,
      r - 7,
      t - 3,
      r + 2,
      t + 9,
      r - 13,
      b - 1,
      l - 9,
      b + 3,
      l - 3,
      b - 9,
    ],
    fill,
    ink.dark,
    4,
  );
  g.lineStyle(2, 0xffffff, 0.35).lineBetween(l + 20, t + 6, r - 21, t + 2);
  g.lineStyle(3, ink.dark, 0.22).lineBetween(l - 2, b - 5, r - 20, b - 9);
  g.fillStyle(ink.purple, 0.8)
    .fillTriangle(l + 9, t + 4, l + 23, t + 3, l + 4, t + 16)
    .fillTriangle(r - 10, b - 4, r - 26, b - 3, r - 6, b - 17);
  c.add(g);
  const tx = marker(
    s,
    options.icon ? 18 : 0,
    -2,
    text,
    options.fontSize ?? 32,
    "#20142f",
  );
  c.add(tx);
  if (options.icon) c.add(icon(s, -w / 2 + 47, -2, options.icon, 34));
  c.setInteractive(
    new Phaser.Geom.Rectangle(0, 0, w, hitHeight),
    Phaser.Geom.Rectangle.Contains,
  );
  let pressed: number | undefined;
  const reset = () => {
    pressed = undefined;
    c.setScale(1);
    g.setAlpha(1);
  };
  c.on("pointerover", () => g.setAlpha(0.9));
  c.on("pointerout", reset).on("pointerupoutside", reset);
  c.on(
    "pointerdown",
    (
      p: Phaser.Input.Pointer,
      _x: number,
      _y: number,
      e: Phaser.Types.Input.EventData,
    ) => {
      e.stopPropagation();
      pressed = p.id;
      c.setScale(0.97);
      if (options.trigger === "down") action();
    },
  );
  c.on(
    "pointerup",
    (
      p: Phaser.Input.Pointer,
      _x: number,
      _y: number,
      e: Phaser.Types.Input.EventData,
    ) => {
      e.stopPropagation();
      const activate = pressed === p.id;
      reset();
      if (activate && options.trigger !== "down") action();
    },
  );
  return c;
}

export function iconButton(
  s: Phaser.Scene,
  x: number,
  y: number,
  name: Icon,
  action: () => void,
  size = 76,
  id = name,
) {
  const hitSize = Math.max(size, 90);
  const c = s.add
    .container(x, y)
    .setSize(hitSize, hitSize)
    .setScrollFactor(0)
    .setName(`ui-${id}`);
  const g = s.add.graphics();
  const r = size / 2;
  const points: number[] = [];
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    points.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  polygon(g, points, 0x704582, ink.dark, 5);
  g.lineStyle(2, ink.light).strokeCircle(0, 0, r - 8);
  c.add([g, icon(s, 0, 0, name, size * 0.48, ink.light)]);
  c.setInteractive(
    new Phaser.Geom.Rectangle(0, 0, hitSize, hitSize),
    Phaser.Geom.Rectangle.Contains,
  );
  let down = false;
  c.on(
    "pointerdown",
    (
      _p: Phaser.Input.Pointer,
      _x: number,
      _y: number,
      e: Phaser.Types.Input.EventData,
    ) => {
      e.stopPropagation();
      down = true;
      c.setScale(0.95);
    },
  );
  const reset = () => {
    down = false;
    c.setScale(1);
  };
  c.on("pointerout", reset).on("pointerupoutside", reset);
  c.on(
    "pointerup",
    (
      _p: Phaser.Input.Pointer,
      _x: number,
      _y: number,
      e: Phaser.Types.Input.EventData,
    ) => {
      e.stopPropagation();
      const active = down;
      reset();
      if (active) action();
    },
  );
  return c;
}

export function toggle(
  s: Phaser.Scene,
  x: number,
  y: number,
  on: boolean,
  action: () => void,
  name: string,
  disabled = false,
) {
  const c = s.add
    .container(x, y)
    .setSize(130, 90)
    .setScrollFactor(0)
    .setName(`ui-${name}`);
  const g = s.add.graphics();
  g.fillStyle(ink.dark).fillRoundedRect(-54, -23, 112, 52, 25);
  g.fillStyle(on ? ink.yellow : 0x66447b)
    .lineStyle(2, on ? 0xffe49c : 0xa77cc0)
    .fillRoundedRect(-55, -26, 110, 50, 25)
    .strokeRoundedRect(-55, -26, 110, 50, 25);
  g.fillStyle(0x241334, 0.3).fillCircle(on ? 29 : -29, 1, 21);
  g.fillStyle(on ? 0xfff6de : 0xb78bd0).fillCircle(on ? 28 : -29, -2, 21);
  c.add(g);
  if (disabled) c.setAlpha(0.45);
  else {
    c.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 130, 90),
      Phaser.Geom.Rectangle.Contains,
    );
    c.on(
      "pointerdown",
      (
        _p: Phaser.Input.Pointer,
        _x: number,
        _y: number,
        e: Phaser.Types.Input.EventData,
      ) => e.stopPropagation(),
    );
    c.on(
      "pointerup",
      (
        _p: Phaser.Input.Pointer,
        _x: number,
        _y: number,
        e: Phaser.Types.Input.EventData,
      ) => {
        e.stopPropagation();
        action();
      },
    );
  }
  return c;
}

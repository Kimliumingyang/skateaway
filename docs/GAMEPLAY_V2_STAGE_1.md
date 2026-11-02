# Gameplay v2 第一阶段：Trick + Combo

从 `feat/playable-skateaway` 的 `7558676` 创建 `feat/skateaway-gameplay-v2`。仅增加 Kickflip 和连击结算，不改动物理参数、建筑、背景、关卡生成或素材，不解压 Asset.zip。

## 操作与规则

- 自动滑行、点击 / Space 跳跃与二段跳保持原样。
- 空中按 J 或点击右下角 `TRICK · J`：执行一次 Kickflip，角色单帧图片轻微旋转约 0.4 秒。按钮不会同时触发跳跃。
- 每次腾空仅一次特技，二段跳不重置次数；地面、暂停、死亡时不会触发。
- 安全落地才入账：100 基础分 × 当前连续成功倍率，依次 100 / 200 / 300 / 400 / 500，最高 ×5。显示实际奖励和 Combo 提示。
- 没做特技就落地会中断连续倍率；空中按键没有即时得分。
- 撞击障碍、楼房立面或坠落：取消待结算特技，连击归零。此前安全落地获得的分数保留；同一步落地并撞击不会获得特技分。
- 重试清空本局特技分、连击、动画和提示。原有金币计分、高分保存与结算继续工作。

## 修改文件

- `src/game/systems/TrickCombo.ts`：独立的待结算特技与连击积分状态。
- `src/game/scenes/GameScene.ts`：键盘 / 触屏输入、按钮、提示、安全落地结算和死亡清理。
- `src/game/entities/Player.ts`：现有角色图片的轻微旋转。
- `tests/trick-combo.test.ts`：3 项新增规则测试。
- `tests/browser/trick.spec.ts`：桌面、手机横屏、手机竖屏的 3 项新增浏览器验收测试。
- 本文档。

## 验证

- `npm ci` 成功，依赖锁文件未变。
- `npm run check`：单元测试与 TypeScript / Vite 生产构建通过。
- `node --experimental-strip-types --test --test-isolation=none tests/*.test.ts`：13 项单元测试全部通过，包含原有物理与关卡布局回归。
- 浏览器测试：原有游戏流程 2 项与新增 Trick / Combo 流程 3 项通过。覆盖双跳与禁止第三跳、特技按钮不误触跳跃、最高 ×5、空落地断连、暂停继续、落地同时撞击、坠落取消奖励、重试归零，以及原有金币 / 设置 / 排行 / 死亡流程。新增测试使用可控步进及安全测试平台排除随机关卡影响，碰撞和计分走实际游戏代码。
- 另在正常自动更新的实际关卡连续完成两次跳跃 + J，实测特技积分 300、COMBO ×2、无死亡，并保存截图。
- `npm run build -- --base=./`：生成可移植试玩包。Vite 提示 Phaser 主包大于 500 kB，为非阻塞体积提示；本阶段不做打包重构。
- 浏览器为 Chromium 模拟视口；尚未在真实 iOS / Android 设备验证。

## 试玩

源码方式（需要 Node.js 24）：

```bash
git clone --branch feat/skateaway-gameplay-v2 https://github.com/Kimliumingyang/skateaway.git
cd skateaway
npm ci
npm run dev
```

浏览器打开终端显示的地址，通常为 `http://localhost:5173`。手机推荐横屏；同一局域网手机可访问开发机 IP 的 5173 端口。

静态试玩方式：执行 `npm run build -- --base=./`，再执行 `npm run preview`，打开终端显示的地址（通常为 `http://localhost:4173`）。也可以将 `dist/` 复制到静态服务器。请通过 HTTP 访问，勿直接双击 index.html。

本次未发布在线部署。现有 GitHub Pages 的 `main/preview/` 仍是旧版，不能用于验收本次 Trick + Combo。未开发 Grind、Fever、任务或新的金币系统，等待试玩反馈。

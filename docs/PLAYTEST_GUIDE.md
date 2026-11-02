# SkateAway — 浏览器走查指南

## 直接试玩

- GitHub Pages 预览（由 `main/preview/` 提供）：https://kimliumingyang.github.io/skateaway/preview/
- 源代码： https://github.com/Kimliumingyang/skateaway/tree/feat/playable-skateaway
- 开发 PR： https://github.com/Kimliumingyang/skateaway/pull/1

> 注意：`preview/` 是已编译的发布副本；修改功能分支的 `src/` **不会自动更新试玩网页**。需要先 `npm run build -- --base=./`，再将 `dist/` 发布到 `main/preview/`，并确认 GitHub Pages 部署成功。不要将未发布的源码修改称为已上线。

## 主要操作

- Space / 鼠标点击 / 触屏：起跳；空中再按一次二段跳；落地重置。
- P / Escape / 右上角暂停按钮：暂停。
- 游戏开始菜单可进入游戏 / 设置 / 本地排行榜。
- 死亡后可重新开始；高分、金币和音频开关保存在本机浏览器。
- 本版本是 **1334 × 750 横屏**。手机请横置。

## 一轮走查建议（3–5 分钟）

1. 进入网页，确认天空、远景城市、角色及 PLAY 按钮正常渲染。
2. 点击 PLAY，在第一栋楼测试跳跃与二段跳。空中第三次按键不能再跳。
3. 观察过楼间隙：速度增加时仍应有可到达的落地点，不应出现完全不可能的高差。
4. 检查金币：平路、障碍跳跃和跨楼跳跃有可理解的引导线，而不是整屏随机分布。
5. 故意撞向路障 / 香蕉皮或跌入楼缝，确认会结束本局并进入结算。
6. RETRY 后必须重置人物、积分、金币与地形；检查暂停、继续、返回菜单与设置开关。
7. 刷新后查看最佳分数是否保存；若使用无痕浏览，持久化可能不可用。

## 已知限制

- 在线全球排行榜、广告复活、CrazyGames SDK 尚未配置；现有排行是本地记录。
- 当前 GitHub 分支角色素材仍以单帧贴图加程序摆动为主；完整的滑行 / 一段跳 / 二段跳 / 摔倒状态图等待下一轮统一接入。
- 音乐、iOS Safari 触控与长时间关卡平衡仍需真机测试。
- ChatGPT 内置文件预览无法打开 HTML 不代表 GitHub Pages 一定坏了。优先在正常浏览器访问上述网页。

## 反馈模板

- 平台：Mac Chrome / Mac Safari / iPhone Safari / Android Chrome
- 画面：正常 / 黑屏 / 素材缺失 / 拉伸
- 操作：跳跃灵敏度、二跳时机、触屏按钮位置
- 关卡：哪栋楼或第几秒有无法跳过的空隙
- 收集：金币太密 / 太少 / 不符合跳跃线路
- 错误：截图、控制台报错（如有）

## 开发与检查

```bash
npm ci
npm run dev
npm run check
npm run build -- --base=./
npm run preview
```

`src/game/systems/LevelItems.ts` 是金币 / 危险障碍的**纯逻辑规划器**；`src/game/scenes/GameScene.ts` 专注加载与渲染。新增 `tests/level-items.test.ts` 检查安全性。PR 上的 `SkateAway checks` workflow 会运行测试和编译。

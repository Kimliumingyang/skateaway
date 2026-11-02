# 走查细节调整：楼房、人物与路线金币

后续用户确认保留画布、按参考图调整画面比例，人物现为 160px 高、金币间距 240px；下文 324px 记录为此前版本，当前配置见 [REFERENCE_PROPORTIONS.md](REFERENCE_PROPORTIONS.md)。

基于 Trick + Combo 分支 cde390e，开发分支 feat/skateaway-route-polish。

- 开局 1 号长桥 → 2 号中型平台，屋顶同高 y=440；随后 6 号高楼 y=380 → 7 号低楼 y=440，高低交替。楼间距继续通过现有跳跃可达性计算。
- 加载已有 building1.png，补充长桥屋顶测量。所有建筑图仍保持原始比例、底部对齐 y=700，不修改源素材。
- 人物图片保持比例，限制在约 324×324 的显示范围内（当前透明角色裁切帧实际显示约 225×324）；物理高度与金币收集范围同步调整，脚部落地宽度继续保持宽容。
- 金币中心间距 324 逻辑像素，沿统一世界坐标网格采样；地面路线金币位于角色中部，跨楼和绕障碍部分使用与跳跃相同的重力和初速度计算轨迹。每栋楼等下一栋生成后再规划金币，避免出楼时出现不相连的随机币串。开局前两栋不放置障碍。
- 加入轻微纵向镜头跟随，让放大后的人物双跳时保持在 HUD 下方；画布仍为 1334×750。
- 碰撞后重玩页面从 600ms 延后到 1200ms，临时倾倒人物保持可见。

## 摔倒动画已补充

后续聊天已收到 `摔倒.png.zip`，内含 23 帧透明 APNG（782ms）。现已接入真实撞击动画：撞楼或撞障碍后播放一次，最后一帧保持 400ms 再显示重玩页面。落入楼缝继续使用坠落效果。运行图集与帧时长见 `public/assets/crash.png` 和 `crash.json`，处理来源见 `docs/ASSET_MANIFEST.md`。原始上传保持不变，未处理项目原有 Asset.zip。

## 验证

- 14 项单元测试通过，覆盖 10,000 段地形可达性、单跳过楼、楼房顺序、金币全局间距、轨迹高度和现有 Combo 规则。
- TypeScript 检查、Vite 构建、相对路径静态构建通过；依然仅有 Phaser 包体积提示。
- Chromium 浏览器回归覆盖原有流程、Trick / Combo、桌面及手机横屏下人物尺寸、开局顺序、金币拾取、双跳镜头和撞楼后延时。
- 尚未进行真实 iOS / Android 设备测试。

源码修改：WorldConfig.ts、Player.ts、BootScene.ts、GameScene.ts、Physics.ts、LevelItems.ts。测试：physics.test.ts、level-items.test.ts、browser/route.spec.ts。未改动 UI 素材、源图片、Asset.zip 或依赖；未增加 Grind、Fever 或任务。

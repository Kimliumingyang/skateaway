# SkateAway 首个可玩版本开发报告（历史记录）

当前版本已按用户新方向改为横屏并接入提供的角色，最新变更与验证见 [横屏更新报告](LANDSCAPE_UPDATE.md)。

## 已实现

Phaser 3 + TypeScript + Vite 实际可玩游戏。自动前进、双跳、土狼时间、跳跃缓冲、独立碰撞盒、固定步长物理、不同宽高屋顶、间隙、四种障碍、金币、距离计分和金币加分。具备开始、暂停、恢复、设置、本地排行、结算、重试、返回菜单。最高分、金币银行、前十记录及音乐/音效开关保存至 LocalStorage；存储不可用时继续以会话内数据运行。

原画菜单、天空、远景、建筑、金币、障碍、按钮和弹窗已接入。背景分层视差；跳跃/落地反馈、收集粒子、死亡旋转及震屏。屋顶与物品对象复用，移除关闭场景时的输入和可见性监听器。画布按 750×1334 等比适配并留边。

## 素材审计

检查提取目录中的 44 张 PNG、3 首 MP3，并列出 Asset.zip 的 111 条记录，未重新解压、覆盖或删除原始文件。全部图片尺寸、透明度范围、RGBA 内存估算及运行时文件映射见 ASSET_MANIFEST.md。素材均为单帧图片，没有独立角色、角色动画帧或角色图集。游戏明确标注临时矢量滑手；菜单原画中的角色未被抠图冒充动画。

游戏使用 building1/2/3/7 四种平屋顶，其他建筑保留在素材清单/运行时目录而未加载。实际危险物为路障、纸箱、香蕉皮、小心路滑标志。原始金币图用于收集物。Cyan Kickflip 为背景音乐；其余音乐未启用，反馈音效由 Web Audio 合成。复活按钮带有静态广告标识，因此未使用，也没有伪广告或伪在线排行。

## 验证

- npm install：成功；package-lock.json 已生成。
- npm run build：TypeScript 检查与 Vite 生产构建通过。Phaser 带来大于 500 kB 的 chunk 提示，非构建失败。
- npm test：4 项通过，覆盖两段跳/第三跳限制/落地重置/输入缓冲、土狼时间与离台跳跃槽位、10,000 段平台间距与反应时间、快速下落与从平台下方穿过。
- npm run dev：成功启动 Vite。
- Chromium 浏览器：桌面 1200×900 和手机 390×844 两套流程通过；手机流程使用触摸 tap。检查启动、画布边界、设置保存、排行开关、首跳/二跳/第三跳拒绝、暂停冻结与恢复、真实物品碰撞收集、真实障碍碰撞死亡、结算、重试、无输入自然失败、返回菜单、刷新后保存读取；无 pageerror。
- 碰撞用例将真实物品实例置于玩家路径，以稳定覆盖碰撞分支；不等同于长时间人工玩法测试。自然失败用例未注入障碍。
- 截图人工检查：菜单、游戏与结算的桌面/手机布局。没有真机 Safari、声音听感、长时间稳定帧率或完整无尽路线通关结论。

## 主要变更文件

- package.json、package-lock.json、tsconfig.json、index.html、README.md、.gitignore、playwright.config.ts。
- src/main.ts、src/style.css、src/vite-env.d.ts。
- src/game/scenes/{BootScene,MenuScene,GameScene,OverlayScene}.ts。
- src/game/entities/Player.ts。
- src/game/systems/{Physics,SaveManager,AudioManager}.ts。
- src/game/ui/Controls.ts。
- scripts/assets.py、public/assets/*、docs/ASSET_MANIFEST.md、本报告。
- tests/physics.test.ts、tests/browser/game.spec.ts。

## 已知限制与下一次开发建议

角色美术为明确的临时占位；需要提供透明滑行、起跳、二跳、落地、死亡动画。部分建筑原画有栏杆与不规则轮廓，当前用额外霓虹平面标明可站表面；建议下一轮逐栋制作精确可站区与前后景切片。尚无金币复活、商店、广告或在线服务。

建议下一次优先替换角色动画、在真实 iOS/Android 上调手感与触控、试听音乐循环接缝、进行至少 15 分钟连续平衡测试，再扩充屋顶路线和金币消耗设计。

运行方式：npm install → npm run dev。生产包：npm run build → npm run preview。浏览器测试见 README。

## 交付与截图

PR：https://github.com/Kimliumingyang/skateaway/pull/1

分支：feat/playable-skateaway。尚未合并或部署公网。截图见 [游戏](screenshots/gameplay-mobile.png)、[菜单](screenshots/menu-desktop.png)、[结算](screenshots/gameover-desktop.png)。

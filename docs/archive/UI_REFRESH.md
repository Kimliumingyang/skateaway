> Historical session record. Its dimensions, rules, test counts and deployment status describe that session only. Current scope: [README](../../README.md) and [spec reconciliation](../GAMEPLAY_SPEC_RECONCILIATION.md).

# Graffiti UI + coin sound refresh

基于 feat/skateaway-1080-flow 的 dda1f7f，开发分支 feat/skateaway-graffiti-ui。沿用当前 1920×1080 逻辑画布、人物比例、关卡和玩法，只调整交互界面并增加原创金币音效。

## 视觉与交互

- 参考本轮四宫格设计：深紫贴纸面板、淡紫胶带边角、刷痕标题、黄色主按钮、紫色次按钮、皇冠 / 闪电涂鸦、手写字体。
- 主菜单沿用现有角色、天空、城市及长桥素材，统一 PLAY / SETTINGS / RANKS 按钮与实时最佳分、钱包。
- 暂停、设置、排行榜、结算改为统一的可缩放面板；暂停包括继续、重开、返回菜单和设置。结算显示真实分数、最佳分和金币，提供 RETRY 与返回菜单。
- 游戏 HUD、暂停及 TRICK 按钮统一风格；特技输入、次数、Combo 与摔倒动画不变。
- 所有文字与数值实时绘制，没有把参考图示例数字烘焙进 UI。按钮有按下反馈与取消处理；小控件的触摸区域大于可见图形。弹窗阻挡后方输入，设置返回暂停后仍保持游戏暂停。
- MUSIC / SFX 开关继续自动保存，新增参考图中的 VIBRATION：支持浏览器振动 API 的设备可以开启，切换和碰撞时反馈；不支持时显示 UNAVAILABLE 并禁用，不伪装硬件支持。旧存档兼容，默认振动关闭。
- 字体为本地 WOFF 子集，Permanent Marker 与 Kalam 的源地址、修改说明及许可随文件分发，无外部字体 CDN 请求。全部源图片与 Asset.zip 保留不变。

## 音频

用户上传 Cyan Kickflip.mp3 与现有 BGM 字节一致，已核验 SHA-256，继续使用该首 93.24 秒循环音乐，不重复生成资产。

新增原创金币音效 public/assets/sfx/coin.wav：260ms，44.1kHz 单声道 PCM，明亮上扬短音加轻微金属泛音，柔化起止避免爆音。scripts/generate-coin-sfx.py 可复现。音效首次用户操作后解码并缓存；受 SFX 开关控制，关闭时停止现有金币声音，35ms 最小触发间隔、最多 4 个同时播放，播放增益 0.22。加载失败保留原有合成提示音作为降级。

## 验证

15 项单元规则测试通过；10 个浏览器验收场景通过（手机开关状态断言改为等待 Phaser 处理触控后的存档结果，新增 UI 两项复跑通过）。覆盖原有完整流程、一分钟真实碰撞跑酷、桌面与手机横屏/竖屏 Trick / Combo、摔倒后重试，以及新增界面切换、字体、真实排行、旧存档开关兼容、暂停返回和实际金币音频播放 / 静音。

TypeScript / Vite 相对路径生产构建通过。另将 dist 挂载在 /preview/ 子路径，在 Chromium 实际检查主菜单、设置、暂停和结算，字体成功加载、无页面错误。仍只有既有 Phaser 包体积提示。尚未真机验证 iOS / Android 音频及振动能力。

源码修改：MenuScene、OverlayScene、GameScene 的 UI，Graffiti UI 组件，Controls 字体、main 字体就绪、style.css 字体资源，SaveManager 的振动偏好兼容和 AudioManager 金币音效。未更改 Physics、LevelItems、WorldConfig 或角色 / 摔倒图集。

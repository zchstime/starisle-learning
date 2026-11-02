# 初中群岛视觉升级 · 2026-11-01

沿用小学的明亮浮岛、奶油金色交互、星宝与立体童话美术，初中采用观测台、实验室、档案馆、工坊四座探索岛。首页为可交互地图，学科和学习方式仍可筛选；原有 17 条单元航线、68 个任务与账号存档保持兼容。

每个任务首次成功提交（程序核验或待复核作品）展示探索印记反馈。数量从已有任务提交记录推导，重复提交不累计奖励，印记不表示掌握率。任务页改为金色关卡导航与探索工作台；支持静音、键盘焦点与减少动态效果。

美术文件：`web/junior/assets/expedition-world.png`（新生成）；`web/junior/assets/guide.png`（复用小学原有星宝）。使用内置 image_gen，参考 `assets/resources/art/world-grade-3.png`，未使用 CLI。生成提示词如下：

> Use case: stylized-concept. Create a wide 16:9 playable educational adventure world background. Reference image is the existing primary school game art; match its bright turquoise water, pastel blue sky, creamy stone, gold details, lush mint foliage and premium soft 3D illustration exactly. New junior-school exploration archipelago: four distinct floating islands joined by curved bridges, at x18% y46% an astronomical observatory with brass telescope, x40% y60% a greenhouse science laboratory, x64% y43% a warm library with books and scrolls, x84% y60% an inventive workshop with small windmill. Spacious readable composition, island silhouettes separated by water, little waterfalls, soft clouds at edges. Upper 20% mostly sky for HUD, lower 15% water and clouds for controls. Inviting adventurous atmosphere, richer exploratory world but consistent with reference. No text, no labels, no UI, no characters, no photoreal architecture. This is an original production game background.

验收截图见 `qa/junior/game-map-desktop.png`、`game-map-mobile.png`、`game-lesson-desktop.png`。测试覆盖岛屿筛选、首次印记与重复提交、原有各类任务及存档恢复。

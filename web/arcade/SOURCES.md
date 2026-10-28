# 星屿游乐实验室 · 开源来源

引入日期：2026-10-28。所有运行资源均随 Web 构建发布，不从 CDN 在线加载。

| 来源 | 版本 / 许可 | 实际使用 |
| --- | --- | --- |
| [Matter.js](https://github.com/liabru/matter-js/tree/0.20.0) | 0.20.0 / MIT | 刚体、碰撞、约束、重力、固定步长模拟；vendor/matter.min.js |
| [官方 slingshot 示例](https://github.com/liabru/matter-js/blob/0.20.0/examples/slingshot.js) | 0.20.0 / MIT | 改编弹弓锚点、弹性约束、发射与补弹生命周期；原版保留于 vendor/slingshot.original.js |
| [Three.js](https://github.com/mrdoob/three.js/tree/r170) | r170 / MIT | WebGL 渲染、GLTFLoader、BufferGeometryUtils；loader 相对导入路径改为本地同目录 |
| [Kenney Starter Kit 3D Platformer](https://github.com/KenneyNL/Starter-Kit-3D-Platformer) | 资源 CC0；示例项目 MIT | character/cloud/grass/platform/coin.glb 与 Textures/colormap.png；未移植 Godot 引擎与控制器 |

许可证保留在 vendor/MATTER-LICENSE.txt、vendor/THREE-LICENSE.txt、assets/KENNEY-LICENSE.md。Kenney 的 README 明确区分代码 MIT 与模型 CC0，原文保留于 assets/KENNEY-README.md。精确资产 SHA256 与仓库树版本见 manifest.json。

课程适配层 app.js / rules.js 为本项目编写：能量组合、超量恢复、杠杆重量与力臂规则、触控和按钮操作、暂停、关卡与本机记录。不是整款现成教育游戏的原样嵌入。

## 查阅过的其他候选

- [smyrmnsr/slingshot-game](https://github.com/smyrmnsr/slingshot-game)：Matter.js 弹弓游戏；本次采用官方示例以减少额外素材与依赖。
- [Casmo/tower-defense](https://github.com/Casmo/tower-defense)：Three.js 塔防、MIT；可供后续布阵、波次、寻路玩法评估，本次未引入。
- [victorqribeiro/towerDefense](https://github.com/victorqribeiro/towerDefense)：原生 JavaScript 塔防、MIT；可用于后续“倍数防线”的基础，本次未引入。
- [Kenney Tower Defense Kit](https://kenney.nl/assets/tower-defense-kit)：CC0 塔防模型；适合后续塔防关卡，本次未打包。
- [Kenney Physics Assets](https://kenney.nl/assets/physics-assets)：CC0 2D 物理素材；本次选用实际 3D 模型。

没有使用《植物大战僵尸》《愤怒的小鸟》的角色、美术或代码。

## 花园视听升级（v2）

- 新增 `vendor/RoundedBoxGeometry.js`：Three.js r170 / MIT，与已有 THREE-LICENSE 一起分发。
- 新增 `assets/audio/{jump,land,coin,break,fall,walking}.ogg`：来自 Kenney Starter Kit 3D Platformer 的 sounds 目录，CC0。`audio.js` 根据弹射、碰撞、收集、放置、命中和移动事件播放；原素材未修改，播放时调整音量 / 速度。
- 新增 `vendor/tower-defense/targeting.js`：改编 Victor Ribeiro `towerDefense/js/Turret.js` 中的 `getEnemy()` / `distance()`。MIT，保留原文件与许可证；改为纯函数并加入课程条件过滤。来源：https://github.com/victorqribeiro/towerDefense 。只复用索敌逻辑，没有打包该项目其他来源不一的音乐和贴图。
- `defense.js`：本项目的三路倍数课程适配、波次、生命、拦截和重试；守卫与来客采用程序生成的简单 3D 网格。
- `audio.js` 的五声音阶背景配乐为本项目原创程序合成，暂停或静音时停止；不使用第三方歌曲。
- `assets/garden-backdrop-v2.png`：使用内置 imagegen 生成的新背景。不是 Kenney 资产，不标记为 CC0。提示词与生成方式记录于 `docs/arcade/art-direction-v2.md`。

## 幼儿园小岛（图片与动作试点）

- `kindergarten/assets/island.png`、`xingbao.glb` 复用本项目的浮岛背景和正式版星宝角色；不是新增第三方开源资产。
- 图片任务、SVG 玩具、示范手势及 9 个关卡为本项目适配开发；复用已引入的 MIT Matter.js 碰撞动效、MIT Three.js 角色展示及 CC0 Kenney 音效。没有宣称整套幼儿课程来自现成开源游戏。
- `kindergarten/assets/voice/*.mp3` 使用本项目现有语音服务生成，固定台词见 `voice-lines.json`，生成清单与 SHA-256 见语音目录 manifest.json。

## 全年级章节图形任务

`chapters/` 复用上述星宝模型、浮岛背景、Three.js、Kenney 音效及本项目 SVG 玩具；新增数学图形为原创 SVG，部分科学物品为系统彩色字形。配对、分类、排序、分物、方格拼图与课程适配为本项目实现，不宣称为第三方完整开源游戏。星宝语音沿用本项目服务生成固定台词，文件清单见该目录。

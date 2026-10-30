# 星宝探索服 v5：外观与游戏颜色校准

依据 `approved-concept.png`，保持奶油白肤色、粉色腮红、蓝色星空眼、浅蓝/象牙白探索服和金色星章。当前游戏资源是 `assets/resources/characters/xingbao.glb`，原资源 UUID 不变。

## 本版内容

头部增加连续脸颊体积；调整眼白比例、笑口与舌头；裤腿和躯干改成连续服装轮廓；重做圆角胸章、双片领口、腰带与圆润手指。保留骨骼动画和八种表情形变。

颜色修复：COMBINED 烘焙改用浮点缓冲，在场景线性空间应用曝光后才编码 PNG，避免先截断亮部、再降曝光造成整片灰肤色。游戏贴图最终导出为 8 位 sRGB；`xingbao-portrait.effect` 直接保留已烘焙的显示颜色，避免游戏 HDR 色调映射再次改变配色。双面渲染与原 GLB 材质保持一致。服装闭合网格在烘焙前统一朝外法线，修正胸章及领口的异常黑边。

## 文件与重建

- `xingbao-space-v5.blend` / `.glb`：材质、造型及表情源文件。
- `xingbao-game-v5.blend` / `.glb`：游戏烘焙版本。
- `game-shaded-0.png` 至 `game-shaded-2.png`：保留精度的中间贴图；`*-srgb.png`：最终游戏贴图。
- `validation.json`：源模型结构验证；`validation-game.json`：游戏 GLB 结构验证。
- `../../previews/xingbao-space-v5/`：真实源模型渲染、游戏截图及颜色修复对照。

重建顺序：`tools/model-xingbao-space-v5.py`（需要重建造型时）、`tools/bake-xingbao-game-v5.py`、`tools/finish-xingbao-game-v5.py`、`python3 tools/prepare-xingbao-game.py`、`npm run build:web`。前三个脚本使用 Blender 后台 Python。`XB_BAKE_OUTFIT_ONLY=1` 仅用于已有同版、同 UV 的头部/脸部缓存且只修服装时；完整重建应省略。

最新建模脚本包含领片与胸章侧面的绕序修正；当前游戏版本也在烘焙阶段统一了服装法线。

## 验收边界

游戏截图是实际加载网格、动画、贴图与材质后的结果，放大截图仅用于检查；正式布局保持原尺寸。仍使用静态棚灯烘焙明暗，旋转时光照不会实时变化。模型仍为高精度网格，移动端减面未处理。参考图与现有模型还有造型差异，结构检查与颜色修复不代表已经一比一还原。

## 自动动作与音轨嘴型（2026-10-28）

游戏现已在 Idle / Wave / TalkGesture 间切换：待机轻微呼吸摆动、自然眨眼、间隔招手，语音中采用轻量交谈手势。脸部新增 `Mouth_Close`，与 `Talk_A`、`Talk_O` 混合；头部烘焙时隐藏脸部网格，避免静态张嘴阴影在闭嘴后残留。

Web 语音由 `SoundBank` 对实际解码 PCM 建立 10 ms 间隔的能量轨道，按 AudioContext 的设备输出时钟驱动嘴型；低频能量比例只作为圆口趋势提示。背景音乐、音效和题目听力不驱动星宝嘴型。停止、静音、换语音、隐藏页面和销毁播放器会清理帧循环。Guardian3D 在每帧动画求值后更新脸部权重，保留眨眼；超时无音轨帧会自动收口。

这是按音轨发声、停顿同步的三类卡通嘴型，不是强制对齐后的逐音素视素识别。当前验证目标是 Web；原生 Cocos AudioSource 回退未接入 PCM 嘴型轨道。

重建游戏模型时，在 bake 与 finish 两步之间运行 `tools/add-xingbao-speech-morphs.py`。`XB_BAKE_HEAD_ONLY=1` 可在同版、同 UV 缓存完整时仅重烘焙头部。完整重建省略所有局部烘焙环境变量。

验证：`node tools/test-speech-motion.cjs`、`node tools/test-companion.cjs`、`python3 tools/validate-xingbao-space-v5.py assets/resources/characters/xingbao.glb`，以及浏览器真实播放/中断/静音/自动挥手检查。游戏现有 12 段动画和含闭嘴在内的 9 个脸部目标。

演示：`../../previews/xingbao-space-v5/speech-demo.mp4`，7.4 秒实际游戏画面与同次播放的混音音轨；角色在 QA 中放大便于观察，正式页面尺寸未改动。

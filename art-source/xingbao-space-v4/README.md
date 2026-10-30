# 星宝探索服 v4：游戏外观修复

对照参考：`approved-concept.png`。

修复了合并脸部网格时多颜色通道造成嘴与舌头失色的问题；统一 FaceColor 通道。肤色改为暖乳白，腮红降低浓度，服装改为柔和浅蓝；增加头部厚度与脸颊体积，扩大笑口，恢复眼白并修复眼白遮挡虹膜；调整手套拇指、裤腿与躯干连接。

- `xingbao-space-v4.blend` / `.glb`：可编辑的材质与模型源文件。
- `xingbao-game-v4.blend` / `.glb`：以真实模型和棚灯烘焙后的游戏版本。仍然是带骨骼、可旋转且含表情形变的网格，不是图片替身。
- `game-shaded-*.png`：三张游戏明暗贴图，使用标准 glTF unlit 材质避免引擎色调与光照差异。

游戏继续使用 `assets/resources/characters/xingbao.glb` 和原 UUID。先运行 `tools/bake-xingbao-game-v4.py`，再运行 `tools/finish-xingbao-game-v4.py` 恢复干净的眼白与金色；`tools/prepare-xingbao-game.py` 从游戏版本生成资源，并按 Cocos unlit shader 的约定将 glTF 线性顶点颜色转换为 sRGB；`npm run build:web` 重新导入和构建。Guardian3D 默认缓慢招手，角色 RenderTexture 提升至 1024。

限制：烘焙阴影不会随游戏灯光实时变化；仍为高精度模型，移动端减面尚未处理。参考图与游戏实机仍可能存在造型、材质细节上的差异，不能将结构检查等同于一比一还原。

# 游戏接入

游戏资源：`assets/resources/characters/xingbao.glb`，来自本目录的精修 v3 模型。
运行 `python3 tools/prepare-xingbao-game.py` 可重新生成兼容 Cocos 3.8.8 的资源：保留 COLOR_0，移除引擎不支持的额外颜色通道及材质扩展，使用标准 PBR 材质。
保留原资源 UUID 和加载路径，并启用引擎 skeletal-animation 模块。旧游戏模型备份在 `art-source/xingbao-v3/game-before-space-swap.glb`。

当前为高精度模型（约 60 万三角面、28.5 MB），尚未做移动端减面。游戏原有浮动、点击与拖动旋转继续使用；表情与骨骼动作数据保留，尚未新增玩法事件绑定。

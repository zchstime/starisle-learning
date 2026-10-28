# 星宝 · 蓝白星航探索服 3D 初版

2026-10-28。以用户确认的 `approved-concept.png`（探索服 v7）作为本轮外观依据。此目录独立于旧披风版，供后续替换游戏时使用。

## 交付文件

- `xingbao-space-v1.blend`：可编辑 Blender 源文件，含真实立体网格、标准材质、骨骼、动作、摄影棚及打包的定稿参考图。
- `xingbao-space-v1.glb`：自包含 glTF 2.0 文件，嵌入眼睛纹理，带骨骼与 Idle / Wave / Celebrate 动作。
- `iris.png`：原创程序生成的蓝色虹膜贴图；GLB 内已嵌入。
- `validation.json`：结构、顶点、索引、蒙皮权重、动画通道验证结果，以实际统计为准。
- `roundtrip-check.json`：导出 GLB 回导 Blender 后的渲染和动作抽查记录。
- `../../previews/xingbao-space-v1/glb-hero.png`：回导 GLB 的实际三分之四渲染。
- 同目录 `glb-front.png`、`glb-side.png`、`glb-back.png`：实际几何多视角；`wave.png`、`celebrate.png`：动作抽帧。

## 已实现

独立闭合星形头部，弯曲星角、贴合曲面的眼睛与眼圈、眉毛、嘴部和顶点色腮红。奶油白与浅蓝制服、圆角胸章、肩部星标、腰侧蓝色插片、单侧工具仓和圆头靴。图案和配件均随模型转动，未使用整张概念图投射成假 3D。

模型以 Blender Z-up 制作，身高约 3 个单位，导出采用 glTF Y-up。角色在 Blender 面向 -Y，导出后面向 +Z，与现有 Cocos 肖像摄像机方向一致。脚底接近原点。

骨骼 Root / Spine / Head / Arm.L / Arm.R / Leg.L / Leg.R，共 7 根。每个主要分件绑定对应骨骼，动作属于基础审阅样例。工具仓随躯干固定，无布料模拟。衣服分色使用材质，眼睛使用嵌入纹理，腮红使用顶点色。

## 当前质量边界

这是能够旋转、导出、播放基础动作的真实 3D 初版，不是已经达到概念图同等精细度的最终生产资产。

- 头型与主配色已建立，但星角和下脸轮廓仍需与定稿逐项微调。
- 领口的褶皱、服装材质和眼睛星空层次尚未达到概念图的细腻程度。
- 未制作眨眼、口型、思考与笑眼的面部 blendshape；目前嘴型固定。
- 采用分件式骨骼绑定，手臂抬高时需继续检查肩袖衔接；没有手指和肘部独立骨骼。
- 12 个材质分区，约 6 万三角面；属于审阅/集成候选资源。正式移动端版本应根据实际设备帧耗决定是否进一步合并材质、制作贴图图集和 LOD。
- GLB 的回导渲染可验证导出保真，不等于已经通过 Cocos 游戏内或移动设备验证。

## 后续接入当前游戏

现有 `assets/scripts/adventure/Guardian3D.ts` 加载 `characters/xingbao/xingbao`，其源资源为 `assets/resources/characters/xingbao.glb`。使用正交相机和 RenderTexture 把真实 3D 模型渲染到 UI。

本次没有替换该资源或修改游戏行为。后续接入建议：

1. 先将此 GLB 作为独立候选资源导入 Cocos，检查导入后的蒙皮、顶点色、12 个材质和三个动作。
2. 使用现有肖像摄像机检查头顶、鞋底、工具仓是否完整入镜；新模型水平中心接近 0，应重新评估旧版 `model.setPosition(-.12,0,0)` 的偏移。
3. 当前 Guardian3D 只做整个 pose 的浮动和旋转，并不会自动播放新模型骨骼动作。需找到导入的 SkeletalAnimation 组件，显式接上待机、点击招手、通关庆祝；避免整模跳跃与骨骼庆祝重复叠加。
4. 在实际游戏光照下校准蓝白色、眼睛反光与腮红。Blender 摄影棚照明不随 GLB 导入。
5. 完成头像大小、旋转、快速切页、点击反馈以及目标设备性能验证，再替换正式加载路径。

## 重现

```sh
XB_RENDER=front,hero,side,back XB_RES=1100 XB_SAMPLES=32 blender -b --python tools/model-xingbao-space.py
python3 tools/validate-xingbao-space.py
blender -b --python tools/review-xingbao-space.py
```

不需要在线生成服务或外部纹理下载。Blender 原生源文件内保留打包参考图，游戏 GLB 不包含概念图。

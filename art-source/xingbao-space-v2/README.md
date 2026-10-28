# 星宝 · 星航探索服外观与表情精修 v2

2026-10-28，基于用户确认的探索服 v7。用户反馈 v1 与定稿差距大，本轮重新制作头脸、连续服装和表情，以真实模型渲染进行审阅。

## 文件

- `approved-concept.png`：本轮定稿依据。
- `xingbao-space-v2.blend`：可编辑 Blender 5.2 源文件；头部、面部控制、服装分别保留，包含打包参考图、贴图、摄影棚和骨骼/表情动作。
- `xingbao-space-v2.glb`：含骨骼、八个面部 morph target 与动画的自包含审阅模型。
- `sapphire-iris.png`：512 px 原创星空虹膜纹理。
- `uniform-color.png`：2048 px 蓝白服装基础色烘焙图，避免网格分面造成分色台阶。
- `validation.json`：GLB 顶点、索引、权重、动画、表情稀疏数据和 UV 检查。
- `roundtrip-check.json`：实际 GLB 回导后的多视角与表情渲染记录，含被检查文件 SHA-256。
- `../../previews/xingbao-space-v2/glb-hero.png`：实际导出模型的招手形象。
- `../../previews/xingbao-space-v2/expressions.jpg`：实际导出模型的表情对照。

## 外观改动

1. 从定稿正面追踪卷曲星角、左右侧角与下脸轮廓，重建具有侧面厚度和圆润脸颊的闭合曲面。
2. 按正面参考重新定位眼睛、眉毛、嘴和腮红；眼睛采用贴合头部的微凸透镜、细眼缘与星空虹膜，显式绑定 UV。
3. 将肩袖、躯干和短腿融合为连续网格，使用渐变骨骼权重改善抬手衔接；蓝白分区通过烘焙纹理表现。
4. 重建宽领口、圆角星章、贴身腰带、单侧工具仓、袖口与短靴。鞋头蓝色区域延伸到鞋底。
5. 调整主姿态的头部倾斜、抬手与迈步方向，使其更接近参考角色的活泼感。

## 面部控制

面部网格保留 `Basis` 和以下八个实际变形目标：

| 控制名 | 用途 |
|---|---|
| Blink_L / Blink_R | 左右眼独立眨眼；组合得到完整眨眼 |
| Happy | 弯曲笑眼、张嘴笑、眉毛抬起；头部另有微量脸颊抬升 |
| Think | 不对称眉毛、眼神偏移、小闭口 |
| Focus | 眉眼向内集中、略收窄眼睛和嘴 |
| Surprise | 眼睛与眉毛抬起，嘴变成较圆的张口 |
| Talk_A / Talk_O | 两种基础口型，供后续语音反馈使用 |

导出保留 `Idle`、`Wave`、`Celebrate` 骨骼动作与 `Blink`、`Happy`、`Think`、`Focus`、`Surprise`、`Talk_A`、`Talk_O` 面部动作。头部的 `Happy_cheek` 是独立微表情轨道，接入时应与 Happy 同步。面部可用 0–1 权重插值；这轮检查独立表情，不声称任意多个口型叠加都已测试。

## 验证方式

- 读取 GLB 二进制，检查三角形索引、有限数值、归一化蒙皮权重和骨骼引用。
- 对稀疏和非稀疏 morph accessor 检查数量和数值，检查八个目标和动画通道均存在。
- 检查嵌入图像、有效 UV 范围与外部依赖。
- 在 Blender 中重新导入最终 GLB，清除自动导入的动画影响，实际设置每个表情权重，渲染四视角、笑眼、思考、专注、眨眼、惊讶及 A/O 口型。
- 对照图来自实际几何渲染，不用生成图覆盖模型效果。

## 当前交付边界与后续接入

本轮是外观与表情审阅用高细节模型，网格约 60 万三角面，GLB 约 25 MB（以 validation.json 为准）。网格密度服务于当前外观精修，并非最终移动端预算。Blender 微表面噪声保留在源材质中，GLB 保留标准 PBR、基础色纹理和腮红顶点色；摄影棚照明不随模型导入。

当前游戏资源尚未替换。后续应从此源文件制作低密度网格、法线贴图和材质图集，在 Cocos 中验证 glTF 表情、顶点色、动画、肖像相机和性能，再替换 `assets/resources/characters/xingbao.glb`。当前 `Guardian3D.ts` 的整模浮动逻辑需要接入新骨骼动作；也需增加表情控制调用。

定稿里的不同视角和主姿态在细节上存在差异，因此这里采用统一的实际三维结构。轮廓、神态是否达到用户期望，仍以实际预览与定稿对照为准，不以三角面数或结构检查代替视觉验收。

## 重现

```sh
XB_VIEWS=front,hero,side,back,happy,think,focus,blink,surprise blender -b --python tools/model-xingbao-space-v2.py
python3 tools/validate-xingbao-space-v2.py
blender -b --python tools/review-xingbao-space-v2.py
```

在 Blender 的 `Face | eight expression controls` 对象上选择 Shape Keys 可调表情；骨骼在 `Xingbao_Rig`，源文件默认是中立姿态。

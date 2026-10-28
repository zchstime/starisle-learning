# 星宝 · 第三版模型精修

参照已确认的瘦脸形象继续制作，上一版保留在 `../xingbao-v2/`。所有角色预览均由 Blender 中的真实立体几何渲染，未用生成的角色图片替代模型效果。

## 本轮改动

- 重建头部实体曲面，依照定稿轮廓收细卷尖，保留倾斜脸型与完整侧面厚度。
- 将多层凸球眼睛改为贴合面部的浅弧面蓝色眼睛，增加细小星光；腮红直接融入头部颜色。
- 重做身体与手臂衔接，采用举灯、弯手握环、抬起一只脚的姿势。
- 重做披风与围巾，添加不对称飘动轮廓、翻边、圆角、金色缝边和表面星饰。
- 加入原创青绿提花纹理、细微织物凹凸、独立细绒曲线；细化提灯穹顶、金框、玻璃与发光星。
- 烘焙颜色和法线贴图，导出自包含 GLB，并检查导入后的实际渲染。

## 文件

- `xingbao-refined-v3.blend`：高细节可编辑源文件，含材质节点、打包的原创织物纹理、细绒、灯光和相机。
- `xingbao-review-v3.glb`：静态模型审阅版，包含烘焙贴图，无外部文件依赖。
- `xingbao-baked-review-v3.blend`：导出前的烘焙材质与简化几何工作文件。
- `textures/teal-brocade-albedo.png`：原创披风织物纹理。由内置 image_gen 工具生成，完整提示词在 `textures/GENERATION.md`。
- `textures/baked/`：实际用于 GLB 的颜色和法线贴图。
- `../../previews/xingbao-v3/`：正面、侧面、背面、斜侧面、主视图及 GLB 回导检查图。
- `validation.json`、`roundtrip-check.json`：结构与回导检查结果。

## 当前阶段与差距

这是进一步精修后的静态审阅模型。衣领的交叠褶皱、嘴部体积、绒感和概念图的高级光照仍有差距，不能视为逐像素还原。

尚未绑定骨骼、制作表情变形或动作。当前 GLB 约 31 万三角面，作为审阅和后续拓扑参考，不是最终移动端资源。细绒曲线只在高细节 Blender 源文件内；GLB 保留烘焙表面细节，但不包含 Blender 专用次表面散射、摄影棚灯光或细绒几何。

本轮没有替换游戏角色，没有修改现有章节、音效或玩家进度。

## 重现

在项目根目录运行：

```sh
blender --background --python tools/model-xingbao-v3.py
blender --background --python tools/export-xingbao-v3.py
python3 tools/validate-xingbao-glb.py
blender --background --python tools/reimport-xingbao-v3.py
```

模型制作脚本支持 `XB_VIEWS` 选择要渲染的视角；默认主视图、正面、侧面、背面。

## 本轮验证结果

GLB 文件结构、全部顶点数值和三角形索引检查通过；13 个网格、13 个材质、7 张嵌入贴图，无外部文件依赖。将最终 GLB 回导 Blender 后已渲染检查，眼睛、腮红、披风纹理和提灯均保留。回导图为 `../../previews/xingbao-v3/glb-reimport.png`。

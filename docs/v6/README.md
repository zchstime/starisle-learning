# 星宝 v3 游戏接入

2026-10-27：将 Blender 第三版模型接入现有 Cocos 小岛与关卡侧栏。

## 资源与实现

- 源模型：`art-source/xingbao-v3/xingbao-review-v3.glb`。
- 游戏资源：`assets/resources/characters/xingbao.glb`，经 Cocos 3.8.8 导入为原生 Prefab、Mesh、Material 与 Texture。
- 加载地址：`characters/xingbao/xingbao`。启动时预加载，所有页面共享同一份资源。
- `Guardian3D.ts` 将模型渲染到透明的 512 × 512 RenderTexture，保留现有小岛背景及 UI 布局。
- 互动：整体轻摇、点击跳跃、水平拖动转身。关闭页面时立即停用角色摄影棚，销毁时释放相机与动态纹理，避免反复切页留下重影。
- 模型加载失败时，使用原角色插画，游戏仍可进入。

## 验证

- TypeScript 编译检查通过。
- `npm test` 通过：原有领域测试及 288 个可玩关卡实例验证通过。
- Cocos Web Desktop 构建成功；日志见 `qa/build-xingbao-v3.log`。
- 浏览器实测：小岛、关卡侧栏、点击跳跃、拖动至背面及转回正面、六次提示切换、返回小岛。
- 页面稳定后只有一个启用的角色摄影棚；捕获的运行错误为空。
- 844 × 390 手机横屏模拟下，角色、主按钮与侧栏正常显示。
- QA 浏览器存档内容在测试前后保持一致；没有清空或迁移用户数据。
- 截图：`qa/v6-final-desktop.png`、`qa/v6-level.png`、`qa/v6-drag-back.png`、`qa/v6-mobile-landscape.png`。

## 当前边界

这次使用静态高细节模型（约 30.8 万三角面、23.2 MB GLB），还没有骨骼动画。手臂、表情、提灯与披风没有独立动作。游戏接入效果不包含 Blender 的细毛曲线与离线渲染灯光，材质观感会有差异。

短时桌面采样约 28–29 fps，关闭模型的对照采样未见明显改善；这不构成移动设备性能验收。正式移动端发布前仍需制作较轻的 LOD、压缩纹理并在真实设备上测试。

旧程序化角色代码保存在 `docs/v6/Guardian3D-before-swap.ts.txt`，Blender 高精度源文件保持不变。

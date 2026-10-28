# 花园美术与声音 v2

日期：2026-10-28。

## 最终背景文件

`web/arcade/assets/garden-backdrop-v2.png`，由内置 imagegen 工具生成，非 CLI/API fallback；复制到项目后由 Three.js TextureLoader 本地加载。保留原始生成文件，未覆盖旧图片。与 CC0 模型和音效的来源明确分开。

最终提示词：

> Use case: stylized-concept. Asset type: panoramic background plate for a polished children's 3D educational garden game, landscape 2.5:1. Dreamy mint green meadow floating island, rounded emerald and sage trees clustered ONLY at far left and far right edges, soft peach flowers at bottom edges, distant rolling teal hills and tiny cream fantasy windmill on far right horizon, warm pale butter-yellow sky with soft wispy white clouds. Cozy tactile clay diorama aesthetic, subtle painterly texture, soft ambient occlusion, gentle morning sunlight. Composition: broad mostly empty light mint grassy play area across the middle and bottom 70 percent, low horizon at upper third, unobstructed center for actual interactive game objects. Background only, NO characters, NO platforms, NO UI, NO letters, NO text, NO numbers, NO border, no watermark. Beautiful professional casual game art with restrained detail and excellent readability.

## 美术适配

- 薄荷绿 / 奶油黄界面，玩法卡片、数字标签、种子、反馈采用统一色彩。
- 新花园底图取代重复的方块云与几何山丘；保留可交互 3D 对象。
- RoundedBoxGeometry 柔化积木与木梁；接地阴影、角色轻微摆动、能量门呼吸动画。
- 弹道预览根据实际发射参数计算；命中、放置、成功时显示粒子。
- 新增 ×2 / ×3 / ×5 三路倍数防线，共三关。预览每路数字、布置守卫、主动开始波次；可在防守中换种子；漏过三位来客则重试。

## 声音

首次点击或键盘操作解锁浏览器 AudioContext；默认为开，尊重后续保存的静音偏好。弹射 jump，碰撞 / 放置 land，收集 coin，命中 break，未命中 fall，波次出发 walking，通关原创音阶。

配乐为原创程序合成的轻柔五声音阶；总声音、配乐开关、音量可调。静音 / 暂停 / 后台暂停停止正在播放的节点。无 CDN 和远程音乐依赖。

## 验证

- `node tools/test-arcade.cjs`：原数值/杠杆/弹道回归、资源校验。
- `node tools/test-arcade-v2.cjs`：筛选目标、三关 27 次拦截、错误布阵失守、结束冻结、重新开始。
- 浏览器音频：6 份采样成功 decode，AudioContext 为 running，操作增加播放计数；静音、暂停时活动节点为 0。未以程序计数冒充真实扬声器试听。
- 浏览器：塔防三关实玩、原弹弓和平衡过关回归、窄屏与返回流程。

# v1.2 浮岛首页（2026-10-27）
用户希望首页关卡采用参考图中的柔和立体浮岛、星球与轻量奶油色UI。此次替换数学/英语路线首页美术与布局，不改变内容目录、关卡ID、解锁条件、账号及真实存档。

## 视觉实现
- 原创四浮岛背景：小屋、星光广场、成长树、时空之门，天空云层和星光轨迹连接。
- 去掉整条白色顶部栏、大侧栏与地面数字路标。品牌、学科切换、进度和声音/勋章分散在天空区。
- 每座岛承载3站，保留每页12站；每站仍可独立点击，岛标签进入本组三站的首个未完成任务。
- 当前星章为金色，已完成为绿色勾，待开启为灰蓝色。六站阶段终点显示勋章。当前岛有呼吸提示。
- 统一下方“开始探索”，从其他分页也能直接前往下一未完成任务；角色和原有动效保留。
- 浮岛为预渲染2D美术，角色沿用现有模型；没有声称本次创建可旋转的3D岛屿。

## 美术
工具：内置 imagegen（非API/CLI）。
项目资产：assets/resources/art/journey-planets.png
保留源图：/Users/xiyue/.codex/generated_images/01a17a47-7836-7c62-b8f2-77f4e7095333/exec-f6262595-0748-4417-a7c3-78f44b3326ae.png
生成提示词：
Use case: stylized-concept. Create an ORIGINAL production background for a premium whimsical children's learning adventure game, landscape 16:9, soft polished 3D toy diorama, pastel blue sky, fluffy cream pink clouds, warm golden sunlight, dreamy depth, lovely highly detailed rounded materials like a high quality animated film. Four separate small spherical floating planetoids connected by delicate curved trails of tiny glowing stardust. Composition precisely for runtime game UI: planet 1 center x16% y53%, diameter26% image width, green grass cream spherical base, cute cream cottage with golden roof, flowers and wooden fence; planet2 center x40% y41%, diameter20%width, turquoise blue spherical base, white circular plaza with golden star fountain and small blue flags; planet3 center x65% y29%, diameter20%width, green spherical base with waterfalls and lush rounded magical tree with hanging stars; planet4 center x86% y48%, diameter20%width, lavender spherical base with magnificent cream and gold purple luminous portal. Keep all four islands clearly separated with ample blue sky between them, not touching. Leave top 14% sky empty for UI. Leave bottom 17% mostly soft clouds, empty for runtime buttons. Buildings and tree fit entirely inside middle image area. Perspective is 3/4 front isometric, more full round planets than flat discs. Small distant pastel planets and tiny stars in background. No characters anywhere, no text, no letters, no logos, no watermark, no numbers, no user interface or buttons. Rich soft sculpted detail, gentle saturated sky blue, green grass, butter yellow, white, lilac. This must feel like an inviting playable fantasy world, not a flat map or dashboard.

## 检查
- TypeScript检查和npm test通过；1368实例与原进度逻辑保持一致。
- Cocos构建记录 qa/build-v12-final.log。
- 浏览器内存存档：锁定岛点击后停留地图且不授奖；翻至第二页仍能通过开始按钮进入第1待完成站；英语首阶段完成后成长树进入下一阶段，勋章1；无error，真实localStorage未改变。
- 本次没有改动教材内容，对齐范围沿用docs/v11。

- 最终桌面与960×540截图已检查：qa/v12-planets-final.png、qa/v12-planets-small.png；角色不遮挡当前岛提示。

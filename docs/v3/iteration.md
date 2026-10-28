# v0.3 全学科体验

用户要求先覆盖小学各学科，内容可以少，后续持续打磨。新增语文、科学、道德与法治、音乐、美术、体育与健康、劳动、信息科技、综合实践，加上已有数学和英语，共 11 个入口。音乐与美术分开展示，不声称各学校开课名称、起始年级都相同；低年级信息科技等是启蒙体验。

新增 9 个学科，每个提供低、中、高三个学段，每学段 3 个原创任务：共 81 个任务样例。相邻两个年级共享同一学段样例，分别存档；因此显示为 162 个年级任务实例。保留原有数学英语 126 个任务实例，总计 288 个实例、96 个游戏章节。不得把实例数说成 288 个独立内容或完整教材覆盖。

所有新增学科标注学段体验，不宣称人教版逐课对齐。任务覆盖词句排序、实验方案选择、共同生活情境、音乐听辨、色彩选择、合作规则、劳动步骤、机器人指令和调查过程。部分新任务目前采用情境选择或排序，是可玩的第一批样例；更深入的模拟操作仍需继续迭代。

Subjects.ts 统一学科 ID / 名称 / 美术元数据；StarterContent.ts 独立学段内容；存档验证按真实课程列表检查章节。原存档键和关卡 ID 保留。词卡与选项每局洗牌，但一局内重绘保持位置稳定；判定依据原始选项 ID，不依据屏幕位置。音乐有 6 段原创合成音频，中文提示使用本机 Tingting，英文保留 Samantha；完整清单在 voice-manifest.json。

参考用户给的星球与金色边框氛围，新创作 planet.png，未把参考图中的文字按钮直接当作界面。立体描边按钮和完成星光反馈已接入。

## 新美术提示词

Original premium children's learning adventure game world, wide 16:9 landscape illustration, polished soft 3D clay render. A magical little green planet floating above peach and lavender clouds, viewed three quarter from above, connected cream-and-gold stone pathways around a turquoise lagoon. Left a cozy open-book library with blue dome; center small round musical gazebo with golden star roof; right a pastel art studio and curious little observatory, garden plots and flowers around edges. Tiny floating stars, distant ringed planets, luminous morning light. Cream, gold, mint, soft coral and sky blue. Charming, tactile, rich details yet clear large landmarks and calm spaces for runtime UI, no text no letters no logo no UI no characters. Full bleed, planet centered slightly right with open sky upper left for game title. Inspired by whimsical floating learning worlds, wholly original.

## 后续优先级

1. 实际儿童试玩，观察任务理解、点击目标和阅读负担；不能用自动测试代替儿童可用性测试。
2. 将科学、劳动和美术的情境选择升级为更具体的动手操作，增加图形而不是更多说明文字。
3. 数学面积/体积操作、语文听读与音乐跟拍；分别设计更真实的学习反馈。
4. 课程卡超过四张前增加分页，保持首屏简单。完善教材版次、上下册和知识点映射。
5. 目前是本地 Web 原型。原生移动端、小游戏、账号云同步与正式考试尚未验收。

已创建本聊天每 4 小时运行的持续迭代任务（automation-5）；每轮小步改进并验证，避免未经测试的大量堆叠内容。

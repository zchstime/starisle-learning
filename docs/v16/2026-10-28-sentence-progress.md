# 2026-10-28 05:06 英语组句进度

英语组句补上已放卡片数量和逐格点亮进度，复用其他组句玩法的显示。所有组句空状态加入“点下面的卡片，从这里开始排列”，放入后消失、全部撤回后恢复。不增加必经操作，不改变词卡顺序判定。

验证：类型检查、npm test、Cocos Web 构建通过（qa/test-sentence-progress.log、qa/build-sentence-progress.log）。Ego任务28，三年级英语既有原创自我介绍任务：实际点击 My 显示1/4，点击信封中 My 撤回到0并恢复起步提示；实际排列 My name is Star 显示4/4，点击发射正常结算100积分。音频 running、reward 非零峰值、无错误；localStorage前后相同。截图 qa/sentence-progress-empty.png、qa/sentence-progress-full.png。会话结束。

这是既有三年级自我介绍情境的交互改进，不新增教材覆盖声明。未外网部署，未做人耳听感或原生设备测试。下一步可检查组句完成时的说明是否应切换为检查顺序与提交提示。

# 2026-10-28 02:36 未完成答案的轻提示

修复尚未选择答案或填写数字时点击“发射”也增加答错次数的问题。
- 数字为空、只有负号或以小数点结尾时提示填写完整数字；选择/听力尚未选择、组句尚未放卡片时提示先操作。
- 提示只更新原有反馈行，不重绘工作区、不清空输入、不增加尝试次数、不播放错误音效。零、负数、完整小数仍正常进入判题。
- 已选择但错误的答案继续原有纠错流程；计分与存档格式不变。

验证：TypeScript 检查、npm test、战斗结算回归通过。新增 pendingGuide 边界检查通过（qa/test-pending-guide.log）。Cocos 首次沙箱启动 Abort trap，允许启动桌面引擎后重建成功（qa/build-pending-answer.log）。

浏览器任务 23，内存进度，实际点击一年级数学“点心配送”关卡：
1. 空答案点击发射：attempts=0，points=0，Puzzle 对象不变，显示轻提示。截图 qa/pending-answer.png。
2. 点数字 0 再发射：attempts=1，points=0，正常纠错，audio/oops。
3. 清空后点 5，再发射：战斗结算到 reward，attempts=2，points=100；audio/reward，AudioContext running，非零峰值，无音频错误。
4. localStorage 与测试前一致，未修改用户存档；测试会话已关闭。

限制：浏览器实测数字流程，其他空选择由纯逻辑检查覆盖。未做人耳听感或原生端验收，未发布。下一轮可改善符石尚未放入阵心时的专用提示，保持答题界面简洁。

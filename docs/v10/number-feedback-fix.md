# 数字答题修改后的提示恢复 · 2026-10-27

本轮先阅读 docs/v3/iteration.md、docs/v3/motion-audio.md 和 v10 最近验收记录。

## 问题与修复

数字题答错后，修改数字只更新输入框及内部 message，底部 Label 仍停留在旧错误文字。现在在答案实际发生变化时同步恢复底部引导文字及青绿色；仅更新已有 Label，不重绘题目或星宝。忽略的按键（例如重复小数点）不视为修改，不清除仍有效的提示。clear() 释放反馈 Label 引用，避免跨界面持有旧节点。

修改仅涉及 Adventure.ts 的反馈展示与输入回调。没有增加关卡或改变答案、奖励、尝试次数、教材映射、账号及存档格式。适用所有使用 number 机制的数学任务（一至六年级），教材对齐范围沿用 v10。

## 验证

- TypeScript noEmit 通过。
- npm test 通过：936个任务与既有进度、勋章、账号、短信适配器模拟检查。
- Cocos 3.8.8 Web 构建成功，qa/build-number-feedback.log；官方启动插屏仍关闭。
- 独立浏览器实际点击二年级钟面任务 math.g2.c13.l1：输入1并提交→错误反馈、attempts=1、done=0；点击清空→即时恢复引导及颜色238e90，仍是同一反馈 Label、同一 Puzzle，原 Guardian 节点有效；点击0提交→正常结算。
- 编辑不会清除既有错误次数，也不会提前发奖励。
- 测试采用内存存档，原 starisle.adventure.v3 字符串保持相同；捕获应用 error 为空。未发送短信。
- 截图 qa/feedback-error.png、qa/feedback-edited.png。浏览器任务正常结束。

下一步：继续观察实际试玩问题，再增加更具体的几何动手操作；本轮不扩大内容范围。

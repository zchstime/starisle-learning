# 复习与升级反馈 · 01:06轮次

修复复习已完成任务时仍展示首次奖励的问题，改为「复习挑战 · 不重复加分」。答题侧栏显示距离下一级还差几个新任务；结算页新增经验条和数值（每级180经验）。完整讲解区域保留，题目、计分及存档格式不变。

TypeScript、npm test、Cocos构建通过。日志qa/test-growth-feedback.log、qa/build-growth-feedback.log。浏览器隔离内存进度预置一题完成，实际点选答案放入阵心并提交：100分/30经验不变，显示复习不重复发放和30/180、还差5题。localStorage未变化，audio/reward播放调用已记录。非前台动画等待再次超时，切回前台后正常结算；没有录音验证声音。截图qa/growth-review.png、qa/growth-review-reward.png。未上线。

下一步优先改善后台切换后结算恢复。未新增教材内容。

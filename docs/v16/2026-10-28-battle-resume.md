# 战斗结算恢复 · 01:36轮次

修复前几轮动画暂停时结算等待：正常动画仍1.1秒；增加1.5秒实际时间兜底与返回可见页面的截止时间检查。共享一次性完成门闩，奖励逻辑不会重复执行；clear清理计时器和visibility监听器；后台兜底不主动播放奖励音。计分仍在答对时一次记录。

验证：TypeScript、npm test、Cocos Web构建通过（qa/test-battle-resume.log、qa/build-battle-resume.log）。浏览器实际点选正确符石与发射，奖励一次、积分100，timer和listener都已清理；模拟程序导航离开答题后等待1.8秒，仍在地图、无旧奖励弹出；localStorage未变。qa/background-reward.png为结算截图。

重要验证范围：本次测试浏览器虽然切换标签，document.hidden仍为false，因此不把截图当作真实后台证据。另以tools/test-battle-settlement.cjs抽取实际submit方法，故意不执行任何动画回调，实际计时器仍只结算一次（qa/test-battle-settlement.log）。该检查用UI/动画桩隔离逻辑，不是完整浏览器后台冻结模拟。操作系统完全挂起时计时器也会延迟，恢复页面可见后再检查截止时间。

未改用户存档、题库或服务器。下一步在支持真实visibility变化的环境补充后台恢复验收；可继续改进不同学科伙伴的美术反馈。

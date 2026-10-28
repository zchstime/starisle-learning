# 2026-10-28 03:36 更换符石防误提交

修复已放入答案后拿起另一块符石、点击发射却判定旧答案的问题。Puzzle 增加仅当前题使用的 pendingRune 状态；拿起/拖动时暂缓提交，阵心提示“新符石待放入 · 点这里更换”；放入、拖放取消或重绘后清理待放入状态。不增加菜单，不改变存档结构、题库或奖励规则。

验证：类型检查、npm test、战斗结算回归通过；Cocos Web 构建通过。日志 qa/test-rune-replace.log、qa/build-rune-replace.log。
浏览器任务25，一年级“长短桥梁”，内存进度：实际先放入“短于河宽”，再拿起“长于河宽”点击发射，choice=0、pendingRune=1、attempts=0、points=0，显示确认放入提示。点击阵心后 choice=1、pendingRune=-1；发射正常进入奖励，100积分、attempts=1。音频 running、reward 非零峰值、无错误。localStorage 前后相同，测试会话关闭。截图 qa/rune-replace-pending.png。

限制：本轮实际验证两次点击更换方式；拖动取消路径保留清理逻辑，尚未补本轮实际拖动验收。未做人耳听感或原生端验证，未发布。下一步统一拿起新符石时的顶部标题状态（当前仍显示旧符石已就位），并补充拖出取消的试玩。

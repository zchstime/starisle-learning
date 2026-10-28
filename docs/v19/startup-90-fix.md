# 90%加载停留修复
2026-10-28
实际浏览器复现：90%未触发world-ready，Guardian3D.update持续抛出shadow未定义的opacity异常；刷新后曾恢复，属于初始化失败没有降级保护。声音预加载也位于90%后的必经等待。
修复：
- 音效预加载后台进行，不阻塞地图；进度96明确进入地图初始化。
- 3D setup抛错时隐藏销毁不完整角色节点，回退原画，保留点击交互。
- Guardian3D动画只有pose/shadow均初始化后运行，防止连续异常。
- 未清理存档、未修改角色模型资产、未重装软件。

验证：
tsc、地图布局/陪伴/试炼导航测试通过；新增test-guardian-fallback.cjs覆盖setup故障与成功。
真实Cocos构建通过：qa/build-startup-fix.log。
ego-browser空间50，本地7482演示游客：加载画面退出→首页→二年级数学第2关→填写10→提交→100积分/30经验奖励，实际截图qa/startup-fixed.png、startup-fixed-play.png、startup-fixed-answer.png。
7456本地服务正在监听并使用相同build/web-desktop产物，未部署外网。
本次未做完整66份期末试炼回归；前轮完整试炼UI验收仍保留待办。

# 个人中心：学习等级与头像 · 2026-10-28

## 已实现，待构建/画面验收

- 登录后个人中心显示现有 Progress 的成长等级、当前等级经验/180、升级所需新任务数、学习积分、已完成任务和勋章。直接读取游戏实例，不另造奖励算法，也不把学校年级当成成长等级。
- 六个内置头像：现有星宝原画、月亮兔、竹林熊猫、星际狐、云朵猫、小青龙。后五项使用系统彩色表情，具体绘制随设备字体变化；本轮没有头像上传或新美术生成。
- 地图左上角移除常驻的大号“星屿学园 / STAR ISLE”文字，改为紧凑头像 + 我的 Lv.入口；游客显示登录/我的。答题与试炼页隐藏悬浮入口，保留原有返回按钮。欢迎登录页仍保留品牌。
- 头像选择按账号隔离，保存键 starisle.profile.v1，结构为version/avatar/updatedAt。默认星宝，无需迁移旧存档，不修改题目和积分。
- 新键纳入已有云存档接口及客户端合并；同一账号多设备按updatedAt选择较新的头像。服务端只允许六个头像ID和指定字段，拒绝未知头像、附加积分等字段。
- 沿用用户现有MySQL云存档JSON，不需要新建表。离线沿用现有云同步状态提示，不能将未同步的头像宣称已在云端保存。

## 实现文件

web/auth/profile.js、auth.js、auth.css、cloud.js；server/saves.cjs；tools/prepare-web.cjs；Adventure.ts、JourneyMap.ts。profile.js随Web构建壳加载。没有直接改现有构建包，避免新壳叠加旧标题；没有修改用户模型和美术源文件。

## 检查结果

- node tools/test-profile.cjs：头像白名单、选择持久化、账号隔离、进度原样保留、畸形配置回退、服务端拒绝非法字段、头像时间戳合并通过。
- node tools/test-cloud.cjs：头像与学习进度一起通过HTTP处理器保存/读回（内存测试存储），鉴权、来源限制、冲突及既有进度合并检查通过；未声称连接真实MySQL完成验收。
- node tools/test-v2.cjs通过，日志qa/profile-progress-regression.log。
- JS语法检查与TypeScript noEmit通过。
- Cocos在受限权限下启动即Abort trap:6，退出134，日志qa/build-profile.log。ego-browser因macOS服务Connection invalid无法启动，未创建成功的验收会话，未做视觉/真实登录试玩。

## 恢复权限后的验收顺序

1. 先完成上一轮companion-dismiss-pending.md，再统一Cocos构建本轮代码。
2. 本地演示账号登录，打开个人入口，确认统计与地图/勋章页一致。
3. 选头像，返回地图、刷新、退出再登录仍保留；切换另一账号不串头像。
4. 完成一个新任务后重新打开个人中心，经验/积分同步增加；复习已完成任务不重复加分。
5. 验证窄屏横屏和个人中心滚动、键盘焦点、选择高亮、云保存状态。
6. 上线时前端与server/saves.cjs必须配套发布，旧服务器不接受新的头像存档键。本轮未部署、推送或Git提交。

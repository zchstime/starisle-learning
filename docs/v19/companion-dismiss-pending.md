# 星宝操作避让 · 待构建与试玩 · 2026-10-28

## 本轮改动（尚未验收完成）

开始点击游戏画面时，自动收起临时星宝气泡并停止其陪伴语音；事件不拦截、不阻止传播，原有题目点击继续执行。点击气泡内的提示、休息、音量控件保持可操作；Escape可收起，方向键和Enter不自动收起。取消首次外部点击触发延后欢迎语，防止用户开始操作后旧欢迎语又弹回来。

仅改动 Companion.ts、CompanionPolicy.ts 和对应测试。没有修改题库、积分、用户存档、模型或服务配置，没有调用语音生成服务。

## 已完成检查

- `node tools/test-companion.cjs` 通过：外部点击、内部按钮、Escape、音量方向键与Enter规则，以及原有节奏/配音清单检查。
- `node tools/test-sound-priority.cjs` 通过。
- TypeScript noEmit、git diff --check通过。

## 阻塞及续做

本轮环境由Full Access改为受限工作区。ego-browser启动报macOS服务Connection invalid，最后返回Failed to start ego lite；没有成功创建测试会话。Cocos CLI启动即Abort trap:6，退出134，日志 `qa/build-companion-dismiss.log`。未绕过权限限制，未修改构建脚本或覆盖现有构建产物；不能将本轮标为可试玩完成。

权限/应用启动恢复后优先续做，不叠加下一项功能：
1. 正常Cocos构建。
2. 浏览器验证气泡显示时点击题目数字：气泡收起且答案更新一次；语音停止，积分不变。
3. 验证提示按钮、音量拖动、键盘Enter不误关；Escape立即关闭，随后能主动再次呼唤。
4. 验证欢迎语不会在首次点击游戏后延后重现，记录截图，再完成本地版本提交。

本轮未提交Git、未推送或部署；用户美术改动保持原样。

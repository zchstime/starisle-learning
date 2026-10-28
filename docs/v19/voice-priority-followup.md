# 听题加载优先修复 · 2026-10-28 13:56

本轮续查星宝陪伴，修复一个慢加载时可复现的问题：题目朗读尚未开始播放时，`voicePlaying` 为 false，点击星宝会替换正在等待的朗读。现在声音状态同时报告 `voiceLoading`，陪伴在听题加载和播放期间均让位。

取消、静音、加载失败时清除等待标记；过期请求完成不能清除新请求的等待标记。没有修改题库、得分、账号、存档结构或用户正在修改的模型源文件。没有调用付费服务或外网部署。

## 验证

- 修改前浏览器控制缓冲延迟，调用既有“帮星宝把一句话排好”朗读，再实际点击“星宝陪你”：语音版本被替换，lastPlayed 变成 companion/hello，问题复现。
- 修改后相同流程：loading=true，playing=false；点击星宝后 interrupted=false，companion=false。释放延迟后题目 `voice/zh_3e21758c` 正常播放，AudioContext running，peak=0.5276，加载标记恢复false。
- 等待中静音、再释放音频：不播放，等待标记false；重新开启声音并实际点击星宝：hello正常播放，speaking动画标识true。
- 浏览器延迟通过仅当前测试页面的buffer包装模拟，结束已恢复；使用本地演示端口7482，不发短信、不改真实账号存档。证据 `qa/voice-priority-recovery.png`。
- `node tools/test-sound-priority.cjs`：取消、先后请求竞争、静音、失败清理均通过；`node tools/test-companion.cjs` 通过；TypeScript noEmit通过。
- Cocos构建退出0，`qa/build-voice-priority.log`。

## 下一步

当前被听题阻挡的陪伴请求直接忽略，不排队，避免题目结束后突然补播过时的话。后续可考虑在用户主动呼唤时显示简短的“先听完这一句”，但不新增打断性的提示。本轮没有扩展动态AI朗读或教材覆盖。

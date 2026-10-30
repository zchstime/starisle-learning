# 星宝多轮辅导与实时通话

2026-10-30。Web/H5 版本；原课程判题、积分和关卡进度仍由程序处理。

## 使用

登录游戏后点星宝或「问星宝」，也可以从 `/learn` 右下角打开「和星宝聊聊」。打开即可直接聊天，无首次确认弹层。

- 输入问题，星宝结合当前题目回答，可连续追问。已有星宝配音用于动态朗读，音频能量驱动原口型事件。
- 按住说话、松开识别，核对转写后发送。每段最多30秒，离开页面停止采集；不把原始录音写入本站存储。
- 实时通话通过火山 RTC 接入 ASR→豆包→TTS，包含字幕、自然语音打断、手动打断及挂断；每次最多5分钟。
- 最近12轮文字对话保存最多30天。学习记忆只取同账号已提交练习，显示记录来源，不把单次正确宣称为掌握。设置里可查看/关闭学习记忆、清空文字对话、关闭 AI 对话。
- 实时字幕仅在当前页面显示，不作为可靠学习证据入库。通话开始会带上当前题目、学习证据及最近文字对话；换题时结束当前通话，重拨读取新题。

## 配置与构建

`npm ci` 后执行 `npm run build:companion`；完整游戏执行 `npm run build:web`，该脚本也构建语音 SDK。然后重启 `npm run serve`。WebRTC、AudioWorklet 录音要求 HTTPS 或 localhost/127.0.0.1。

仅服务端读取 `local/cloud`；该目录不入 Git。配置权限应为0600：

```json
// ark.json：已有作业识别配置可复用
{"apiKey":"服务端方舟密钥","model":"doubao-seed-2-1-lite-260915"}
// speech.json：语音合成2.0
{"apiKey":"服务端语音密钥","speaker":"ICL_uranus_zh_female_keainvsheng_tob"}
// asr.json：需具有 volc.bigasr.auc_turbo 的访问权限
{"apiKey":"服务端语音识别密钥"}
// rtc.json：必须使用 AI音视频互动方案的应用，不能混用普通RTC应用
{"appId":"AI互动应用ID","appKey":"该应用的AppKey","accessKeyId":"服务端访问密钥ID","secretKey":"服务端访问密钥Secret","model":"doubao-seed-2-1-lite-260915","speaker":"ICL_uranus_zh_female_keainvsheng_tob"}
```

也支持 ARK_API_KEY/ARK_MODEL、SPEECH_API_KEY/SPEECH_SPEAKER、ASR_API_KEY，以及 RTC_APP_ID/RTC_APP_KEY/VOLCENGINE_ACCESS_KEY_ID/VOLCENGINE_SECRET_ACCESS_KEY/RTC_MODEL/RTC_SPEAKER 环境变量。配置整组环境变量时优先于对应JSON。不要把应用AppKey或访问密钥放入客户端。

RTC 服务端调用 `StartVoiceChat` / `StopVoiceChat` 的 `2025-06-01` 版本。默认使用方案内置模型资源，和直接调用方舟/语音服务独立计费。开通后的免费额度仅适用于默认AI应用，具体以控制台为准。访问密钥应仅授权所需RTC操作；不要使用前端永久Token。

`config` 只表示服务端配置存在，不证明云端模型/权限可用。未配置能力显示不可用；失败显示真实错误状态，不返回模拟回答。

## 代码边界

- `server/companion/context.cjs`：角色与辅导规则，当前题目、学习证据的提取。
- `server/companion/http.cjs`：鉴权、同源校验、限额、会话及实时通话生命周期。
- `server/companion/store.cjs`：MySQL或隔离本地SQLite。新增 companion_state / companion_usage，不改现有存档。
- `server/providers/ark-companion.cjs`、`volc-asr.cjs`、`volc-rtc.cjs`：模型与语音适配。
- `web/companion/app.js`：共享对话面板、录音、播放、取消操作和字幕。
- `web/companion/rtc.js`：官方SDK的事件、TLV消息与通话收尾，构建成自托管bundle。
- `Companion.ts`、`Adventure.ts`、`SoundBank.ts`：当前题目桥接、入口、静态台词避让及背景音乐压低。

游戏客户端发送的当前题目/操作是未验证的辅助描述，不能写入学习掌握记录。`/learn` 的 sessionId 在服务端按账号查找；学习历史来自服务端记录。模型没有判题、发奖或跳关权限。

## 时长与可靠性

单账号每日文字100次、录音60次、朗读120次、实时通话6次；按澳门时区自然日。清空聊天不恢复额度。请求大小、模型响应时间和并发数均有限制。

通话房间、真人与AI ID均由服务端生成。短期RTC Token只对该房间/用户有效；每15秒心跳、45秒租约、5分钟硬上限。关闭页面使用sendBeacon挂断，服务端每10秒清理过期租约；退出房间后云端IdleTimeout为30秒。挂断失败保留清理记录并重试，重启后继续清理。

目前使用单Node进程锁，和现有学习模块一致。多进程部署前需增加数据库分布式锁/任务租约所有权；不要直接横向启动多个实例。进程彻底停止期间应用层计时器不能运行，云端无真人超时负责兜底。

30天对话过期由读取过滤及服务端清理实现；服务停止期间不执行物理清理，重新启动后继续。不包含云厂商自身的服务日志保留周期。

## 验证记录

- `npm test`、`npm run test:learning`、`npm run test:admin`、已有陪伴台词及口型测试通过。
- 新增服务端测试：账号/消息隔离、同源校验、同意状态、当前题目归属、多轮历史、关闭记忆、录音格式、并发、额度持久化、通话幂等及挂断失败保留、租约/时长清理、记录过期。
- 新增DOM测试：模型文本安全渲染、等待状态、关闭后迟到响应、权限请求中松开录音、麦克风拒绝后的恢复。
- 新增协议测试：签名与官方SDK固定样例一致、RTC Token归属/过期、API版本/提示词/字幕/打断配置、TLV长度、销毁后的迟到事件隔离。
- 已真实验证方舟辅导回复、现有音色TTS及ASR识别链路。17:38 后网页补测 53−28 的借位解释及“是13减8吗”追问成功；追问首次发生一次连接失败，手动重试恢复，网络稳定性仍需观察。
- 已在控制台开通普通RTC及AI音视频互动方案、创建默认应用。已完成二次认证和私有配置；专用 IAM 用户 xingbao-voice-service 仅绑定 XingbaoVoiceChat 策略（rtc:StartVoiceChat、rtc:StopVoiceChat）。两个真实 OpenAPI 调用均成功；浏览器麦克风已授权。首次联调出现 UND_ERR_CONNECT_TIMEOUT；17:38 后复测网络恢复，真实 RTC 会话已收到双向字幕、远端音频能量（最大归一化音量1）和播报状态。手动打断请求成功，收到 Stage=4；挂断成功。另已验证失败会停止本地麦克风并保留云端清理重试。自然插话体验、不同设备及弱网长时间稳定性仍需后续体验测试。

## 官方资料

- https://github.com/volcengine/rtc-aigc-demo
- https://docs.volcengine.com/docs/real-time-communication/integrate-software-application?lang=zh
- https://docs.volcengine.com/docs/real-time-communication/configure-tts?lang=zh
- https://docs.volcengine.com/docs/doubao-voice/large-model-recording-file-lite-recognition-api?lang=zh

RTC Token编码基于官方示例并修正随机nonce，许可证保留在 server/providers/RTC-LICENSE。

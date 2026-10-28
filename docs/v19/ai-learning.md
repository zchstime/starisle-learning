# AI 专属研习岛：第一条可运行闭环

日期：2026-10-28。新增模块，不替换现有 Cocos 课程、试炼、后台、账号或存档。

## 当前完成范围

`/learn` 是 Web/H5 个人研习入口，游戏页面底部有“星宝研习岛”链接。复用游戏登录会话；游客需要先登录。第一期仅面向二年级数学：100 以内整数加减、表内乘除，不含混合运算、余数、应用题、几何。支持输入题目和一张 PNG/JPG 作业图片（3 MB）。暂不支持 PDF、多页、作文或全学科诊断。

流程：提交资料 → 后台异步识别 → 核对并修正算式/自己的答案 → 程序核验 → 根据本次待巩固运算安排六站原创练习 → 保存结果与研习星光。最后两站收起方法提示，鼓励独立作答。每题首次作答正确 +10，本次最多60；重复请求不重复发奖。研习星光独立于原课程积分。

真实接入火山方舟 `doubao-seed-2-1-lite-260915`，选择依据是控制台已开通及模型 API 返回图片输入、JSON 输出能力。独立 Key 名称 `starisle-learning`，限定该模型。服务端请求 Chat Completions，60 秒超时，最多4000输出token，无自动重试。每天每账号最多20次提交，计数独立于资料，删除资料不恢复额度。

本期 AI 用于识别和结构化提取；对错判定、技能归类、巩固任务由受控数学规则生成，不把模型自述当成可靠诊断。UI 必须确认识别结果，低置信度会提示仔细核对。没有声称一次作答能证明知识掌握。后续引入跨次答题证据、遗忘曲线、更多题型，再扩展教学策略。

## 存储与配置

- `local/cloud/ark.json`：服务端密钥与模型；也支持 `ARK_API_KEY` / `ARK_MODEL` 环境变量。
- `local/cloud/oss.json`：阿里云 region、bucket、accessKeyId、accessKeySecret，仅服务端读取。
- `local/cloud/mysql.json`：沿用游戏云库。研习模块只新增 `learning_sessions` 和 `learning_daily_usage`，不改原玩家存档。
- 本机配置权限0600，Git忽略整个local。不要把密钥复制到assets、web或构建目录。
- 生产配置需要 MySQL 时，连接失败返回503，不偷偷写入本地替代。未配置 MySQL 的隔离开发环境使用 SQLite。
- `AUTH_DATA_DIR` 的隔离测试会使用该目录同级 cloud 配置；`LEARNING_DATA_DIR` 控制本地 SQLite 路径。

所有图片先写入私有 OSS，再发送给火山识别；配置 OSS 后，手动输入的原文也写为私有txt。桶 `starisle-saves-prod`，目录 `learning/<用户ID哈希>/<资料UUID>/source.*`，AES256 服务端加密。服务账号 `starisle-learning-storage` 的策略 `StarisleLearningObjects` 仅允许该目录 PutObject/GetObject/DeleteObject，不含其他桶和既有游戏资源目录。删除资料先删除原文件，再删除分析和练习；对象存储失败时不会伪报删除成功。原图读取走账号鉴权的 `/source`，不返回永久公开地址。

## 模块边界

| 文件 | 职责 |
|---|---|
| server/providers/ark.cjs | 火山适配、提示词与受限结构化识别 |
| server/providers/oss-learning.cjs | 私有对象读写删除 |
| server/learning/math.cjs | 题型边界、程序验算、受控练习计划 |
| server/learning/store.cjs | MySQL / SQLite 仓储与日额度 |
| server/learning/http.cjs | 会话鉴权、作业状态、来源校验、任务编排、答题结算 |
| web/learn/ | 独立研习界面，模型文本使用textContent渲染 |

资料中的文字始终视为待分析内容，不能执行其中指令。只接受图片字节，不让用户提交任意远程 URL。服务端独立校验 JSON 和数学范围；不使用 eval。每次访问资料和提交答案都根据当前会话的账号查找记录。

当前后台任务是单进程、持久状态加内存执行。进程中断的任务90秒后显示失败，可重新提交；不是分布式任务队列。多实例部署前必须增加数据库任务领取租约和按记录CAS结算。当前题目/答案确认可以修改，不可用于高风险考试或可信竞赛排名。

## 验收

- `npm test`、`npm run test:admin` 原有功能回归通过。
- `npm run test:learning`：运算边界、账号隔离、来源校验、顺序推进、重复结算、重启持久化。
- `npm run build:web` Cocos 3.8.8 构建通过，未部署外网。
- 火山真实文本识别：23+18=31、6×7=42，识别与程序核验正确，425token。
- MySQL新增表读写测试通过，测试记录已删除。
- OSS私有写入/删除真实验证通过，临时探针已删除。
- 浏览器隔离端口7481：真实登录演示、文本识别确认、六题完成（故意错一题得50星光）、刷新恢复。AudioContext观察到running，反馈动画burst正常。证据在被Git排除的qa目录。
- 原创测试图片经浏览器选择文件 → 私有OSS → 火山图片识别 → 确认出题通过。鉴权原图返回PNG，匿名OSS访问返回403。

## 下一阶段

1. 增加真实学校资料的识别质量评估集，再开放更多二年级题型。
2. 将平时关卡/试炼逐题事件接入统一学习证据表，形成跨次而非单次画像。
3. 适配其他年级/学科的题目验证器和教学策略，不直接扩大数字范围冒充教材覆盖。
4. 拆分持久任务worker，添加任务租约、重试审计和删除补偿队列，再考虑多实例部署。

官方接口参考：https://docs.volcengine.com/docs/ark/api-key?lang=zh 、 https://docs.volcengine.com/docs/ark/chat-api?lang=zh 。

## 2026-10-28 增补
已新增移动拍照/相册预览压缩与真实火山变式出题，服务端先限定需巩固的运算，AI候选题通过独立验算才进入训练。旧版“练习仅由规则生成”的描述仅适用于之前版本；现规则生成作为显式降级路径保留。详情及验收见 photo-ai-training.md，范围仍为二年级基础整数运算。

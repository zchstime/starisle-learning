# 星光试炼：可复用游戏化测验

## 本轮可玩版本

地图右上角「期末试炼」进入。首套为二年级数学原创综合样卷：20题、每题5分、满分100分、30分钟。覆盖100以内加减、表内乘除、长度、时间、图形、数据比较及两步应用。参考人教版能力主题，但没有逐册逐单元审核，不属于官方试卷或完整期末覆盖。其他学科入口当前明确展示这套二年级数学样卷，不伪装已有各学科试卷。

考试与探索分开：考试过程中不反馈对错、不提供答案提示；支持跳题、改答、标记、清空、回看。排序题要排齐才计入已答。交卷确认列出空题与标记数；到时自动交卷。离开和刷新保存作答，倒计时依照截止时间继续，不因重进而延长。

游戏旅程分五个阶段，每完成四题点亮一个星塔标记；该标记代表作答完成度，不代表正确率。交卷给出成绩、勋章、奖励和逐题解析。动画短促，保留静音按钮，复用现有效果音和音乐偏好。

## 奖励规则

|分数|勋章|该卷累计奖励额度|
|---|---|---|
|0—59|勇气星章|40积分|
|60—79|青芽星章|100积分|
|80—89|银月星章|160积分|
|90—99|金翼星章|220积分|
|100|璀璨星冠|300积分|

鼓励完成，不扣已有积分。同一试卷重考仅按历史最佳档位补发差额，重复结算不发奖；奖励通过最佳成绩推导，避免累加计数重复。该积分为学习游戏奖励，不具备兑换现金功能。试炼勋章单独显示在试炼成绩中，尚未加入旧章节勋章手册。

## 扩展架构

- `assets/scripts/exam/Exam.ts`：版本化 ExamPaper/Question、判分、档位、结算、存档校验。新增试卷使用新id，保持已发布id和题意稳定。
- `ExamView.ts`：共用入口、三种作答组件、答题星图、倒计时、交卷、成绩及解析。新增学科复用界面；口语、作文、过程分等需扩展题型与人工/可靠评分，不能硬套选择题。
- `Progress.exams`：账号隔离的原存档结构内保存最佳/最近成绩和当前答卷；旧存档缺省为空。现有云同步payload兼容，合并采用最佳成绩取高、最近记录与答卷按时间选取。已增加合并回归测试。
- 当前一次保存一份答卷，尚未做多套同时进行的试卷列表。未来试卷增加后应增加列表、按paperId保存多个draft及试卷选择，不直接覆盖未完成卷。
- 当前为客户端学习测验，不是防作弊正式考试：答案存在客户端，计时依赖设备时钟，分数未由服务端校验。正式统考需服务端发卷/判卷/计时与考试权限。

## 美术

使用内置 imagegen 创作 `assets/resources/art/exam-sanctuary.png`，跨学科通用浮岛星塔场景；背景无题目与文字，UI独立叠加。原图保留在本机 generated_images。

背景最终提示词：Use case: stylized-concept. Asset type: reusable 16:9 background for a children's educational game examination adventure. Dreamy premium soft 3D clay rendered floating island, pastel turquoise sky and peach clouds, five small ivory and gold constellation towers around the far edge of an oval floating garden island, a beautiful glowing star portal at the far center. Emerald grass, small waterfalls, warm luminous gold details. Keep the central 65 percent visually quiet pale sky and smooth grass suitable for overlaying a large readable exam question card. Towers mostly along left and right edges. Wide landscape composition. No characters, no letters, no numbers, no UI, no watermark. Gentle inviting and polished, consistent with cute floating island learning game. This is a reusable subject-neutral trial sanctuary.

## 验收

类型检查、npm test（新增test-exam）、Cocos真实构建通过。日志：qa/test-exam-final.log、qa/build-exam-final.log。分数和奖励测试覆盖空卷、60分、100分、低分重考、重复提交、档位边界、旧存档兼容、云端合并。

独立7466临时账号服务及浏览器会话40验收，未操作正式账号或存档：点击地图入口和启程，使用实际Cocos按钮事件完成数字、选择、排序全部20题；全对100分/300积分；保存离开再进入保持答案、标记、截止时间；逐题解析可往返；重复结算积分不变；缩短测试截止时间验证自动交卷0分且最高100分/积分300保留。截图 qa/exam-lobby.png、exam-answer-final.png、exam-perfect-result.png、exam-timeout-result.png。尚未做手机真机、真实30分钟等待和上线数据库往返验证。

未发布线上，未上传本轮新美术到OSS。后续优先补充试卷选择与更多经过教材范围核对的试卷，再增加图形操作、连线和分步过程评分。

奖励美术：`assets/resources/art/exam-medal.png` 使用内置 imagegen 生成透明立体星章；共用造型配合档位名称和底色复用。提示词：Use case: stylized-concept. Asset type: reusable achievement medal sprite for a gentle floating-island children's learning game. Single ornate 3D cream ivory and warm gold star medallion, a luminous five-point rounded star jewel in the middle, two small mint enamel laurel branches and a short teal ribbon underneath. Soft sculpted clay-like premium game collectible with polished gold edges, warm soft studio light, symmetrical front view, isolated centered with generous padding. Transparent background. No text, no letters, no numbers, no watermark. One object only. Beautiful dimensional reward suitable for reuse across school subjects.

最终美术构建日志：qa/build-exam-art-final.log。奖励资产尚为各档位共用造型，后续可在不改判分逻辑的前提下增加独立造型。

最后重新加载实际构建，确认新勋章资源已加载、历史最高100分仍保留，截图 qa/exam-medal-final.png。浏览器会话40已结束，独立7466验收服务已停止，原7456服务保持运行。

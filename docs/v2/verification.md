# v0.2 验证记录 · 2026-10-27

- Cocos Creator 3.8.8 实际 web-desktop 构建通过；产物约 18 MB。最新日志 `qa/build-v2-release.log`。
- Cocos 自带 TypeScript `--noEmit` 通过。
- `npm test`：保留的 6 组经典数学领域测试通过；新 126 关逐关验证 ID、可解性、精确判定、操作边界、存档去重和损坏数据处理通过。
- 44 条英语 WAV 检查均存在有效 PCM 样本。浏览器实测 red 语音 AudioSource.playing=true，时长 0.365125 秒。
- 鼠标实际试玩：一年级装 5 颗星光（先错误提交，再装满成功）；二年级第二章 3 盆各 2 颗成功；六年级 25% 的 20 格花田成功；英语听颜色成功；三年级英语第一章三站完整通关，下一章按钮进入家庭明信片。
- 刷新验证：修复 Cocos 打包器对 Set 展开的兼容问题后，三年级英语第一章恢复 3/3，当前章节恢复第二章。已记录的页面错误列表为空。
- 844×390 手机横屏模拟截图无溢出；这不替代真机触控、性能与可读性验收。
- 截图：`qa/v2-library.png`、`qa/v2-garden-play.png`、`qa/v2-grade6.png`、`qa/v2-english-sentence.png`、`qa/v2-next-chapter.png`、`qa/v2-mobile.png`、`qa/v2-balloon-final.png`。

未验证：Android/iOS 原生包、小程序/小游戏运行时、全部 126 关逐个手工操作、教师教研逐题审定、最新全册教材覆盖。部分数学模板目前仍为配量表达，立体几何等后续需要更具体的场景操作。

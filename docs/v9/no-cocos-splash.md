# 关闭当前 Web 构建的 Cocos 启动画面

2026-10-27，针对现有 127.0.0.1:7456 试玩版本完成。

`tools/prepare-web.cjs` 构建后处理所有 `src/settings*.json`：设置 splashScreen.totalTime=0、logo.type=none、watermarkLocation=none，移除内嵌官方 Logo 图像。没有修改 Cocos 安装目录或引擎代码。

运行 `npm run build:web`（即 tools/build-web.sh）时自动执行，之后重新构建也会应用。直接从 Creator 构建面板单独构建时，需要再执行 `node tools/prepare-web.cjs`，否则编辑器生成的默认插屏仍可能恢复。本次只验证 Web；原生和小游戏包尚未应用。

验证：
- Cocos Creator 3.8.8 构建成功，qa/build-no-splash.log。
- 浏览器运行时读取 cc.settings，totalTime=0、logo={type:none}。
- 登录页正常；游客进入小岛 map，无捕获到的 error/unhandledrejection。
- qa/no-splash-map.png。

官方说明：https://docs.cocos.com/creator/3.8/manual/en/editor/project/ 。本机 3.8.8 引擎 cocos/game/splash-screen.ts 在 totalTime <= 0 时跳过插屏资源初始化。

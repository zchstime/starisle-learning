# Cocos 启动失败诊断
2026-10-28

系统报告：~/Library/Logs/DiagnosticReports/CocosCreator-2026-10-28-150411.ips
- Cocos Creator 3.8.8 / ARM64 / macOS 26.5。
- 进程启动约0.48秒后SIGABRT，退出134。
- 主线程调用链：ElectronMain → NSApplication sharedApplication/init → _NSInitializeAppContext → GetCurrentProcess → _RegisterApplication → abort。
- 尚未进入项目脚本编译阶段。项目日志仍停留13:56，不能作为本次构建成功证据。
- 当前执行环境为受限沙箱；系统日志读取明确返回 `log: Cannot run while sandboxed`。启动栈与环境共同高度指向桌面应用注册/沙箱访问限制；尚不能证明解除限制后无其他构建问题。

处理：构建脚本为134和其他失败增加明确提示，并继续保持失败立即退出、不进行Web后处理、不把旧构建冒充更新。
检查：bash -n tools/build-web.sh、tsc --noEmit 通过。

待用户调整执行权限后，重新运行 npm run build:web，再完成首页、个人中心、陪伴面板及期末试炼浏览器验收。没有删除缓存、改引擎或绕过沙箱；未更新构建、未发布。

## 补充：安装完整性检查
`codesign --verify --deep --strict --verbose=2` 和不带deep/strict的验证均报告 `invalid signature (code or signature have been modified), In architecture: arm64`。这是新增安装完整性异常线索，不能继续将原因单独归结为沙箱；也不能仅凭此断言损坏就是SIGABRT的直接原因。
最近10份报告的responsibleProc均为ChatGPT，崩溃栈相同，尚无独立手动从Dashboard启动的对照证据。建议用户先从Dashboard手动打开；若同样失败，通过官方Dashboard重新安装相同3.8.8编辑器，对照新安装的签名和手动启动结果，保留原工程不变。此轮未删除或重装应用。

## 完全访问生效后复验
2026-10-28 15:14 起：原安装直接完成Cocos构建，无需重装。签名验证具体报告新增engine-native及引擎缓存import-map文件，不能视为引擎二进制损坏证据。先前宽泛的签名错误受到受限环境影响，已更正。构建日志 qa/build-full-access.log。

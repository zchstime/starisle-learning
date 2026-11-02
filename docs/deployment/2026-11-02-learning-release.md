# 2026-11-02 新版发布

- 功能提交：`9163fca0048440e1cd8971e2ad69c9659c256f49`；私有仓库 `zchstime/starisle-learning` 的 `main` 已推送。
- 私有 Draft Release：`deploy-9163fca`，备份 `starisle-9163fca-release.tgz`，262822125 字节。
- 发布包 SHA-256：`06e491ccc05636ef53703e497f28cb354b7085dea64ff2736978e4533159513f`，服务器校验通过。
- 域名：<https://xy.laiyiju.com/>。
- 当前目录：`/www/wwwroot/starisle/releases/v2.3-learning-20261102-9163fca`。
- 上一目录：`/www/wwwroot/starisle/releases/v2.2-single-chat-20261030-221800`。

## 发布与数据保护

通过已登录宝塔上传到星屿专用目录。新目录先在本机 39422 端口预启动，确认登录接口和初中页面可访问后，再原子切换 `current` 并仅重启 `starisle.service`。切换命令带失败回滚。

继承 `local/auth`、`cloud`、`admin`、`learning`、`companion` 指向原有 shared 目录的链接；新增 `local/junior` 指向 `shared/junior`，所有者 starisle、目录权限 700。未覆盖账号、存档、密钥或管理端已发布内容。

仅修改星屿 Nginx 配置，新增 `/junior/*.mjs` 的 JavaScript MIME 类型。备份在 `/www/wwwroot/starisle/xy-nginx-before-9163fca.conf`；`nginx -t` 通过后平滑 reload。其他站点配置、目录和应用服务未修改。

## 验证

- `npm test`、初中、幼儿园、星宝、内容管理及课程分布审计通过。
- Cocos Creator 3.8.8 Web Desktop 重建成功，prepare-web 和 RTC bundle 完成。
- 2916 项关卡实例、576 项作业跟进任务的逻辑测试通过。
- 线上主站、登录配置、幼儿园、初中页面、初中 catalog 接口为 200；初中模块返回 `application/javascript`。
- 浏览器实测：加载完成、学段选择、小学地图、数学输入 `10` 后获得正确反馈；初中正负零数卡全部归档并通过过程核验、生成本机探索记录。
- 同机 `app.laiyiju.com`、`datamig.app.laiyiju.com`、`joywork.laiyiju.com`、`ht.laiyiju.com` 均为 HTTP 200。
- 截图见 `2026-11-02-evidence/`。本轮使用游客进行线上试玩，未发送真实短信、未替用户修改登录账号学习记录，未重新做真人麦克风双向对话测试。

## 内容范围

初中当前为 21 单元、84 项原创主题样例，尚未逐课覆盖特定教材；小学核心课程审计通过，历史拓展库仍有 113 组重复告警。开放表达为练习过程记录，不等同自动作文评分。详见 docs/v28 和 docs/junior。

## 回滚

```bash
ln -sfn /www/wwwroot/starisle/releases/v2.2-single-chat-20261030-221800 /www/wwwroot/starisle/current.next
mv -Tf /www/wwwroot/starisle/current.next /www/wwwroot/starisle/current
systemctl restart starisle
```

共享数据目录保持原位。新增 mjs 静态规则与旧版兼容；如需撤销该规则，恢复上述星屿配置备份并通过 `nginx -t` 后平滑 reload。

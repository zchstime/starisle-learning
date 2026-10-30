# 2026-10-30 核心版本发布记录

## 发布结果

- Git 提交：`8ffe85c`（`feat: expand adaptive curriculum and companion experience`）
- GitHub：私有仓库 `zchstime/starisle-learning`
- 线上域名：`https://xy.laiyiju.com/`
- 服务器版本目录：`/www/wwwroot/starisle/releases/v2.1-core-20261030-8ffe85c`
- 当前链接：`/www/wwwroot/starisle/current`
- 上一版本：`/www/wwwroot/starisle/releases/v1.9-games-20261028-bc441ad`
- 发布包 SHA-256：`8f47098d2cce21f0bc07692a20148683f5e286506847555fa3b09a9af8ef544e`

## 数据与配置保护

发布使用独立版本目录和原子软链接切换，没有修改其他站点目录或 Nginx 配置。以下运行数据继续链接到独立共享目录，因此账号、云存档、管理配置和学习记录不会随版本切换被覆盖：

- `local/auth -> /www/wwwroot/starisle/shared/auth`
- `local/cloud -> /www/wwwroot/starisle/shared/cloud`
- `local/admin -> /www/wwwroot/starisle/shared/admin`
- `local/learning -> /www/wwwroot/starisle/shared/learning`

## 验证证据

- `npm test`：通过；覆盖 11 个学科、1—6 年级、2,201 个可玩关卡实例，以及登录、短信、云存档和期末试炼逻辑。
- `npm run build:web`：通过；Cocos Web Desktop 构建成功。
- `https://xy.laiyiju.com/`：HTTP 200，加载页、游客入口、学段选择和小学主地图实际浏览器试玩通过。
- `https://xy.laiyiju.com/api/auth/config`：HTTP 200，生产登录模式正常。
- `https://xy.laiyiju.com/learn`：HTTP 200。
- 同机其他站点 `app.laiyiju.com`、`datamig.app.laiyiju.com`、`joywork.laiyiju.com`：均为 HTTP 200。

## 回滚

如需回滚，只切换星屿项目软链接并重启星屿服务：

```bash
ln -sfn /www/wwwroot/starisle/releases/v1.9-games-20261028-bc441ad /www/wwwroot/starisle/current.next
mv -Tf /www/wwwroot/starisle/current.next /www/wwwroot/starisle/current
systemctl restart starisle
```

共享账号和存档目录不参与版本回滚。

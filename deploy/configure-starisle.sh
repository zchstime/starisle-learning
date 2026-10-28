#!/bin/bash
set -euo pipefail
base=/www/wwwroot/starisle
chown starisle:starisle "$base/shared/auth/smsbao.json"
chmod 600 "$base/shared/auth/smsbao.json"
cat > /etc/systemd/system/starisle.service <<'UNIT'
[Unit]
Description=Starisle learning game
After=network.target
[Service]
User=starisle
Group=starisle
WorkingDirectory=/www/wwwroot/starisle/current
Environment=STARISLE_PORT=39421
Environment=AUTH_MODE=live
Environment=AUTH_PUBLIC_ORIGIN=https://xy.laiyiju.com
Environment=AUTH_DATA_DIR=/www/wwwroot/starisle/shared/auth
ExecStart=/opt/starisle/node-v22.22.0-linux-x64/bin/node /www/wwwroot/starisle/current/tools/serve.cjs
Restart=on-failure
RestartSec=5
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/www/wwwroot/starisle/shared/auth
MemoryMax=256M
CPUQuota=50%
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now starisle
mkdir -p /www/wwwroot/starisle/acme/.well-known/acme-challenge
cat > /www/server/panel/vhost/nginx/xy.laiyiju.com.conf <<'NGINX'
server {
 listen 80;
 server_name xy.laiyiju.com;
 root /www/wwwroot/starisle/current/build/web-desktop;
 location ^~ /.well-known/acme-challenge/ { root /www/wwwroot/starisle/acme; }
 location / { return 503; }
}
NGINX
/www/server/nginx/sbin/nginx -t
/www/server/nginx/sbin/nginx -s reload
getent ahostsv4 xy.laiyiju.com | head -1
systemctl is-active starisle
curl -fsS -H 'Host: xy.laiyiju.com' http://127.0.0.1:39421/api/auth/config
printf '\nSTARISLE_SERVICE_READY\n'

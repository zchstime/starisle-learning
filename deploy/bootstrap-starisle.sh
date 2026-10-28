#!/bin/bash
set -euo pipefail
test ! -e /www/wwwroot/starisle
test ! -e /etc/systemd/system/starisle.service
test ! -e /www/server/panel/vhost/nginx/xy.laiyiju.com.conf
test -z "$(ss -lntH 'sport = :39421')"
echo '34308b67706e84d2b932960834ba6aeea413c099fda7c93cf0d89ebbde1d369a  /www/wwwroot/starisle-v1.2-release.tgz' | sha256sum -c -
mkdir -p /opt/starisle /www/wwwroot/starisle/releases/v1.2 /www/wwwroot/starisle/shared/auth
sha256sum /www/server/panel/vhost/nginx/*.conf > /opt/starisle/existing-nginx.sha256
id starisle >/dev/null 2>&1 || useradd --system --home-dir /www/wwwroot/starisle --shell /sbin/nologin starisle
tar -xzf /www/wwwroot/starisle-v1.2-release.tgz -C /www/wwwroot/starisle/releases/v1.2 2>/dev/null
ln -s releases/v1.2 /www/wwwroot/starisle/current
mkdir -p /www/wwwroot/starisle/releases/v1.2/local
ln -s /www/wwwroot/starisle/shared/auth /www/wwwroot/starisle/releases/v1.2/local/auth
chown starisle:starisle /www/wwwroot/starisle/shared/auth
chmod 700 /www/wwwroot/starisle/shared/auth
cd /opt/starisle
curl -fL --connect-timeout 20 --max-time 180 https://nodejs.org/dist/v22.22.0/node-v22.22.0-linux-x64.tar.xz -o node.tar.xz
curl -fL --connect-timeout 20 --max-time 60 https://nodejs.org/dist/v22.22.0/SHASUMS256.txt -o SHASUMS256.txt
grep ' node-v22.22.0-linux-x64.tar.xz$' SHASUMS256.txt | sed 's/node-v22.22.0-linux-x64.tar.xz/node.tar.xz/' | sha256sum -c -
tar -xf node.tar.xz
./node-v22.22.0-linux-x64/bin/node -v
printf '\nSTARISLE_BOOTSTRAP_READY\n'

#!/bin/bash
set -euo pipefail
mkdir -p /etc/starisle/tls
/opt/starisle/acme.sh --install-cert --home /opt/starisle/acme -d xy.laiyiju.com --ecc --key-file /etc/starisle/tls/privkey.pem --fullchain-file /etc/starisle/tls/fullchain.pem --reloadcmd '/www/server/nginx/sbin/nginx -t && /www/server/nginx/sbin/nginx -s reload'
cat > /www/server/panel/vhost/nginx/xy.laiyiju.com.conf <<'NGINX'
server {
 listen 80;
 server_name xy.laiyiju.com;
 location ^~ /.well-known/acme-challenge/ { root /www/wwwroot/starisle/acme; }
 location / { return 301 https://xy.laiyiju.com$request_uri; }
}
server {
 listen 443 ssl;
 server_name xy.laiyiju.com;
 ssl_certificate /etc/starisle/tls/fullchain.pem;
 ssl_certificate_key /etc/starisle/tls/privkey.pem;
 ssl_protocols TLSv1.2 TLSv1.3;
 root /www/wwwroot/starisle/current/build/web-desktop;
 index index.html;
 access_log /www/wwwlogs/xy.laiyiju.com.log;
 error_log /www/wwwlogs/xy.laiyiju.com.error.log;
 client_max_body_size 16k;
 location /api/auth/ {
  proxy_pass http://127.0.0.1:39421;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto https;
  proxy_connect_timeout 5s;
  proxy_read_timeout 20s;
 }
 location ~ /\. { deny all; }
 location / { try_files $uri $uri/ =404; }
 location ~* \.(js|css|json|png|jpg|jpeg|webp|wav|mp3|bin|wasm)$ {
  try_files $uri =404;
  add_header Cache-Control 'public, max-age=3600';
 }
 add_header X-Content-Type-Options nosniff;
 add_header Referrer-Policy strict-origin-when-cross-origin;
}
NGINX
/www/server/nginx/sbin/nginx -t
/www/server/nginx/sbin/nginx -s reload
cat > /etc/cron.d/starisle-cert <<'CRON'
17 3 * * * root /opt/starisle/acme.sh --cron --home /opt/starisle/acme >> /opt/starisle/acme-renew.log 2>&1
CRON
chmod 644 /etc/cron.d/starisle-cert
mv /www/wwwroot/starisle-v1.2-release.tgz /opt/starisle/
sha256sum -c /opt/starisle/existing-nginx.sha256
for h in app.laiyiju.com datamig.app.laiyiju.com joywork.laiyiju.com xy.laiyiju.com; do curl -sS -o /dev/null -w "$h %{http_code}\n" --resolve "$h:443:127.0.0.1" "https://$h/"; done
node -v
systemctl is-active starisle
printf '\nSTARISLE_HTTPS_READY\n'

#!/bin/bash

# ================================================
# FeedoBridge 部署命令集
# 请在你的本地终端复制粘贴执行这些命令
# ================================================

echo "🚀 开始部署 FeedoBridge"
echo "请按照提示一步步执行"
echo ""

# ========================================
# 第一步：连接到服务器
# ========================================
cat << 'EOF'

📝 第一步：SSH 连接到服务器
-----------------------------------
ssh root@31.97.211.143

连接成功后，继续执行下面的命令...

EOF

read -p "按 Enter 继续查看服务器端命令..."

# ========================================
# 服务器端命令（复制到服务器执行）
# ========================================
cat << 'EOF'

================================
🔧 服务器端命令（在服务器上执行）
================================

# 1️⃣ 更新系统并安装基础工具
apt update -y && apt upgrade -y
apt install -y curl wget git nano ufw

# 2️⃣ 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh
systemctl enable docker
systemctl start docker
docker --version

# 3️⃣ 安装 Docker Compose
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d'"' -f4)
curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
docker-compose --version

# 4️⃣ 安装 Nginx
apt install -y nginx
systemctl enable nginx
systemctl start nginx
nginx -v

# 5️⃣ 安装 Certbot
apt install -y certbot python3-certbot-nginx
certbot --version

# 6️⃣ 配置防火墙
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status

# 7️⃣ 创建项目目录并克隆代码
mkdir -p /opt/feedobridge
cd /opt/feedobridge

# 克隆代码（公开仓库）
git clone https://github.com/Nopassdeve/FeedoBridge.git .

# 或者如果需要 token（私有仓库）：
# git clone https://YOUR_GITHUB_TOKEN@github.com/Nopassdeve/FeedoBridge.git .

# 8️⃣ 配置 Nginx 反向代理
cat > /etc/nginx/sites-available/feedobridge << 'NGINX_CONFIG'
server {
    listen 80;
    server_name plugin.ifeedog.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        access_log off;
        return 200 "OK";
    }
}
NGINX_CONFIG

# 启用站点
ln -sf /etc/nginx/sites-available/feedobridge /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试并重启 Nginx
nginx -t
systemctl restart nginx

# 9️⃣ 创建环境变量文件
cat > /opt/feedobridge/.env << 'ENV_FILE'
SHOPIFY_API_KEY=9da46159e4de788dab1f3cc2533551e4
SHOPIFY_API_SECRET=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
SCOPES=read_products,write_products,read_customers,write_customers,read_orders,write_orders
APP_URL=https://plugin.ifeedog.com
HOST=https://plugin.ifeedog.com
DATABASE_URL=postgresql://postgres:FeedoBridge2024Secure@db:5432/feedobridge
REDIS_URL=redis://redis:6379
FEEDOGO_BASE_URL=https://shop.feedogocloud.com
FEEDOGO_API_KEY=YOUR_FEEDOGO_API_KEY
JWT_SECRET=your-random-jwt-secret-min-32-chars-long
SSO_SECRET=your-random-sso-secret-string
ENV_FILE

echo "⚠️  环境变量文件已创建，你可以稍后编辑修改敏感信息"

# 🔟 修改 docker-compose.yml 数据库密码
sed -i 's/POSTGRES_PASSWORD=password/POSTGRES_PASSWORD=FeedoBridge2024Secure/' /opt/feedobridge/docker-compose.yml

# 1️⃣1️⃣ 获取 SSL 证书（确保 DNS 已解析）
echo ""
echo "📝 请确认 plugin.ifeedog.com 已解析到 31.97.211.143"
echo "然后执行以下命令获取 SSL 证书："
echo ""
echo "certbot --nginx -d plugin.ifeedog.com --non-interactive --agree-tos -m your-email@example.com"
echo ""
echo "或者手动执行（会询问邮箱）："
echo "certbot --nginx -d plugin.ifeedog.com"
echo ""
read -p "按 Enter 继续..."

# 如果确认 DNS 已解析，可以直接执行：
# certbot --nginx -d plugin.ifeedog.com

# 1️⃣2️⃣ 启动应用
cd /opt/feedobridge
docker-compose up -d

echo ""
echo "⏳ 应用正在构建和启动（首次需要 5-10 分钟）..."
echo "查看构建日志："
echo ""
echo "docker logs feedobridge-app -f"
echo ""
echo "看到 'Ready in X.Xs' 表示启动成功"
echo ""

# 1️⃣3️⃣ 等待应用启动后，运行数据库迁移
echo "等待应用完全启动后（约 5 分钟），执行数据库迁移："
echo ""
echo "docker exec feedobridge-app npx prisma migrate deploy"
echo ""

# 1️⃣4️⃣ 验证部署
echo "验证部署："
echo ""
echo "# 检查容器状态"
echo "docker ps"
echo ""
echo "# 测试应用"
echo "curl -I https://plugin.ifeedog.com"
echo ""
echo "# 测试数据库连接"
echo 'curl "https://plugin.ifeedog.com/api/test-db?shop=feedogostore.myshopify.com"'
echo ""

EOF

echo ""
echo "✅ 命令集准备完成！"
echo "请复制上面的命令到你连接的服务器终端执行"

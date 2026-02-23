#!/bin/bash

# FeedoBridge 新服务器初始化脚本
# 服务器: 31.97.211.143
# 域名: plugin.ifeedog.com

set -e

echo "🔧 FeedoBridge 服务器初始化"
echo "================================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}步骤 1/7: 更新系统${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}步骤 2/7: 安装 Docker${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker 安装完成${NC}"
else
    echo -e "${GREEN}✅ Docker 已安装${NC}"
fi

echo -e "${YELLOW}步骤 3/7: 安装 Docker Compose${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose 安装完成${NC}"
else
    echo -e "${GREEN}✅ Docker Compose 已安装${NC}"
fi

echo -e "${YELLOW}步骤 4/7: 安装 Nginx${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    echo -e "${GREEN}✅ Nginx 安装完成${NC}"
else
    echo -e "${GREEN}✅ Nginx 已安装${NC}"
fi

echo -e "${YELLOW}步骤 5/7: 安装 Certbot (SSL)${NC}"
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✅ Certbot 安装完成${NC}"
else
    echo -e "${GREEN}✅ Certbot 已安装${NC}"
fi

echo -e "${YELLOW}步骤 6/7: 创建项目目录${NC}"
mkdir -p /opt/feedobridge
cd /opt/feedobridge

echo -e "${YELLOW}步骤 7/7: 配置 Nginx${NC}"
cat > /etc/nginx/sites-available/feedobridge << 'EOF'
server {
    listen 80;
    server_name plugin.ifeedog.com;

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
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/feedobridge /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
nginx -t

# 重启 Nginx
systemctl restart nginx

echo ""
echo -e "${GREEN}✅ 服务器初始化完成！${NC}"
echo ""
echo "📝 下一步操作："
echo "1. 确保域名 plugin.ifeedog.com 已解析到 31.97.211.143"
echo "2. 获取 SSL 证书: certbot --nginx -d plugin.ifeedog.com"
echo "3. 克隆代码: cd /opt/feedobridge && git clone https://YOUR_TOKEN@github.com/Nopassdeve/FeedoBridge.git ."
echo "4. 创建 .env 文件并配置环境变量"
echo "5. 启动应用: docker compose up -d"
echo ""

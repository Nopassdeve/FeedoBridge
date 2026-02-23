#!/bin/bash

# ================================================
# FeedoBridge 新服务器完整初始化和部署脚本
# 服务器: 31.97.211.143
# 域名: plugin.ifeedog.com
# ================================================

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "================================================"
echo "  FeedoBridge 新服务器完整部署"
echo "  plugin.ifeedog.com (31.97.211.143)"
echo "================================================"
echo -e "${NC}"

# ========================================
# 步骤 1: 更新系统
# ========================================
echo -e "${YELLOW}[1/10] 更新系统包...${NC}"
apt update -y
apt upgrade -y
echo -e "${GREEN}✓ 系统更新完成${NC}\n"

# ========================================
# 步骤 2: 安装基础工具
# ========================================
echo -e "${YELLOW}[2/10] 安装基础工具...${NC}"
apt install -y curl wget git nano ufw
echo -e "${GREEN}✓ 基础工具安装完成${NC}\n"

# ========================================
# 步骤 3: 安装 Docker
# ========================================
echo -e "${YELLOW}[3/10] 安装 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker 安装完成${NC}"
else
    echo -e "${GREEN}✓ Docker 已安装${NC}"
fi
docker --version
echo ""

# ========================================
# 步骤 4: 安装 Docker Compose
# ========================================
echo -e "${YELLOW}[4/10] 安装 Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d'"' -f4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose 安装完成${NC}"
else
    echo -e "${GREEN}✓ Docker Compose 已安装${NC}"
fi
docker-compose --version
echo ""

# ========================================
# 步骤 5: 安装 Nginx
# ========================================
echo -e "${YELLOW}[5/10] 安装 Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo -e "${GREEN}✓ Nginx 安装完成${NC}"
else
    echo -e "${GREEN}✓ Nginx 已安装${NC}"
fi
nginx -v
echo ""

# ========================================
# 步骤 6: 安装 Certbot (SSL)
# ========================================
echo -e "${YELLOW}[6/10] 安装 Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✓ Certbot 安装完成${NC}"
else
    echo -e "${GREEN}✓ Certbot 已安装${NC}"
fi
certbot --version
echo ""

# ========================================
# 步骤 7: 配置防火墙
# ========================================
echo -e "${YELLOW}[7/10] 配置防火墙...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo -e "${GREEN}✓ 防火墙配置完成${NC}\n"

# ========================================
# 步骤 8: 创建项目目录并克隆代码
# ========================================
echo -e "${YELLOW}[8/10] 克隆项目代码...${NC}"
mkdir -p /opt/feedobridge
cd /opt/feedobridge

# 提示输入 GitHub Token（如果需要）
if [ ! -d ".git" ]; then
    echo -e "${BLUE}请输入 GitHub Personal Access Token (留空则使用公开访问):${NC}"
    read -s GITHUB_TOKEN
    
    if [ -z "$GITHUB_TOKEN" ]; then
        git clone https://github.com/Nopassdeve/FeedoBridge.git .
    else
        git clone https://${GITHUB_TOKEN}@github.com/Nopassdeve/FeedoBridge.git .
    fi
    echo -e "${GREEN}✓ 代码克隆完成${NC}"
else
    git pull
    echo -e "${GREEN}✓ 代码更新完成${NC}"
fi
echo ""

# ========================================
# 步骤 9: 配置 Nginx 反向代理
# ========================================
echo -e "${YELLOW}[9/10] 配置 Nginx...${NC}"
cat > /etc/nginx/sites-available/feedobridge << 'NGINX_EOF'
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
        
        # Shopify webhook 需要的超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 健康检查
    location /health {
        access_log off;
        return 200 "OK";
    }
}
NGINX_EOF

# 启用站点
ln -sf /etc/nginx/sites-available/feedobridge /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
echo -e "${GREEN}✓ Nginx 配置完成${NC}\n"

# ========================================
# 步骤 10: 创建环境变量文件
# ========================================
echo -e "${YELLOW}[10/10] 配置环境变量...${NC}"

if [ ! -f ".env" ]; then
    cat > .env << 'ENV_EOF'
# Shopify App 配置
SHOPIFY_API_KEY=9da46159e4de788dab1f3cc2533551e4
SHOPIFY_API_SECRET=YOUR_SHOPIFY_API_SECRET
SCOPES=read_products,write_products,read_customers,write_customers,read_orders,write_orders

# 应用 URL
APP_URL=https://plugin.ifeedog.com
HOST=https://plugin.ifeedog.com

# 数据库
DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@db:5432/feedobridge

# Redis
REDIS_URL=redis://redis:6379

# FeedoGo API
FEEDOGO_BASE_URL=https://shop.feedogocloud.com
FEEDOGO_API_KEY=YOUR_FEEDOGO_API_KEY

# JWT
JWT_SECRET=YOUR_RANDOM_JWT_SECRET

# SSO
SSO_SECRET=YOUR_SSO_SECRET
ENV_EOF
    echo -e "${RED}⚠️  请立即编辑 /opt/feedobridge/.env 文件填写敏感信息！${NC}"
    echo -e "${BLUE}需要配置的变量:${NC}"
    echo "  - SHOPIFY_API_SECRET"
    echo "  - DATABASE_URL 中的数据库密码"
    echo "  - JWT_SECRET"
    echo "  - FEEDOGO_API_KEY"
    echo "  - SSO_SECRET"
else
    echo -e "${GREEN}✓ .env 文件已存在${NC}"
fi
echo ""

# ========================================
# 完成信息
# ========================================
echo -e "${GREEN}"
echo "================================================"
echo "  ✅ 服务器初始化完成！"
echo "================================================"
echo -e "${NC}"

echo -e "${BLUE}📝 后续步骤:${NC}"
echo ""
echo "1️⃣  配置环境变量:"
echo "   nano /opt/feedobridge/.env"
echo ""
echo "2️⃣  配置 docker-compose.yml 数据库密码:"
echo "   nano /opt/feedobridge/docker-compose.yml"
echo "   (修改 POSTGRES_PASSWORD)"
echo ""
echo "3️⃣  获取 SSL 证书 (确保 DNS 已解析):"
echo "   certbot --nginx -d plugin.ifeedog.com"
echo ""
echo "4️⃣  启动应用:"
echo "   cd /opt/feedobridge"
echo "   docker-compose up -d"
echo ""
echo "5️⃣  查看日志:"
echo "   docker logs feedobridge-app -f"
echo ""
echo "6️⃣  运行数据库迁移:"
echo "   docker exec feedobridge-app npx prisma migrate deploy"
echo ""

echo -e "${YELLOW}⚠️  重要提醒:${NC}"
echo "  - 确保 plugin.ifeedog.com 已解析到 31.97.211.143"
echo "  - 在启动前必须配置好 .env 文件"
echo "  - 第一次构建需要 5-10 分钟"
echo ""

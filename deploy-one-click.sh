#!/bin/bash

# ================================================
# FeedoBridge 一键完整部署脚本
# 服务器: 31.97.211.143
# 域名: plugin.ifeedog.com
# ================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "================================================"
echo "  🚀 FeedoBridge 一键部署脚本"
echo "  plugin.ifeedog.com (31.97.211.143)"
echo "================================================"
echo -e "${NC}"

# ========================================
# 步骤 1: 更新系统
# ========================================
echo -e "${YELLOW}[1/12] 更新系统...${NC}"
apt update -y && apt upgrade -y
echo -e "${GREEN}✓ 系统更新完成${NC}\n"

# ========================================
# 步骤 2: 安装基础工具
# ========================================
echo -e "${YELLOW}[2/12] 安装基础工具...${NC}"
apt install -y curl wget git nano ufw ca-certificates gnupg lsb-release
echo -e "${GREEN}✓ 基础工具安装完成${NC}\n"

# ========================================
# 步骤 3: 安装 Docker
# ========================================
echo -e "${YELLOW}[3/12] 安装 Docker...${NC}"
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
echo -e "${YELLOW}[4/12] 安装 Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
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
echo -e "${YELLOW}[5/12] 安装 Nginx...${NC}"
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
# 步骤 6: 安装 Certbot
# ========================================
echo -e "${YELLOW}[6/12] 安装 Certbot...${NC}"
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
echo -e "${YELLOW}[7/12] 配置防火墙...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo -e "${GREEN}✓ 防火墙配置完成${NC}\n"

# ========================================
# 步骤 8: 克隆项目代码
# ========================================
echo -e "${YELLOW}[8/12] 克隆项目代码...${NC}"
mkdir -p /opt/feedobridge
cd /opt/feedobridge

if [ ! -d ".git" ]; then
    git clone https://github.com/Nopassdeve/FeedoBridge.git .
    echo -e "${GREEN}✓ 代码克隆完成${NC}"
else
    git pull
    echo -e "${GREEN}✓ 代码更新完成${NC}"
fi
echo ""

# ========================================
# 步骤 9: 配置 Nginx
# ========================================
echo -e "${YELLOW}[9/12] 配置 Nginx 反向代理...${NC}"
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
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        access_log off;
        return 200 "OK";
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/feedobridge /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
echo -e "${GREEN}✓ Nginx 配置完成${NC}\n"

# ========================================
# 步骤 10: 创建完整的环境变量文件
# ========================================
echo -e "${YELLOW}[10/12] 创建环境变量文件...${NC}"
cat > /opt/feedobridge/.env << 'ENV_EOF'
# FeedoBridge 生产环境配置
# ==========================================
# Shopify App 配置
# ==========================================
SHOPIFY_API_KEY=9da46159e4de788dab1f3cc2533551e4
SHOPIFY_API_SECRET=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
SCOPES=read_products,write_products,read_customers,write_customers,read_orders,write_orders

# ==========================================
# 应用 URL
# ==========================================
APP_URL=https://plugin.ifeedog.com
HOST=https://plugin.ifeedog.com

# ==========================================
# 数据库配置
# ==========================================
DATABASE_URL=postgresql://postgres:i16jjRQEjHBW6ze985jn@db:5432/feedobridge

# ==========================================
# Redis 配置
# ==========================================
REDIS_URL=redis://redis:6379

# ==========================================
# FeedoGo API 配置
# ==========================================
FEEDOGO_BASE_URL=https://shop.feedogocloud.com
FEEDOGO_API_KEY=

# ==========================================
# 安全密钥
# ==========================================
JWT_SECRET=DeuEppfcrs3fDHBcueaAb3WSR5Olslk5ofVc3oomowA=
SSO_SECRET=lSONihpnviu2POTXOpL6/SuB6mhN0jF04785dz5zph8=

# ==========================================
# 其他配置
# ==========================================
NODE_ENV=production
ENV_EOF
echo -e "${GREEN}✓ 环境变量文件创建完成${NC}\n"

# ========================================
# 步骤 11: 获取 SSL 证书
# ========================================
echo -e "${YELLOW}[11/12] 获取 SSL 证书...${NC}"
echo -e "${BLUE}正在检查 DNS 解析...${NC}"

# 检查 DNS 是否解析
if host plugin.ifeedog.com | grep -q "31.97.211.143"; then
    echo -e "${GREEN}✓ DNS 解析正确${NC}"
    echo -e "${BLUE}正在获取 SSL 证书...${NC}"
    
    # 尝试获取证书（非交互式）
    certbot --nginx -d plugin.ifeedog.com --non-interactive --agree-tos -m admin@ifeedog.com --redirect || {
        echo -e "${YELLOW}⚠️  自动获取 SSL 证书失败${NC}"
        echo -e "${BLUE}请稍后手动执行: certbot --nginx -d plugin.ifeedog.com${NC}"
    }
else
    echo -e "${YELLOW}⚠️  DNS 尚未解析或解析错误${NC}"
    echo -e "${BLUE}请确保 plugin.ifeedog.com 已解析到 31.97.211.143${NC}"
    echo -e "${BLUE}解析完成后执行: certbot --nginx -d plugin.ifeedog.com${NC}"
fi
echo ""

# ========================================
# 步骤 12: 启动应用
# ========================================
echo -e "${YELLOW}[12/12] 启动应用...${NC}"
cd /opt/feedobridge
docker-compose up -d

echo -e "${GREEN}✓ 应用正在启动...${NC}\n"

echo -e "${BLUE}⏳ 等待应用构建（约 5-10 分钟）...${NC}"
echo -e "${BLUE}查看实时日志: docker logs feedobridge-app -f${NC}\n"

# 等待应用启动
sleep 30
echo -e "${BLUE}检查容器状态...${NC}"
docker ps

echo ""
echo -e "${GREEN}"
echo "================================================"
echo "  ✅ 部署完成！"
echo "================================================"
echo -e "${NC}"

echo -e "${BLUE}📝 后续步骤:${NC}"
echo ""
echo "1️⃣  查看应用日志（等待启动完成）:"
echo "   docker logs feedobridge-app -f"
echo "   看到 'Ready in X.Xs' 表示启动成功"
echo ""
echo "2️⃣  运行数据库迁移:"
echo "   docker exec feedobridge-app npx prisma migrate deploy"
echo ""
echo "3️⃣  验证部署:"
echo "   curl https://plugin.ifeedog.com/api/test-db?shop=feedogostore.myshopify.com"
echo ""
echo "4️⃣  如果 SSL 证书未自动获取，手动执行:"
echo "   certbot --nginx -d plugin.ifeedog.com"
echo ""

echo -e "${YELLOW}⚠️  注意事项:${NC}"
echo "  - 数据库密码: i16jjRQEjHBW6ze985jn"
echo "  - 如需修改 FEEDOGO_API_KEY，编辑: /opt/feedobridge/.env"
echo "  - 重启应用: docker-compose restart app"
echo ""

echo -e "${GREEN}🎉 FeedoBridge 已成功部署到 plugin.ifeedog.com${NC}"

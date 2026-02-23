#!/bin/bash
# ============================================
# FeedoBridge 完整部署命令序列
# 在服务器上直接复制粘贴执行
# ============================================

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}   FeedoBridge 自动部署到 plugin.ifeedog.com${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""

set -e

# ========== 1. 更新系统 ==========
echo -e "${YELLOW}[1/11] 更新系统...${NC}"
apt update -y && apt upgrade -y
echo -e "${GREEN}✓ 完成${NC}\n"

# ========== 2. 安装基础工具 ==========
echo -e "${YELLOW}[2/11] 安装基础工具...${NC}"
apt install -y curl wget git nano ufw
echo -e "${GREEN}✓ 完成${NC}\n"

# ========== 3. 安装 Docker ==========
echo -e "${YELLOW}[3/11] 安装 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi
docker --version
echo -e "${GREEN}✓ 完成${NC}\n"

# ========== 4. 安装 Docker Compose ==========
echo -e "${YELLOW}[4/11] 安装 Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi
docker-compose --version
echo -e "${GREEN}✓ 完成${NC}\n"

# ========== 5. 安装 Nginx ==========
echo -e "${YELLOW}[5/11] 安装 Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
fi
nginx -v
echo -e "${GREEN}✓ 完成${NC}\n"

# ========== 6. 安装 Certbot ==========
echo -e "${YELLOW}[6/11] 安装 Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi
certbot --version
echo -e "${GREEN}✓ 完成${NC}\n"

# ========== 7. 配置防火墙 ==========
echo -e "${YELLOW}[7/11] 配置防火墙...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable
echo -e "${GREEN}✓ 完成${NC}\n"

# ========== 8. 克隆代码 ==========
echo -e "${YELLOW}[8/11] 克隆项目代码...${NC}"
mkdir -p /opt/feedobridge
cd /opt/feedobridge
if [ ! -d ".git" ]; then
    git clone https://github.com/Nopassdeve/FeedoBridge.git .
else
    git pull origin main
fi
echo -e "${GREEN}✓ 完成${NC}\n"

# ========== 9. 配置 Nginx ==========
echo -e "${YELLOW}[9/11] 配置 Nginx 反向代理...${NC}"
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
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/feedobridge /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
echo -e "${GREEN}✓ 完成${NC}\n"

# ========== 10. 配置环境变量 ==========
echo -e "${YELLOW}[10/11] 配置环境变量...${NC}"
cd /opt/feedobridge

# 生成随机密钥
DB_PASSWORD=$(openssl rand -base64 16 | tr -d '/' | tr -d '+' | tr -d '=')
JWT_SECRET=$(openssl rand -base64 32)
SSO_SECRET=$(openssl rand -base64 32)

cat > .env << ENV_EOF
# Shopify App 配置
SHOPIFY_API_KEY=9da46159e4de788dab1f3cc2533551e4
SHOPIFY_API_SECRET=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
SCOPES=read_products,write_products,read_customers,write_customers,read_orders,write_orders

# 应用 URL
APP_URL=https://plugin.ifeedog.com
HOST=https://plugin.ifeedog.com

# 数据库
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/feedobridge

# Redis
REDIS_URL=redis://redis:6379

# FeedoGo API
FEEDOGO_BASE_URL=https://shop.feedogocloud.com

# JWT
JWT_SECRET=${JWT_SECRET}

# SSO
SSO_SECRET=${SSO_SECRET}
ENV_EOF

# 更新 docker-compose.yml 中的数据库密码
sed -i "s/POSTGRES_PASSWORD=password/POSTGRES_PASSWORD=${DB_PASSWORD}/" docker-compose.yml

echo -e "${GREEN}✓ 环境变量已配置${NC}"
echo -e "${BLUE}数据库密码: ${DB_PASSWORD}${NC}\n"

# ========== 11. 启动应用 ==========
echo -e "${YELLOW}[11/11] 启动 Docker 容器...${NC}"
docker-compose down 2>/dev/null || true
docker-compose up -d

echo ""
echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}   🎉 部署启动中...${NC}"
echo -e "${GREEN}==================================================${NC}"
echo ""
echo -e "${BLUE}正在构建应用（需要 5-10 分钟），请耐心等待...${NC}"
echo ""
echo -e "${YELLOW}查看构建进度：${NC}"
echo "  docker logs feedobridge-app -f"
echo ""
echo -e "${YELLOW}等待看到以下输出表示成功：${NC}"
echo "  ✓ Ready in X.Xs"
echo ""
echo -e "${YELLOW}然后运行数据库迁移：${NC}"
echo "  docker exec feedobridge-app npx prisma migrate deploy"
echo ""
echo -e "${YELLOW}最后获取 SSL 证书（确保 DNS 已解析）：${NC}"
echo "  certbot --nginx -d plugin.ifeedog.com"
echo ""
echo -e "${YELLOW}验证部署：${NC}"
echo "  curl https://plugin.ifeedog.com/api/test-db?shop=feedogostore.myshopify.com"
echo ""

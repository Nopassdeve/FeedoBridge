#!/bin/bash

# 🚀 FeedoBridge 一键部署脚本
# 在新服务器 31.97.211.143 上运行此脚本

echo "🚀 开始部署 FeedoBridge 到 plugin.ifeedog.com"
echo "=================================================="

# 请在此处填写你的配置
GITHUB_TOKEN="YOUR_GITHUB_TOKEN_HERE"
SHOPIFY_API_SECRET="YOUR_SHOPIFY_API_SECRET"
DB_PASSWORD="YOUR_SECURE_DB_PASSWORD"
JWT_SECRET="YOUR_RANDOM_JWT_SECRET"

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

set -e

# 1. 克隆代码
echo "📥 克隆代码..."
cd /opt/feedobridge
if [ ! -d ".git" ]; then
    git clone https://${GITHUB_TOKEN}@github.com/Nopassdeve/FeedoBridge.git .
else
    git pull
fi

# 2. 创建环境变量
echo "⚙️  配置环境变量..."
cat > .env << EOF
SHOPIFY_API_KEY=9da46159e4de788dab1f3cc2533551e4
SHOPIFY_API_SECRET=${SHOPIFY_API_SECRET}
SCOPES=read_products,write_products,read_customers,write_customers,read_orders,write_orders
APP_URL=https://plugin.ifeedog.com
HOST=https://plugin.ifeedog.com
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/feedobridge
REDIS_URL=redis://redis:6379
FEEDOGO_BASE_URL=https://shop.feedogocloud.com
JWT_SECRET=${JWT_SECRET}
EOF

# 3. 更新 docker-compose.yml 中的数据库密码
sed -i "s/POSTGRES_PASSWORD=password/POSTGRES_PASSWORD=${DB_PASSWORD}/" docker-compose.yml

# 4. 启动容器
echo "🐳 启动 Docker 容器..."
docker compose down
docker compose up -d

# 5. 等待应用启动
echo "⏳ 等待应用启动（约 3 分钟）..."
sleep 180

# 6. 运行数据库迁移
echo "🗄️  运行数据库迁移..."
docker exec feedobridge-app npx prisma migrate deploy || echo "迁移可能已经运行过"

# 7. 验证部署
echo "✅ 验证部署..."
docker ps | grep feedobridge

echo ""
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo "访问地址: https://plugin.ifeedog.com"
echo ""
echo "检查应用日志:"
echo "  docker logs feedobridge-app -f"
echo ""

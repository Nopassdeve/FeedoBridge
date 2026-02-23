#!/bin/bash

# FeedoBridge 生产环境快速部署脚本
# 使用方法: ./production-deploy.sh

set -e  # 遇到错误立即退出

echo "🚀 FeedoBridge 生产环境部署"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# VPS 配置
VPS_HOST="31.97.211.143"
VPS_USER="root"
PROJECT_PATH="/opt/feedobridge"

echo -e "${YELLOW}步骤 1/5: 本地构建测试${NC}"
echo "-----------------------------------"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 生成 Prisma Client
echo "🔧 生成 Prisma Client..."
npx prisma generate

# 本地构建测试
echo "🏗️  本地构建..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 本地构建成功${NC}"
else
    echo -e "${RED}❌ 本地构建失败，请检查错误${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}步骤 2/5: 同步代码到服务器${NC}"
echo "-----------------------------------"

# 同步代码到 VPS（排除不需要的目录）
echo "📤 上传代码到 VPS..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude '.vscode' \
    --exclude 'PRODUCTION_DEPLOY.md' \
    ./ ${VPS_USER}@${VPS_HOST}:${PROJECT_PATH}/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 代码同步成功${NC}"
else
    echo -e "${RED}❌ 代码同步失败${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}步骤 3/5: 在服务器上重启应用${NC}"
echo "-----------------------------------"

ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
    set -e
    cd /opt/feedobridge
    
    echo "🔄 重启 Docker 容器..."
    docker compose down
    docker compose up -d
    
    echo "⏳ 等待应用构建启动（约 3 分钟）..."
    sleep 180
    
    echo "📋 检查应用状态..."
    docker ps | grep feedobridge-app
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 应用重启成功${NC}"
else
    echo -e "${RED}❌ 应用重启失败${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}步骤 4/5: 验证部署${NC}"
echo "-----------------------------------"

# 等待几秒确保应用完全启动
sleep 10

echo "🔍 健康检查..."
HEALTH_CHECK=$(curl -s "https://shopifyapp.xmasforest.com/api/test-db?shop=feedogostore.myshopify.com" | jq -r '.status' 2>/dev/null || echo "error")

if [ "$HEALTH_CHECK" = "ok" ]; then
    echo -e "${GREEN}✅ 健康检查通过${NC}"
else
    echo -e "${YELLOW}⚠️  健康检查失败或超时，请手动检查${NC}"
fi

echo ""
echo "🔍 检查配置..."
curl -s "https://shopifyapp.xmasforest.com/api/settings?shop=feedogostore.myshopify.com" | jq '{feedogoWebhookUrl, enableSso, enableAutoRegister}' 2>/dev/null || echo "配置检查失败"

echo ""
echo -e "${YELLOW}步骤 5/5: 查看日志${NC}"
echo "-----------------------------------"

ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
    echo "📊 最近的应用日志："
    docker logs feedobridge-app-1 --tail 30
ENDSSH

echo ""
echo "================================"
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "================================"
echo ""
echo "📝 验证清单："
echo "  1. 访问应用: https://shopifyapp.xmasforest.com"
echo "  2. Shopify Admin: https://admin.shopify.com/store/feedogostore/apps/feedobridge"
echo "  3. 测试下单: 检查爱心币是否自动兑换"
echo ""
echo "📊 监控命令："
echo "  实时日志: ssh ${VPS_USER}@${VPS_HOST} 'docker logs feedobridge-app-1 -f'"
echo "  容器状态: ssh ${VPS_USER}@${VPS_HOST} 'docker ps | grep feedobridge'"
echo "  订单日志: curl 'https://shopifyapp.xmasforest.com/api/order-logs?shop=feedogostore.myshopify.com' | jq"
echo ""
echo "✨ Good luck!"

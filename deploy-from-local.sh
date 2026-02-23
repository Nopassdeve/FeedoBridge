#!/bin/bash

# ================================================
# FeedoBridge 本地一键部署脚本
# 在你的本地 Mac 终端执行
# ================================================

SERVER="31.97.211.143"
PASSWORD="7lrpZhE94Yeo83zr8F&s"

echo "🚀 开始部署 FeedoBridge..."
echo ""

# 使用 SSH 执行远程命令
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no root@$SERVER << 'ENDSSH'

set -e

echo "📍 当前位置: $(pwd)"
echo "📂 进入项目目录..."
cd /opt/feedobridge

echo "🔄 拉取最新代码..."
git pull

echo "🧹 清理 Docker 缓存..."
docker-compose down -v
docker system prune -af

echo "🔨 开始构建..."
docker-compose build --no-cache

echo "🚀 启动应用..."
docker-compose up -d

echo ""
echo "⏳ 等待应用启动（约 30 秒）..."
sleep 30

echo "📊 检查容器状态..."
docker ps

echo ""
echo "✅ 部署命令执行完成！"
echo ""
echo "📝 查看应用日志:"
echo "   docker logs -f feedobridge-app"
echo ""
echo "🔍 等待启动完成后（约 5-10 分钟），运行:"
echo "   docker exec feedobridge-app npx prisma migrate deploy"
echo "   curl https://plugin.ifeedog.com/api/test-db?shop=feedogostore.myshopify.com"

ENDSSH

echo ""
echo "🎉 脚本执行完成！"

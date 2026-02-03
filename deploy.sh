#!/bin/bash
# 自动部署脚本 - 在生产服务器上执行
# 使用方法: ssh root@shopifyapp.xmasforest.com 'bash -s' < deploy.sh

set -e

echo "🚀 FeedoBridge 部署开始..."

cd /opt/feedobridge

echo "📥 拉取最新代码..."
git fetch --all
git reset --hard origin/main

echo "🔄 重启应用容器..."
docker compose restart app

echo "⏳ 等待容器启动..."
sleep 3

echo "✅ 部署完成！"
echo ""
echo "📊 容器状态:"
docker compose ps

echo ""
echo "📝 最新提交:"
git log -1 --oneline

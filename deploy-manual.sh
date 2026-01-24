#!/bin/bash

# 手动部署脚本
# 使用方法: bash deploy-manual.sh

echo "🚀 开始部署到生产服务器..."

# 检查 git 仓库是否配置为使用 SSH
cd /opt/feedobridge

# 先检查当前 git remote
echo "📋 当前 Git Remote 配置:"
git remote -v

# 如果是 HTTPS，切换到 SSH
if git remote -v | grep -q "https://github.com"; then
    echo "🔄 将 Git Remote 从 HTTPS 切换到 SSH..."
    git remote set-url origin git@github.com:Nopassdeve/FeedoBridge.git
    echo "✅ 已切换到 SSH"
fi

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 重启 Docker 容器
echo "🔄 重启应用容器..."
docker compose restart app

echo "✅ 部署完成！"
echo ""
echo "📊 容器状态:"
docker compose ps

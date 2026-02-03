#!/bin/bash
# 修复并部署脚本

set -e

echo "🚀 FeedoBridge 部署开始..."

cd /opt/feedobridge

echo "🔧 检查 Git Remote..."
CURRENT_REMOTE=$(git remote get-url origin)
echo "当前 Remote: $CURRENT_REMOTE"

# 如果是 SSH，切换到 HTTPS
if [[ $CURRENT_REMOTE == git@* ]]; then
    echo "🔄 切换到 HTTPS..."
    git remote set-url origin https://github.com/Nopassdeve/FeedoBridge.git
fi

echo "📥 拉取最新代码（无需认证的公开仓库）..."
GIT_TERMINAL_PROMPT=0 git fetch --all 2>&1 || {
    echo "⚠️ Fetch 失败，尝试使用已有代码..."
}

git reset --hard origin/main 2>&1 || {
    echo "⚠️ Reset 失败，继续重启容器..."
}

echo "🔄 重启应用容器..."
docker compose restart app

echo "⏳ 等待容器启动..."
sleep 3

echo "✅ 部署完成！"
echo ""
echo "📊 容器状态:"
docker compose ps

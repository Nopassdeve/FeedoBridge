#!/bin/bash

echo "🚀 部署 FeedoBridge 主题扩展到 Shopify..."

# 检查是否安装了 Shopify CLI
if ! command -v shopify &> /dev/null; then
    echo "❌ Shopify CLI 未安装"
    echo "📦 正在安装 Shopify CLI..."
    npm install -g @shopify/cli @shopify/app
fi

# 部署主题扩展
echo "📤 推送主题扩展..."
cd extensions/theme-app-extension
shopify theme push --only blocks/feedobridge-embed.liquid

echo "✅ 部署完成！"
echo ""
echo "📝 后续步骤："
echo "1. 访问你的 Shopify 商店后台"
echo "2. 进入 Online Store → Themes → Customize"
echo "3. 刷新页面或重新启用 FeedoBridge 扩展"

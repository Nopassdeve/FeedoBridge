#!/bin/bash

echo "=== 检查 Webhook 状态 ==="
echo ""

echo "1. 检查 order-logs API:"
curl -s "https://shopifyapp.xmasforest.com/api/order-logs?shop=feedogostore.myshopify.com" | jq . || echo "API 无响应"
echo ""

echo "2. 测试 webhook 端点是否可访问:"
curl -s -X POST "https://shopifyapp.xmasforest.com/api/webhooks/orders-create" \
  -H "Content-Type: application/json" \
  -d '{"test": true}' || echo "Webhook 端点无响应"
echo ""

echo "3. 检查环境变量:"
echo "APP_URL 应该是: https://shopifyapp.xmasforest.com"
echo ""

echo "4. 重新注册 webhook (需要替换 shop 参数):"
echo "访问: https://shopifyapp.xmasforest.com/api/webhooks/register?shop=feedogostore.myshopify.com"

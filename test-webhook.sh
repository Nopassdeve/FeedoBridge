#!/bin/bash

# 订单 Webhook 测试脚本
# 用于手动测试订单同步功能

WEBHOOK_URL="https://shopifyapp.xmasforest.com/api/webhooks/orders-create"
SHOP_DOMAIN="feedogostore.myshopify.com"

echo "🧪 测试订单 Webhook"
echo "================================"
echo "Webhook URL: $WEBHOOK_URL"
echo "Shop Domain: $SHOP_DOMAIN"
echo ""

# 模拟订单数据
ORDER_DATA='{
  "id": 9999999999,
  "email": "nopassdeve@gmail.com",
  "customer": {
    "id": 9624343445735,
    "email": "nopassdeve@gmail.com",
    "first_name": "Test",
    "last_name": "User"
  },
  "total_price": "99.99",
  "subtotal_price": "99.99",
  "total_tax": "0.00",
  "currency": "USD",
  "financial_status": "paid",
  "order_number": 1001,
  "created_at": "2026-02-04T10:30:00Z",
  "line_items": [
    {
      "id": 1234567890,
      "title": "Test Product",
      "quantity": 1,
      "price": "99.99"
    }
  ]
}'

echo "📦 发送测试订单..."
echo "订单金额: $99.99 USD"
echo "客户邮箱: nopassdeve@gmail.com"
echo ""

# 注意: 这里不包含 HMAC 签名，所以会验证失败
# 仅用于测试 webhook endpoint 是否可访问
# 要真正测试，需要在 Shopify 后台手动触发，或者临时禁用签名验证

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Shop-Domain: $SHOP_DOMAIN" \
  -H "X-Shopify-Topic: orders/create" \
  -d "$ORDER_DATA" \
  -v

echo ""
echo "================================"
echo "✅ 测试完成"
echo ""
echo "📊 查看日志:"
echo "https://shopifyapp.xmasforest.com/api/order-logs?shop=feedogostore.myshopify.com"

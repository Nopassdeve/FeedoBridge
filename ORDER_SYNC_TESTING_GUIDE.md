# 订单同步测试指南

## 📋 功能说明

当用户在 Shopify 商店下单后，系统会自动：
1. 获取订单信息（订单号、金额、客户邮箱）
2. 调用 FeedoGo 的 `emailLogin` API 登录用户
3. 将订单金额转换为爱心币（Love Coins）并添加到用户账户

---

## 🔍 查看订单推送日志

### 方法 1：通过 API 查询（推荐）

**查看所有订单日志**：
```
https://shopifyapp.xmasforest.com/api/order-logs?shop=feedogostore.myshopify.com
```

**查看特定订单日志**：
```
https://shopifyapp.xmasforest.com/api/order-logs?shop=feedogostore.myshopify.com&orderId=ORDER_ID
```

**返回数据示例**：
```json
{
  "logs": [
    {
      "id": "xxx",
      "shopifyOrderId": "#1001",
      "status": "success",  // 成功
      "createdAt": "2026-02-04T10:30:00Z",
      "responseData": {
        "code": 1,
        "msg": "Score added successfully"
      }
    },
    {
      "id": "yyy",
      "shopifyOrderId": "#1000",
      "status": "failed",   // 失败
      "errorMessage": "Email login failed: User not found",
      "createdAt": "2026-02-04T09:15:00Z"
    }
  ],
  "stats": {
    "total": 10,
    "success": 8,
    "failed": 2,
    "pending": 0
  }
}
```

### 方法 2：查看服务器日志

SSH 登录到 VPS：
```bash
ssh root@76.13.98.3
cd /var/www/FeedoBridge
pm2 logs feedobridge
```

**日志输出示例**：
```
========================================
📦 Order Auto-Register Webhook Received
========================================
Shop Domain: feedogostore.myshopify.com
Order ID: 5678901234
Order Name: #1001
Customer Email: customer@example.com
Order Total: 99.99
----------------------------------------
✅ Shop found: feedogostore.myshopify.com
✅ Auto-register is enabled
✅ FeedoGo Webhook URL: https://shop.feedogocloud.com
✅ API Key configured: Yes (hidden)

🔐 Step 1: Email Login to get token
----------------------------------------
Email Login Response Code: 1
✅ Email login successful
User ID: 28
Nickname: Customer Name
Current Score: 1200
Token: a06c7d2e-f17c-4185...

💰 Step 2: Push order to FeedoGo (convert to love coins)
----------------------------------------
Order Details:
- Order ID: 5678901234
- Order Total: 99.99 USD
- Expected Love Coins: 99
- Customer Email: customer@example.com
- Customer Name: John Doe
✅ Order pushed to FeedoGo successfully
Response: { code: 1, msg: "Score added", newScore: 1299 }

========================================
✅ Order processed successfully!
========================================
```

---

## 🧪 测试步骤

### 1. 在 Shopify 商店下单

1. 访问您的 Shopify 商店前台
2. 以客户身份登录（使用邮箱）
3. 添加商品到购物车
4. 完成结账

### 2. 检查订单是否推送成功

**立即检查日志**（下单后 30 秒内）：
```bash
# 在浏览器打开
https://shopifyapp.xmasforest.com/api/order-logs?shop=feedogostore.myshopify.com
```

**查找您的订单号**，检查 `status` 字段：
- ✅ `success`: 订单已成功推送，爱心币已添加
- ❌ `failed`: 推送失败，查看 `errorMessage`
- ⏳ `pending`: 正在处理中

### 3. 验证 FeedoGo 账户爱心币

1. 登录 FeedoGo 网站：https://feedogocloud.com
2. 查看用户积分（爱心币）
3. 确认积分是否增加

**预期结果**：
- 如果订单金额为 $99.99，应该增加 **99 爱心币**
- 如果订单金额为 $50.00，应该增加 **50 爱心币**

---

## ❓ 常见问题

### Q1: 日志显示 "Email login failed"
**原因**：用户邮箱在 FeedoGo 中不存在  
**解决**：
1. 确认用户已在 FeedoGo 注册（emailLogin API 会自动注册）
2. 检查邮箱是否正确
3. 查看详细错误信息

### Q2: 日志显示 "FeedoGo Webhook URL not configured"
**原因**：未配置 FeedoGo API 地址  
**解决**：
1. 登录 Shopify 应用后台
2. 进入 Settings
3. 填写 **FeedoGo API Base URL**: `https://shop.feedogocloud.com`

### Q3: 订单推送成功但爱心币没增加
**原因**：FeedoGo API 可能不支持 `/api/user/addScore` 接口  
**解决**：
1. 查看日志中的 `responseData` 字段
2. 联系 FeedoGo 团队确认积分添加接口
3. 可能需要使用不同的 API 端点

### Q4: 想重新推送某个订单
**解决**：
```bash
# 手动触发 webhook（需要订单数据）
curl -X POST https://shopifyapp.xmasforest.com/api/webhooks/order-auto-register \
  -H "Content-Type: application/json" \
  -d '{
    "shopDomain": "feedogostore.myshopify.com",
    "orderId": "5678901234",
    "orderEmail": "customer@example.com",
    "orderName": "#1001",
    "orderData": {
      "total_price": "99.99",
      "currency": "USD",
      "customer": {
        "id": 123,
        "email": "customer@example.com",
        "first_name": "John",
        "last_name": "Doe"
      }
    }
  }'
```

---

## 📊 监控建议

### 定期检查日志
```bash
# 每天检查一次推送统计
curl "https://shopifyapp.xmasforest.com/api/order-logs?shop=feedogostore.myshopify.com" | jq '.stats'
```

**健康指标**：
- 成功率应 > 95%
- 失败率应 < 5%
- pending 应该很快变为 success 或 failed

### 设置告警
如果失败率持续高于 10%，需要排查：
1. FeedoGo API 是否正常
2. 网络连接是否稳定
3. API 配置是否正确

---

## 🔧 需要 FeedoGo 团队配合

当前代码假设 FeedoGo 有以下 API：

### 添加积分接口（需要确认）
```
POST https://shop.feedogocloud.com/api/user/addScore

Headers:
  Content-Type: application/json
  token: {从 emailLogin 获取的 token}

Body:
{
  "user_id": 28,
  "score": 99,
  "reason": "Shopify Order #1001",
  "order_id": "5678901234",
  "order_total": 99.99,
  "currency": "USD",
  "shop": "feedogostore.myshopify.com",
  "timestamp": "2026-02-04T10:30:00Z"
}

Expected Response:
{
  "code": 1,
  "msg": "Score added successfully",
  "data": {
    "newScore": 1299,
    "addedScore": 99
  }
}
```

**如果此接口不存在**，请 FeedoGo 团队：
1. 提供正确的积分添加接口文档
2. 或实现此接口（推荐）

---

## 📞 技术支持

- **GitHub**: https://github.com/Nopassdeve/FeedoBridge
- **邮箱**: nopassdeve@gmail.com
- **日志 API**: https://shopifyapp.xmasforest.com/api/order-logs

现在就可以下单测试了！每次下单后，立即访问日志 API 查看结果。

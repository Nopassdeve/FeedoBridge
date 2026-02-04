# 🧪 订单爱心币兑换测试指南

## ✅ 已完成配置

系统已更新为使用 FeedoGo 的正式 API：

```
POST https://shop.feedogocloud.com/api/user/exchangeLoveCoin
参数：
  - email: 客户邮箱
  - money: 订单金额

返回：
{
  "code": 1,
  "msg": "兑换成功"
}
```

**兑换规则**：订单金额 = 爱心币数量
- 订单 $99.99 → 99.99 爱心币
- 订单 $50.00 → 50.00 爱心币

---

## 🧪 测试步骤

### 1️⃣ 在 Shopify 商店下单

1. 访问您的商店前台：https://feedogostore.myshopify.com
2. 以客户身份登录（使用邮箱）
3. 添加商品到购物车
4. 完成结账并支付

### 2️⃣ 立即查看日志

**下单后 30 秒内，在浏览器打开**：
```
https://shopifyapp.xmasforest.com/api/order-logs?shop=feedogostore.myshopify.com
```

**您会看到**：
```json
{
  "logs": [
    {
      "shopifyOrderId": "5678901234",
      "status": "success",  // ✅ 成功
      "createdAt": "2026-02-04T10:30:00Z",
      "responseData": {
        "code": 1,
        "msg": "兑换成功"
      }
    }
  ],
  "stats": {
    "total": 1,
    "success": 1,
    "failed": 0
  }
}
```

**状态说明**：
- ✅ `success`: 爱心币已成功兑换
- ❌ `failed`: 兑换失败，查看 `errorMessage`
- ⏳ `pending`: 正在处理中

### 3️⃣ 验证 FeedoGo 爱心币

1. 登录 FeedoGo：https://feedogocloud.com
2. 查看个人中心的爱心币余额
3. 确认爱心币已增加

---

## 📊 查看服务器详细日志

SSH 登录到 VPS 查看实时日志：

```bash
ssh root@76.13.98.3
cd /var/www/FeedoBridge
pm2 logs feedobridge --lines 100
```

**预期日志输出**：
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

💰 Step 1: Exchange love coins (兑换爱心币)
----------------------------------------
Order Details:
- Order ID: 5678901234
- Customer Email: customer@example.com
- Order Total: 99.99 USD
Exchange Response Code: 1
Exchange Response Message: 兑换成功
✅ Love coins exchanged successfully!

========================================
✅ Order processed successfully!
Order Total: $99.99
Love Coins: 99.99
========================================
```

---

## ❓ 常见问题

### Q1: 日志显示 "兑换成功" 但爱心币没增加？
**排查步骤**：
1. 确认 FeedoGo 账户的邮箱与订单邮箱一致
2. 刷新 FeedoGo 页面重新查看余额
3. 联系 FeedoGo 团队确认 API 是否正常工作

### Q2: 日志显示 "FeedoGo Webhook URL not configured"？
**解决**：
1. 登录 Shopify 应用后台
2. 进入 Settings 页面
3. 填写 **FeedoGo API Base URL**: `https://shop.feedogocloud.com`
4. 点击保存

### Q3: 日志为空，没有任何记录？
**可能原因**：
1. Shopify Webhook 未触发
2. 订单未完成支付
3. 自动注册功能被禁用

**解决**：
1. 检查 Shopify 后台 Settings → Notifications → Webhooks
2. 确认有 `orders/create` webhook 指向您的应用
3. 在应用设置中确保 "Enable Auto Register" 是开启的

### Q4: 想手动重新推送某个订单？
**使用 API 测试工具（Postman）**：

```bash
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

## 📞 技术支持

- **查看日志**: https://shopifyapp.xmasforest.com/api/order-logs?shop=feedogostore.myshopify.com
- **GitHub**: https://github.com/Nopassdeve/FeedoBridge
- **邮箱**: nopassdeve@gmail.com

---

## ✨ 快速测试清单

- [ ] 1. 在 Shopify 下单（使用真实邮箱）
- [ ] 2. 访问日志 API 确认 status = "success"
- [ ] 3. 登录 FeedoGo 验证爱心币已增加
- [ ] 4. 如有问题，查看服务器日志排查

**现在就可以开始测试了！** 🚀

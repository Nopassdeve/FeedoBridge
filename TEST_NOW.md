# 🎯 订单同步快速测试步骤

## 为什么日志为空？

`{"logs":[],"stats":{"total":0,"success":0,"failed":0,"pending":0}}`

**原因**：还没有新订单触发 webhook。系统已经部署好，只需要创建一个测试订单。

---

## ✅ 立即测试（3分钟完成）

### 步骤 1：在 Shopify 商店下单

1. **访问商店前台**：https://feedogostore.myshopify.com
   
2. **以客户身份登录**：
   - 邮箱：`nopassdeve@gmail.com`（或任何已在 FeedoGo 注册的邮箱）
   - 如果没有账户，点击"Create account"注册
   
3. **添加商品到购物车**：
   - 随便选一个商品
   - 点击"Add to cart"
   
4. **结账**：
   - 点击"Checkout"
   - 填写信息（可以使用测试信用卡）
   - 完成支付

### 步骤 2：等待 5-10 秒

订单创建后，Shopify 会自动触发 webhook 到我们的服务器。

### 步骤 3：查看日志

**在浏览器打开**：
```
https://shopifyapp.xmasforest.com/api/order-logs?shop=feedogostore.myshopify.com
```

**现在应该能看到**：
```json
{
  "logs": [
    {
      "id": "xxx",
      "shopifyOrderId": "9999999999",
      "status": "success",
      "createdAt": "2026-02-04T...",
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

### 步骤 4：验证 FeedoGo 爱心币

1. 登录 https://feedogocloud.com
2. 查看个人中心
3. 爱心币应该增加了！

---

## 🔧 如果还是没有日志

### 检查 Webhook 是否注册

1. 登录 Shopify 后台：https://feedogostore.myshopify.com/admin
2. 进入 Settings → Notifications → Webhooks
3. 查看是否有 `orders/create` webhook
4. 确认 URL 是：`https://shopifyapp.xmasforest.com/api/webhooks/orders-create`

### 手动注册 Webhook（如果不存在）

访问这个 URL（在浏览器打开）：
```
https://shopifyapp.xmasforest.com/api/webhooks/register?shop=feedogostore.myshopify.com
```

应该返回：
```json
{
  "success": true,
  "webhooks": [...],
  "message": "Webhooks registered successfully"
}
```

---

## 🧪 使用测试信用卡（Shopify 测试模式）

如果商店在测试模式：

**Visa 测试卡**：
- 卡号：`4242 4242 4242 4242`
- 过期日期：任何未来日期（如 `12/28`）
- CVV：任何 3 位数（如 `123`）
- 姓名：任何名字

**其他测试卡**：
- Mastercard: `5555 5555 5555 4444`
- Amex: `3782 822463 10005`

---

## 📊 查看实时服务器日志

SSH 登录 VPS：
```bash
ssh root@76.13.98.3
cd /var/www/FeedoBridge
pm2 logs feedobridge --lines 50
```

**下单后会看到**：
```
📦 收到订单创建事件: 订单#1001, 金额: 99.99 USD, 客户: nopassdeve@gmail.com
✅ 用户已在 FeedoGo 注册: nopassdeve@gmail.com
💰 同步订单金额到 FeedoGo: nopassdeve@gmail.com - 99.99 USD
FeedoGo 爱心币兑换响应: { code: 1, msg: "兑换成功" }
✅ 订单金额同步成功: 订单#1001
```

---

## ✨ 总结

**当前状态**：
- ✅ 代码已部署
- ✅ Webhook 已配置
- ⏳ 等待测试订单

**下一步**：
1. 在 Shopify 商店下一个测试订单
2. 10 秒后刷新日志 API
3. 验证 FeedoGo 爱心币

**如有问题**：
- 查看服务器日志
- 确认 webhook 已注册
- 确认邮箱在 FeedoGo 有账户

现在就去下单测试吧！🚀

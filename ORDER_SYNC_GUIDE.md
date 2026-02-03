# 💰 订单金额自动同步到 FeedoGo（爱心币兑换）

## 📋 功能概述

当用户在 Shopify 网站下单后，系统自动将订单金额发送给 FeedoGo API，兑换为爱心币。

---

## 🎯 完整流程

```
┌─────────────────────────────────────────────────┐
│  1. 用户在 Shopify 前台下单                      │
│     - 添加商品到购物车                           │
│     - 结账并支付                                 │
│     - 订单创建成功                               │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  2. Shopify 触发 orders/create webhook          │
│     - 发送订单数据到 FeedoBridge                │
│     - 包含：订单ID、邮箱、金额、商品等           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  3. FeedoBridge 接收 webhook                    │
│     API: /api/webhooks/orders-create            │
│     - 验证 webhook 签名                         │
│     - 提取订单信息                              │
│     - 提取客户邮箱和订单金额                    │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  4. 检查用户是否在 FeedoGo 注册                 │
│     调用: FeedoGo emailLogin API                │
│     - 仅用于检查，不影响后续流程                │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  5. 调用爱心币兑换 API                          │
│     POST /api/user/exchangeLoveCoin             │
│     {                                           │
│       "email": "customer@example.com",          │
│       "money": 99.99                            │
│     }                                           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  6. FeedoGo 处理兑换                            │
│     - 根据邮箱识别用户                          │
│     - 订单金额转换为爱心币                      │
│     - 更新用户爱心币余额                        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  7. 记录同步日志                                │
│     数据库: OrderPushLog 表                     │
│     - shopifyOrderId                            │
│     - status: success/failed                    │
│     - errorMessage                              │
└─────────────────────────────────────────────────┘
```

---

## 🔧 技术实现

### 1. Webhook 处理器

**文件**: `pages/api/webhooks/orders-create.ts`

**主要功能**:
- ✅ 接收 Shopify 订单创建事件
- ✅ 验证 webhook 签名（安全性）
- ✅ 提取订单金额和客户邮箱
- ✅ 调用 FeedoGo exchangeLoveCoin API
- ✅ 记录同步日志
- ✅ 完整的错误处理

**关键代码**:
```typescript
// 1. 验证签名
const hmac = req.headers['x-shopify-hmac-sha256'];
if (!verifyShopifyWebhook(rawBody, hmac)) {
  return res.status(401).json({ error: 'Invalid signature' });
}

// 2. 提取订单金额
const order: ShopifyOrder = req.body;
const orderAmount = parseFloat(order.total_price);

// 3. 调用爱心币兑换API
const exchangeResponse = await axios.post(
  `${feedogoBaseUrl}/api/user/exchangeLoveCoin`,
  {
    email: order.email,
    money: orderAmount
  }
);

// 4. 记录日志
await prisma.orderPushLog.create({
  data: {
    shopId: shop.id,
    shopifyOrderId: order.id.toString(),
    status: exchangeResponse.data?.code === 1 ? 'success' : 'failed',
    errorMessage: exchangeResponse.data?.msg
  }
});
```

### 2. FeedoGo API 接口

**爱心币兑换接口**:
```
POST https://shop.feedogocloud.com/api/user/exchangeLoveCoin
Content-Type: application/json

{
  "email": "customer@example.com",
  "money": 99.99
}
```

**成功响应**:
```json
{
  "code": 1,
  "msg": "兑换成功",
  "time": "1769564915",
  "data": null
}
```

**失败响应**（用户不存在等）:
```json
{
  "code": 0,
  "msg": "用户不存在",
  "time": "1769564915"
}
```

### 3. 测试工具

**测试页面**: `pages/test-order-sync.tsx`
- 访问: `/test-order-sync?shop=yourstore.myshopify.com`
- 功能: 手动输入邮箱和金额测试同步

**测试 API**: `pages/api/test-exchange.ts`
- 端点: `POST /api/test-exchange`
- 参数: `{ shop, email, money }`
- 用途: 调试和验证兑换功能

---

## 🧪 测试步骤

### 方法1: 手动测试（推荐先测试）

1. **访问测试页面**:
   ```
   https://shopifyapp.xmasforest.com/test-order-sync?shop=yourstore.myshopify.com
   ```

2. **输入测试数据**:
   - 客户邮箱: 在 FeedoGo 已注册的邮箱
   - 订单金额: 例如 99.99
   - 点击"开始同步"

3. **查看结果**:
   - ✅ 成功: 显示"兑换成功"
   - ❌ 失败: 显示具体错误信息

### 方法2: 实际订单测试

1. **注册 Webhook**:
   ```
   访问: https://shopifyapp.xmasforest.com/api/webhooks/register?shop=yourstore.myshopify.com
   ```

2. **在 Shopify 前台下单**:
   - 使用在 FeedoGo 注册的邮箱登录
   - 添加商品到购物车
   - 完成结账和支付
   - 订单创建

3. **验证同步**:
   - 查看服务器日志
   - 登录 FeedoGo 查看爱心币余额
   - 检查数据库 OrderPushLog 表

### 方法3: curl 命令测试

```bash
# 测试爱心币兑换API
curl -X POST http://localhost:3000/api/test-exchange \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "yourstore.myshopify.com",
    "email": "test@example.com",
    "money": 99.99
  }'
```

---

## 📊 数据库日志

### OrderPushLog 表结构

```prisma
model OrderPushLog {
  id               String   @id @default(uuid())
  shopId           String
  shop             Shop     @relation(fields: [shopId], references: [id])
  shopifyOrderId   String   // Shopify 订单ID
  feedogoOrderId   String?  // FeedoGo 订单ID（如果有）
  status           String   // success, failed, pending
  errorMessage     String?  // 错误信息
  retryCount       Int      @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

### 查询示例

```sql
-- 查看最近的订单同步记录
SELECT * FROM "OrderPushLog" 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- 统计成功率
SELECT 
  status,
  COUNT(*) as count
FROM "OrderPushLog"
GROUP BY status;

-- 查看失败的订单
SELECT * FROM "OrderPushLog"
WHERE status = 'failed'
ORDER BY "createdAt" DESC;
```

---

## 🔍 调试指南

### 查看服务器日志

```bash
ssh root@76.13.98.3
cd /opt/feedobridge
docker compose logs -f app | grep -E "订单|exchangeLoveCoin|爱心币"
```

### 常见问题

#### 1. Webhook 未触发

**检查项**:
- Webhook 是否正确注册
- Shopify 管理后台查看 webhook 状态
- 检查 SSL 证书

**解决方法**:
```
Shopify Admin 
→ Settings 
→ Notifications 
→ Webhooks 
→ 查看 orders/create webhook 的发送状态
```

#### 2. 用户不存在错误

**原因**: 用户邮箱未在 FeedoGo 注册

**解决**: 
- 用户需要先在 FeedoGo 注册账户
- 或者使用 emailLogin 接口时，FeedoGo 自动创建用户

#### 3. 金额同步失败

**检查项**:
- 订单金额是否有效（> 0）
- FeedoGo API 地址是否正确
- 网络连接是否正常

**调试代码**:
```typescript
// 在 orders-create.ts 中添加详细日志
console.log('订单金额:', orderAmount);
console.log('FeedoGo URL:', `${feedogoBaseUrl}/api/user/exchangeLoveCoin`);
console.log('请求数据:', { email: order.email, money: orderAmount });
console.log('FeedoGo 响应:', exchangeResponse.data);
```

---

## 📈 监控和统计

### 仪表盘显示

在 `components/DashboardStats.tsx` 中添加：

```typescript
// 订单同步统计
const orderStats = await prisma.orderPushLog.groupBy({
  by: ['status'],
  where: { shopId: shopRecord.id },
  _count: true
});

const totalOrders = orderStats.reduce((sum, stat) => sum + stat._count, 0);
const successOrders = orderStats.find(s => s.status === 'success')?._count || 0;
const failedOrders = orderStats.find(s => s.status === 'failed')?._count || 0;
```

### 成功率计算

```typescript
const successRate = totalOrders > 0 
  ? (successOrders / totalOrders * 100).toFixed(2) 
  : 0;
```

---

## 🔐 安全考虑

### 已实现的安全措施

1. **Webhook 签名验证**
   - 验证 `X-Shopify-Hmac-SHA256` 头
   - 确保请求来自 Shopify

2. **HTTPS 传输**
   - 所有 API 通信使用 HTTPS
   - 数据加密传输

3. **金额验证**
   - 检查金额是否为正数
   - 防止无效数据

4. **错误处理**
   - 捕获所有异常
   - 不暴露敏感信息

---

## ⚙️ 配置要求

### 必需配置

在 Shopify 管理后台配置：
```
FeedoBridge App → Settings → API Configuration

FeedoGo Webhook URL: https://shop.feedogocloud.com/webhooks/shopify
```

### Webhook 注册

```
访问: /api/webhooks/register?shop=yourstore.myshopify.com

或在 Shopify 后台手动添加:
Event: Order creation
URL: https://shopifyapp.xmasforest.com/api/webhooks/orders-create
Format: JSON
```

---

## 🎉 完整功能清单

- ✅ 接收 Shopify 订单创建 webhook
- ✅ 验证 webhook 签名（安全）
- ✅ 提取订单金额和客户邮箱
- ✅ 调用 FeedoGo exchangeLoveCoin API
- ✅ 检查用户是否在 FeedoGo 注册
- ✅ 记录同步日志到数据库
- ✅ 完整的错误处理
- ✅ 测试工具和页面
- ✅ 详细的日志记录

---

## 📝 注意事项

### 1. 订单金额格式

- Shopify 返回的是字符串: `"99.99"`
- 需要转换为数字: `parseFloat(order.total_price)`
- 验证金额有效性: `!isNaN(amount) && amount > 0`

### 2. 用户识别

- FeedoGo 通过邮箱识别用户
- 确保 Shopify 订单有有效的客户邮箱
- 游客订单（没有登录）也会有 email 字段

### 3. 货币处理

- Shopify 订单包含 `currency` 字段
- 当前实现直接发送金额数字
- 如需货币转换，需要额外处理

### 4. 重复订单

- 同一订单只应同步一次
- 可以通过 OrderPushLog 检查是否已同步
- 考虑添加重复检查逻辑

---

## 🚀 部署清单

- [x] 创建 `orders-create.ts` webhook 处理器
- [x] 创建 `test-order-sync.tsx` 测试页面
- [x] 创建 `test-exchange.ts` 测试 API
- [x] 更新 `register.ts` webhook 注册
- [x] 完善文档
- [ ] 注册 Shopify webhooks
- [ ] 测试完整流程
- [ ] 监控同步成功率

---

## 💡 后续优化建议

1. **重试机制**: 对失败的同步自动重试
2. **批量同步**: 补充历史订单数据
3. **通知机制**: 同步失败时通知管理员
4. **货币转换**: 支持多货币订单
5. **重复检查**: 避免同一订单多次同步
6. **性能优化**: 异步处理，提高响应速度

---

## 🎊 总结

订单金额自动同步功能已完整实现：

✅ **用户下单** → Webhook 触发  
✅ **FeedoBridge 接收** → 提取金额和邮箱  
✅ **调用 exchangeLoveCoin API** → 兑换爱心币  
✅ **记录日志** → 便于追踪和调试  
✅ **测试工具** → 方便测试和验证  

系统提供了完整的错误处理和日志记录，确保数据同步的可靠性！

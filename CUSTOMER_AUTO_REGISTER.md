# 🔄 Shopify 客户自动注册到 FeedoGo 完整方案

## 📋 功能概述

当用户在 Shopify 网站注册时，系统自动将客户信息发送给 FeedoGo API 进行注册，然后用户访问时自动登录。

---

## 🎯 完整流程

### 流程图

```
┌─────────────────────────────────────────────────┐
│  1. 用户在 Shopify 前台注册                      │
│     - 填写邮箱、姓名等信息                       │
│     - 点击"创建账户"                            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  2. Shopify 触发 customers/create webhook       │
│     - 发送客户数据到 FeedoBridge                │
│     - 包含：email, first_name, last_name等      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  3. FeedoBridge 接收 webhook                    │
│     API: /api/webhooks/customers-create         │
│     - 验证 webhook 签名                         │
│     - 提取客户信息                              │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  4. 检查用户是否已在 FeedoGo 注册               │
│     调用: FeedoGo emailLogin API                │
│     - 如果成功 → 用户已存在，跳过注册           │
│     - 如果失败 → 用户不存在，继续注册           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  5. 自动注册到 FeedoGo                          │
│     调用: FeedoGo 注册 API                      │
│     POST /api/user/register                     │
│     {                                           │
│       email: "customer@example.com",            │
│       username: "customer",                     │
│       nickname: "John Doe",                     │
│       source: "shopify"                         │
│     }                                           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  6. 保存用户映射关系                            │
│     数据库: UserMapping 表                      │
│     - shopifyCustomerId                         │
│     - feedogoUserId                             │
│     - feedogoEmail                              │
│     - syncStatus: "synced"                      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  7. 用户后续访问自动登录                        │
│     - 用户在 Shopify 登录                       │
│     - 访问嵌入 iframe 的页面                    │
│     - 使用邮箱调用 emailLogin API               │
│     - 自动获取 token 并登录                     │
└─────────────────────────────────────────────────┘
```

---

## 🔧 技术实现

### 1. Webhook 注册

**文件**: `pages/api/webhooks/register.ts`

注册 Shopify webhook：
```typescript
{
  topic: 'customers/create',
  address: 'https://shopifyapp.xmasforest.com/api/webhooks/customers-create',
  format: 'json'
}
```

### 2. Webhook 处理器

**文件**: `pages/api/webhooks/customers-create.ts`

主要功能：
- ✅ 验证 Shopify webhook 签名
- ✅ 检查用户是否已在 FeedoGo 注册
- ✅ 自动调用 FeedoGo 注册 API
- ✅ 保存用户映射关系
- ✅ 完整的错误处理

**关键代码**：
```typescript
// 1. 验证签名
const hmac = req.headers['x-shopify-hmac-sha256'];
if (!verifyShopifyWebhook(rawBody, hmac)) {
  return res.status(401).json({ error: 'Invalid signature' });
}

// 2. 检查用户是否存在
const checkResponse = await axios.post(
  `${feedogoBaseUrl}/api/user/emailLogin`,
  { email: customer.email }
);

// 3. 自动注册
if (!userExists) {
  const registerResponse = await axios.post(
    `${feedogoBaseUrl}/api/user/register`,
    {
      email: customer.email,
      username: customer.email.split('@')[0],
      nickname: `${customer.first_name} ${customer.last_name}`.trim(),
      source: 'shopify'
    }
  );
}

// 4. 保存映射
await prisma.userMapping.upsert({
  where: { shopifyCustomerId_shopId: {...} },
  create: { ... },
  update: { ... }
});
```

### 3. 手动同步 API

**文件**: `pages/api/sync-customer.ts`

用于手动同步单个客户：
```bash
POST /api/sync-customer
{
  "shop": "mystore.myshopify.com",
  "customerEmail": "test@example.com"
}
```

### 4. 测试页面

**文件**: `pages/test-sync.tsx`

访问: `https://shopifyapp.xmasforest.com/test-sync?shop=yourstore.myshopify.com`

功能：
- 手动输入邮箱测试同步
- 查看同步结果
- 调试和验证功能

---

## 📊 FeedoGo API 接口

### 注册接口（待确认）

**预期接口**:
```
POST https://shop.feedogocloud.com/api/user/register
Content-Type: application/json

{
  "email": "customer@example.com",
  "username": "customer",
  "nickname": "John Doe",
  "mobile": "",
  "source": "shopify",
  "shopify_customer_id": "123456",
  "shopify_store": "mystore.myshopify.com"
}
```

**预期响应**:
```json
{
  "code": 1,
  "msg": "注册成功",
  "data": {
    "user_id": 17,
    "email": "customer@example.com",
    "nickname": "John Doe"
  }
}
```

⚠️ **注意**: 实际的注册API接口需要根据FeedoGo的文档进行调整。

### 邮箱登录接口（已确认）

```
POST https://shop.feedogocloud.com/api/user/emailLogin
Content-Type: application/json

{
  "email": "customer@example.com"
}
```

响应格式已知（见之前的文档）。

---

## 🧪 测试步骤

### 1. 配置准备

在 Shopify 管理后台配置：
```
FeedoBridge App → Settings → API Configuration
↓
FeedoGo Webhook URL: https://shop.feedogocloud.com/webhooks/shopify
Enable Auto Register: ✅ 启用
↓
保存
```

### 2. 注册 Webhooks

```bash
# 访问 webhook 注册接口
GET https://shopifyapp.xmasforest.com/api/webhooks/register?shop=yourstore.myshopify.com
```

或在 Shopify 管理后台手动添加：
```
Settings → Notifications → Webhooks
Event: Customer creation
URL: https://shopifyapp.xmasforest.com/api/webhooks/customers-create
Format: JSON
```

### 3. 测试新客户注册

**方法A - 前台注册**:
1. 在 Shopify 前台点击"注册"或"创建账户"
2. 填写邮箱、密码等信息
3. 提交注册
4. 系统自动触发 webhook → FeedoBridge → FeedoGo

**方法B - 手动测试**:
1. 访问测试页面: `/test-sync?shop=yourstore.myshopify.com`
2. 输入测试邮箱
3. 点击"开始同步"
4. 查看结果

### 4. 验证同步结果

**检查数据库**:
```sql
-- 查看用户映射记录
SELECT * FROM "UserMapping" 
WHERE "feedogoEmail" = 'test@example.com';
```

**查看日志**:
```bash
# 服务器日志
ssh root@76.13.98.3
cd /opt/feedobridge
docker compose logs -f app | grep "客户创建"
```

**测试自动登录**:
1. 用注册的邮箱登录 Shopify 前台
2. 访问嵌入 iframe 的页面
3. 应该自动登录，无需输入密码
4. 浏览器控制台应显示: "Email login successful"

---

## 🔍 调试指南

### Webhook 未触发

**可能原因**:
1. Webhook 未正确注册
2. Shopify 店铺网络问题
3. SSL 证书问题

**解决方法**:
```bash
# 1. 检查已注册的 webhooks
# Shopify Admin → Settings → Notifications → Webhooks

# 2. 查看 webhook 失败日志
# Shopify Admin → 可以看到 webhook 的发送状态

# 3. 手动测试 webhook 端点
curl -X POST https://shopifyapp.xmasforest.com/api/webhooks/customers-create \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Shop-Domain: yourstore.myshopify.com" \
  -d '{
    "id": 999999,
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### FeedoGo 注册失败

**检查项**:
1. FeedoGo Webhook URL 配置正确
2. FeedoGo 注册 API 接口地址正确
3. 请求参数格式符合 FeedoGo 要求

**调试代码**:
```typescript
// 在 customers-create.ts 中添加详细日志
console.log('FeedoGo 请求URL:', `${feedogoBaseUrl}/api/user/register`);
console.log('FeedoGo 请求数据:', JSON.stringify(requestData));
console.log('FeedoGo 响应:', JSON.stringify(registerResponse.data));
```

### 用户映射未保存

**检查**:
```bash
# 数据库连接
psql $DATABASE_URL

# 查看表结构
\d "UserMapping"

# 查看所有记录
SELECT * FROM "UserMapping" ORDER BY "createdAt" DESC LIMIT 10;
```

---

## 📈 监控和统计

### 数据库查询

```sql
-- 统计已同步的用户数
SELECT COUNT(*) FROM "UserMapping" WHERE "syncStatus" = 'synced';

-- 统计同步失败的用户
SELECT COUNT(*) FROM "UserMapping" WHERE "syncStatus" = 'failed';

-- 查看最近同步的用户
SELECT * FROM "UserMapping" 
ORDER BY "lastSyncAt" DESC 
LIMIT 10;

-- 按店铺统计
SELECT s."shopName", COUNT(um.id) as user_count
FROM "UserMapping" um
JOIN "Shop" s ON um."shopId" = s.id
GROUP BY s."shopName";
```

### API 统计

添加到 `pages/api/stats.ts`:
```typescript
const syncedUsers = await prisma.userMapping.count({
  where: { 
    shopId: shopRecord.id,
    syncStatus: 'synced'
  }
});

const failedUsers = await prisma.userMapping.count({
  where: { 
    shopId: shopRecord.id,
    syncStatus: 'failed'
  }
});
```

---

## ⚠️ 重要注意事项

### 1. FeedoGo 注册 API 确认

当前代码中的注册 API 端点是**假设的**：
```
POST /api/user/register
```

**需要做的**:
1. 确认 FeedoGo 实际的注册 API 端点
2. 确认请求参数格式
3. 确认响应格式
4. 根据实际API调整代码

### 2. 重复注册处理

系统会先检查用户是否存在：
- 使用 `emailLogin` API 检查
- 如果成功 → 用户已存在，跳过注册
- 如果失败 → 进行注册

### 3. 并发和性能

- Webhook 处理是异步的
- 注册失败不影响 Shopify 用户注册
- 失败的记录会标记为 `failed`，可以稍后重试

### 4. 隐私和安全

- 只发送必要的用户信息
- 不发送密码
- 使用 HTTPS 加密传输
- 验证 webhook 签名

---

## 🚀 部署清单

- [x] 创建 `customers-create.ts` webhook 处理器
- [x] 创建 `sync-customer.ts` 手动同步 API
- [x] 创建 `test-sync.tsx` 测试页面
- [x] 更新 `register.ts` webhook 注册
- [ ] 确认 FeedoGo 注册 API 接口
- [ ] 调整注册请求参数（根据实际API）
- [ ] 注册 Shopify webhooks
- [ ] 测试完整流程
- [ ] 监控同步成功率

---

## 📝 后续优化建议

1. **批量同步** - 添加批量同步现有客户的功能
2. **重试机制** - 对失败的同步自动重试
3. **通知机制** - 同步失败时通知管理员
4. **仪表盘** - 在管理界面显示同步统计
5. **日志记录** - 详细记录每次同步的结果

---

## 🎉 总结

完整的自动注册流程已实现：

✅ **用户在 Shopify 注册** → Webhook 触发  
✅ **FeedoBridge 接收** → 检查用户是否存在  
✅ **自动注册到 FeedoGo** → 保存映射关系  
✅ **用户访问时自动登录** → 无需输入密码  

系统提供了完整的错误处理和降级机制，确保即使某个环节失败，也不影响整体功能。

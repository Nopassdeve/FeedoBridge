# Shopify 插件技术分析与开发方案

## 项目概述
开发一个 Shopify App，实现跨网站整合、订单处理、账户管理和单点登录功能。

---

## 需求分析

| 功能模块 | 优先级 | 复杂度 |
|---------|------|------|
| 内嵌网站模块 | P0 | ⭐⭐⭐ |
| 订单自动推送 | P0 | ⭐⭐ |
| 感谢页面弹窗 | P1 | ⭐⭐ |
| 自动账户注册 | P0 | ⭐⭐⭐ |
| 单点登录 (SSO) | P0 | ⭐⭐⭐⭐ |

---

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    Shopify Store                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  App Frontend (React/Vue)                           │  │
│  │  - Embedded App Block                               │  │
│  │  - Thank You Page Extension                         │  │
│  │  - Post-Purchase UI                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Shopify App Backend (Node.js/Next.js)             │  │
│  │  - OAuth & Session Management                       │  │
│  │  - Webhook Handlers                                 │  │
│  │  - Database (Admin API data sync)                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ↓ (REST/GraphQL API)
┌─────────────────────────────────────────────────────────────┐
│              FeedoGo Cloud 系统                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Web App (前端嵌入目标)                             │  │
│  │  - SSO 端点                                         │  │
│  │  - iframe 内容页面                                 │  │
│  │  - 用户管理                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API 服务                                           │  │
│  │  - 订单接收                                         │  │
│  │  - 用户注册                                         │  │
│  │  - 密码重置                                         │  │
│  │  - SSO 验证                                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  数据库                                             │  │
│  │  - 用户表                                           │  │
│  │  - Shopify 用户映射表                              │  │
│  │  - 订单日志                                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 功能模块详细设计

### 1️⃣ 内嵌网站模块 (嵌入 FeedoGo 云)

**实现方式：**
- **方案A - Shopify App Embed** ✅ 推荐
  - 使用 Shopify App Extensions (Embedded App)
  - 支持在 Product Page、Collection Page 等位置嵌入
  - 官方安全、支持跨域 iframe

- **方案B - Liquid 脚本注入**
  - 通过 ScriptTag API 注入脚本
  - 局限：跨域问题复杂，需要处理 CORS

**推荐技术栈：**
```
前端: React + TypeScript
    - @shopify/react-compose
    - @shopify/polaris (UI)
    - Axios/Fetch for API calls

通信: PostMessage API (iframe 通信)
    - 安全的跨域通信
    - 支持 SSO Token 传递

内嵌方式:
- iframe 沙箱隔离
- 自定义配置（链接、颜色、内容等）
- 响应式设计
```

**关键代码框架：**
```javascript
// Shopify App Block 内嵌组件
interface EmbeddedConfigProps {
  feedogoUrl: string;      // https://feedogocloud.com
  customLink?: string;     // 自定义链接
  token?: string;          // SSO Token
}

// iframe 与 FeedoGo 通信协议
{
  type: 'SSO_LOGIN',
  payload: {
    shopifyUserId: string,
    token: string,
    userData: { email, name }
  }
}
```

**符合 Shopify 规则的要点：**
- ✅ 使用官方 Embedded App 框架
- ✅ 获取必要的 Shopify scopes (read_orders, write_customers)
- ✅ GDPR 合规（用户数据处理）
- ✅ 安全的身份验证（OAuth 2.0）

---

### 2️⃣ 订单自动推送模块

**实现流程：**

```
订单事件流
  ↓
订单创建 → Shopify Webhook (orders/create)
  ↓
App Backend 接收
  ↓
构建订单数据
  ↓
调用 FeedoGo API (POST /api/orders)
  ↓
记录日志 + 错误重试
```

**技术实现：**

```javascript
// Webhook 注册 (App Backend)
POST /admin/api/2024-01/webhooks.json
{
  "webhook": {
    "topic": "orders/create",
    "address": "https://your-app.com/webhooks/order-created",
    "format": "json"
  }
}

// Webhook 处理器
POST /webhooks/order-created
Content-Type: application/json
X-Shopify-Hmac-SHA256: <验证签名>

// 调用 FeedoGo API
POST https://feedogocloud.com/api/v1/orders
Authorization: Bearer <API_KEY>
{
  "shopifyOrderId": "123456",
  "orderId": order.id,
  "customerEmail": order.customer.email,
  "customerName": order.customer.first_name,
  "orderTotal": order.total_price,
  "items": [...],
  "timestamp": new Date().toISOString()
}
```

**错误处理与重试：**
- Dead Letter Queue (DLQ) 处理失败订单
- 指数退避重试机制（3秒、9秒、27秒）
- 异步处理保证 Webhook 响应速度 < 5s

---

### 3️⃣ 感谢页面弹窗模块

**实现方式：**

```
Shopify Post-Purchase Extension
  ↓
订单完成后自动触发
  ↓
显示可配置的弹窗
  ↓
收集用户交互数据
```

**弹窗配置项：**
```json
{
  "enabled": true,
  "title": "欢迎加入我们",
  "description": "感谢您的购买",
  "buttonText": "立即探索",
  "buttonLink": "https://feedogocloud.com",
  "backgroundColor": "#ffffff",
  "textColor": "#000000",
  "showDelay": 1000  // ms
}
```

**技术实现：**
```javascript
// Shopify Post-Purchase Extension (React Native Web)
export function PostPurchaseExtension() {
  const { done } = useExtensionApi();

  return (
    <Modal>
      <Heading>{config.title}</Heading>
      <Text>{config.description}</Text>
      <Button
        onPress={() => window.location.href = config.buttonLink}
      >
        {config.buttonText}
      </Button>
    </Modal>
  );
}
```

**数据收集：**
- 点击率统计
- 弹窗显示次数
- 用户交互事件

---

### 4️⃣ 自动账户注册模块

**实现流程：**

```
订单完成
  ↓
检查客户邮箱是否在 FeedoGo 已注册
  ↓
未注册 → 自动创建账户
  ↓
生成临时密码 / 发送密码重置链接
  ↓
发送邮件到订单邮箱
```

**API 调用序列：**

```javascript
// 步骤1: 检查用户存在
GET https://feedogocloud.com/api/v1/users/check
Query: { email: order.customer.email }

// 步骤2: 自动注册
POST https://feedogocloud.com/api/v1/users/register
{
  "email": "customer@example.com",
  "firstName": "张",
  "lastName": "三",
  "source": "shopify",
  "shopifyCustomerId": "gid://shopify/Customer/123",
  "autoRegister": true
}

// 步骤3: 发送密码重置链接
POST https://feedogocloud.com/api/v1/password-reset
{
  "email": "customer@example.com",
  "redirectUrl": "https://feedogocloud.com/reset-password"
}
```

**安全考虑：**
- API Key 存储在环境变量
- 请求需要签名验证（HMAC-SHA256）
- 邮件链接有效期：24小时
- 重置密码需要验证旧邮箱

---

### 5️⃣ 单点登录 (SSO) 模块 ⭐ 核心复杂功能

**需求分析：**
```
场景1: Shopify 用户 → 点击内嵌链接 → 自动登录 FeedoGo
场景2: FeedoGo 已登录用户 → 打开 Shopify 店铺 → 信息同步
场景3: 跨浏览器标签页 → 登录状态同步
```

**SSO 实现方案 - OAuth 2.0 + JWT**

```
┌──────────────┐
│ Shopify Store │
└──────────────┘
       ↓
    点击内嵌区域
       ↓
┌────────────────────────────────────────┐
│ App Frontend                           │
│ 1. 获取 Shopify Customer ID (via API) │
│ 2. 生成签名的 SSO 请求                 │
│ 3. 重定向到 FeedoGo SSO 端点           │
└────────────────────────────────────────┘
       ↓
POST https://feedogocloud.com/api/v1/sso/shopify
{
  "action": "LOGIN",
  "timestamp": 1704902400,
  "shopifyStoreId": "store123.myshopify.com",
  "customerId": "gid://shopify/Customer/123",
  "customerEmail": "user@example.com",
  "hmac": "签名"
}
       ↓
┌────────────────────────────────────────┐
│ FeedoGo SSO Handler                    │
│ 1. 验证 HMAC 签名                      │
│ 2. 检查用户存在/创建                   │
│ 3. 生成 JWT Token                      │
│ 4. 设置 HttpOnly Cookie                │
│ 5. 重定向回 iframe                     │
└────────────────────────────────────────┘
       ↓
PostMessage 事件
{
  type: 'SSO_SUCCESS',
  token: 'jwt_token'
}
       ↓
FeedoGo 嵌入页面登录状态激活
```

**关键代码实现：**

```javascript
// ===== Shopify App Backend =====
import crypto from 'crypto';

function generateSSOSignature(data, secret) {
  const message = JSON.stringify(data);
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
}

// ===== Shopify App Frontend (React) =====
async function initiateSSOLogin() {
  const customerData = {
    timestamp: Math.floor(Date.now() / 1000),
    shopifyStoreId: shop, // from Shopify context
    customerId: customer.id,
    customerEmail: customer.email,
    action: 'LOGIN'
  };

  // 后端生成签名
  const { hmac } = await fetch('/api/sso/generate-signature', {
    method: 'POST',
    body: JSON.stringify(customerData)
  }).then(r => r.json());

  // 构建 SSO URL
  const ssoUrl = new URL('https://feedogocloud.com/api/v1/sso/shopify');
  ssoUrl.searchParams.append('data', JSON.stringify({
    ...customerData,
    hmac
  }));

  // iframe 中加载 SSO
  window.location.hash = `#sso-redirect:${ssoUrl}`;
}

// ===== FeedoGo 后端 (Node.js/Express) =====
app.post('/api/v1/sso/shopify', async (req, res) => {
  const { data, hmac } = req.body;

  // 验证签名
  const calculatedHmac = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(JSON.stringify(data))
    .digest('hex');

  if (calculatedHmac !== hmac) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 验证时间戳（防止重放攻击）
  if (Math.abs(Date.now() / 1000 - data.timestamp) > 300) {
    return res.status(401).json({ error: 'Request expired' });
  }

  // 查找或创建用户
  let user = await User.findOne({ email: data.customerEmail });
  if (!user) {
    user = await User.create({
      email: data.customerEmail,
      shopifyCustomerId: data.customerId,
      shopifyStore: data.shopifyStoreId,
      source: 'shopify'
    });
  }

  // 生成 JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // 设置 HttpOnly Cookie
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  // 返回重定向 + 前端通知
  res.json({
    success: true,
    redirectUrl: 'https://feedogocloud.com/dashboard',
    token
  });
});

// ===== 跨标签页同步 (Service Worker) =====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
  
  // 监听消息
  navigator.serviceWorker.onmessage = (event) => {
    if (event.data.type === 'LOGIN_SYNC') {
      // 更新当前标签页登录状态
      localStorage.setItem('sso_token', event.data.token);
      window.location.reload();
    }
  };
}
```

**Session 管理策略：**
| 存储位置 | 用途 | 安全性 |
|---------|------|------|
| HttpOnly Cookie | 主认证 | ⭐⭐⭐⭐⭐ |
| localStorage | 前端状态标志 | ⭐⭐ |
| SessionStorage | 临时数据 | ⭐⭐⭐ |

---

## 技术栈推荐

### 后端 (Shopify App Server)
```
Node.js + TypeScript
├── Framework: Next.js (App Router) / Express
├── Database: PostgreSQL / MongoDB
├── 任务队列: Bull Queue / RabbitMQ (webhook 处理)
├── 缓存: Redis (Session, 幂等性检查)
├── 认证: Shopify OAuth 2.0
└── 部署: Vercel / Railway / Docker + AWS/GCP
```

### 前端 (Shopify App + Embedded UI)
```
React 18+ TypeScript
├── UI 框架: Shopify Polaris
├── 状态管理: Redux Toolkit / Zustand
├── HTTP: Axios / TanStack Query
├── 类型: GraphQL Codegen
├── 构建: Vite / Next.js
└── 测试: Vitest + React Testing Library
```

### FeedoGo 端变更
```
后端需新增:
├── SSO 验证端点
├── 用户自动注册 API
├── 订单接收 API
├── 密码重置服务
└── CORS 配置（支持 Shopify iframe）

前端需新增:
├── iframe 嵌入支持
├── PostMessage 监听器
├── SSO Token 自动注入
└── 响应式 UI 优化
```

---

## 数据库设计

### Shopify App 数据库

```sql
-- 1. 店铺配置表
CREATE TABLE shops (
  id UUID PRIMARY KEY,
  shopify_shop_id VARCHAR(255) UNIQUE,
  shop_name VARCHAR(255),
  access_token VARCHAR(255),
  api_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Shopify-FeedoGo 用户映射表
CREATE TABLE user_mappings (
  id UUID PRIMARY KEY,
  shop_id UUID REFERENCES shops(id),
  shopify_customer_id VARCHAR(255),
  feedogo_user_id VARCHAR(255),
  feedogo_email VARCHAR(255),
  sync_status VARCHAR(50), -- pending, synced, failed
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(shopify_customer_id, shop_id)
);

-- 3. 订单推送日志
CREATE TABLE order_push_logs (
  id UUID PRIMARY KEY,
  shop_id UUID REFERENCES shops(id),
  shopify_order_id VARCHAR(255),
  feedogo_order_id VARCHAR(255),
  status VARCHAR(50), -- pending, success, failed
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

-- 4. App 配置表
CREATE TABLE app_settings (
  id UUID PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) UNIQUE,
  feedogo_api_key VARCHAR(255),
  feedogo_webhook_url VARCHAR(255),
  enable_auto_register BOOLEAN DEFAULT true,
  thank_you_modal_config JSONB,
  embedded_iframe_url VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### FeedoGo 端数据库新增

```sql
-- 新增字段: users 表
ALTER TABLE users ADD COLUMN (
  shopify_customer_id VARCHAR(255),
  shopify_store_id VARCHAR(255),
  source VARCHAR(50), -- 'shopify', 'direct', etc
  sso_verified_at TIMESTAMP,
  UNIQUE(shopify_customer_id, shopify_store_id)
);

-- 新增表: SSO 日志
CREATE TABLE sso_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  shopify_store_id VARCHAR(255),
  action VARCHAR(50), -- LOGIN, LOGOUT, SYNC
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP
);

-- 新增表: 订单关联
CREATE TABLE shopify_orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  shopify_order_id VARCHAR(255),
  shopify_store_id VARCHAR(255),
  order_data JSONB,
  processed_at TIMESTAMP,
  created_at TIMESTAMP
);
```

---

## API 设计概览

### Shopify App Backend API

| 方法 | 端点 | 说明 |
|-----|------|------|
| POST | `/api/auth/callback` | OAuth 回调 |
| POST | `/webhooks/orders/create` | 订单创建 webhook |
| GET/POST | `/api/settings` | App 配置管理 |
| POST | `/api/sso/generate-signature` | 生成 SSO 签名 |
| POST | `/api/test/push-order` | 测试订单推送 |

### FeedoGo 新增 API

| 方法 | 端点 | 说明 |
|-----|------|------|
| POST | `/api/v1/sso/shopify` | Shopify SSO 验证 |
| POST | `/api/v1/users/register` | 自动注册用户 |
| POST | `/api/v1/orders` | 接收 Shopify 订单 |
| POST | `/api/v1/password-reset` | 发送密码重置 |
| GET | `/api/v1/users/check` | 检查用户存在 |

---

## 开发步骤 & 时间估算

### Phase 1: 项目搭建 (1-2周)
- [ ] 初始化 Shopify App 项目 (Next.js template)
- [ ] 设置开发环境 (ngrok, Shopify CLI)
- [ ] 数据库架构设计 & 迁移脚本
- [ ] Shopify OAuth 流程实现
- [ ] API 文档编写

**时间:** 40-60小时

### Phase 2: 核心功能 (3-4周)
- [ ] 订单 Webhook 集成 (8h)
- [ ] FeedoGo API 集成 (12h)
- [ ] 自动注册 + 邮件发送 (16h)
- [ ] 感谢页面弹窗 (12h)
- [ ] 测试 & Bug 修复 (16h)

**时间:** 64-80小时

### Phase 3: SSO 实现 (2-3周) ⭐ 最复杂
- [ ] 签名验证机制 (8h)
- [ ] JWT 令牌生成 & 验证 (12h)
- [ ] iframe PostMessage 通信 (12h)
- [ ] 跨标签页同步 (12h)
- [ ] 浏览器兼容性测试 (8h)
- [ ] 安全审计 (OWASP Top 10) (8h)

**时间:** 60-80小时

### Phase 4: UI/UX & 管理后台 (1-2周)
- [ ] App 管理页面 (配置链接、弹窗内容等)
- [ ] 仪表板 (订单统计、同步状态)
- [ ] 错误处理 & 重试管理
- [ ] 多语言支持 (英文 + 中文)

**时间:** 32-48小时

### Phase 5: 部署 & 发布 (1周)
- [ ] 环境配置 (开发/预发/生产)
- [ ] 性能优化 & 负载测试
- [ ] Shopify App Store 提交审核
- [ ] 文档 & 用户指南编写
- [ ] 监控 & 告警设置

**时间:** 32-40小时

**总计: 228-308 小时 (约 6-10 周，3-4 人团队)**

---

## 安全考虑清单

### ✅ 必须实现
- [ ] Shopify Webhook 签名验证
- [ ] HMAC-SHA256 请求签名
- [ ] CORS 严格配置
- [ ] SQL 注入防护 (ORM + Parameterized Queries)
- [ ] XSS 防护 (CSP headers)
- [ ] CSRF Token 保护
- [ ] HttpOnly + Secure Cookies
- [ ] 速率限制 (Rate Limiting)
- [ ] API Key 轮换机制
- [ ] 审计日志记录

### ⚠️ 重点关注
- 幂等性: 重复 webhook 不应创建重复订单
- 请求超时: Webhook 响应需 < 5秒
- 数据加密: 敏感字段加密存储
- GDPR 合规: 用户数据删除机制

---

## 风险评估

| 风险 | 概率 | 影响 | 缓解方案 |
|-----|------|------|---------|
| Shopify API 限流 | 中 | 高 | 批量处理、队列机制 |
| iframe 跨域问题 | 高 | 中 | PostMessage、CORS 预检 |
| SSO Token 泄露 | 低 | 极高 | HttpOnly Cookie、HTTPS强制 |
| 订单重复推送 | 中 | 中 | 数据库唯一约束、幂等 Key |
| FeedoGo API 故障 | 中 | 高 | 重试机制、DLQ、告警 |
| 用户数据不同步 | 中 | 中 | 定时对账、日志审计 |

---

## 部署架构

```
┌─────────────────────────────────────────────────┐
│            Shopify App Store (Public)           │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│           Production Environment                │
├─────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐  │
│  │  CDN + Cloudflare                        │  │
│  │  ├─ Static Assets (App Frontend)         │  │
│  │  ├─ DDoS 防护                             │  │
│  │  └─ SSL/TLS                              │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  App Server (Node.js)                   │  │
│  │  ├─ Vercel / Railway / AWS Lambda        │  │
│  │  ├─ Auto-scaling                         │  │
│  │  └─ Error Tracking (Sentry)              │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Database                                │  │
│  │  ├─ PostgreSQL (AWS RDS)                 │  │
│  │  ├─ Backup & Replication                 │  │
│  │  └─ Performance Monitoring                │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Cache Layer (Redis)                     │  │
│  │  ├─ Session Store                        │  │
│  │  ├─ Rate Limit Counter                   │  │
│  │  └─ Webhook Idempotency                  │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Message Queue (Bull Queue)              │  │
│  │  ├─ Async Job Processing                 │  │
│  │  ├─ Webhook Retry                        │  │
│  │  └─ Email Sending                        │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↓
            (REST/GraphQL API)
                      ↓
┌─────────────────────────────────────────────────┐
│        FeedoGo Cloud Production                 │
│        (用户管理、SSO、订单处理)               │
└─────────────────────────────────────────────────┘
```

---

## 监控 & 告警

```yaml
关键指标 (KPI):
  - API 响应时间 (p95 < 500ms)
  - Webhook 成功率 (> 99.5%)
  - SSO 登录成功率 (> 99%)
  - 订单推送延迟 (< 30秒)
  
告警规则:
  - 错误率 > 1%
  - 响应时间 > 1000ms
  - 队列堆积 > 1000 条
  - 数据库连接池 > 80%
  
工具:
  - DataDog / New Relic (APM)
  - Sentry (Error Tracking)
  - PagerDuty (On-Call)
```

---

## 下一步建议

1. **准备开发环境**
   - 安装 Shopify CLI & Node.js 18+
   - 创建 Shopify Partner 账户
   - 申请 API credentials

2. **与 FeedoGo 团队协调**
   - 确认 API 接口规范
   - CORS 跨域配置
   - SSO 密钥管理方案

3. **原型验证**
   - 开发 SSO 原型 (最复杂部分)
   - iframe 嵌入测试
   - 用户流程测试

4. **安全审查**
   - OWASP 代码审计
   - 渗透测试
   - 数据保护审计

---

**文档版本:** v1.0 | 更新时间: 2026-01-22

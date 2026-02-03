# FeedoBridge 插件架构与功能分析

**项目名称**: FeedoBridge  
**开发者**: NopassDev  
**类型**: Shopify App（嵌入式应用）  
**技术栈**: Next.js + React + TypeScript + Prisma + PostgreSQL + Redis  
**部署地址**: https://shopifyapp.xmasforest.com  
**更新日期**: 2026-01-28

---

## 📋 目录
1. [项目概览](#项目概览)
2. [核心功能](#核心功能)
3. [技术架构](#技术架构)
4. [数据库设计](#数据库设计)
5. [API 路由详解](#api-路由详解)
6. [前端组件架构](#前端组件架构)
7. [扩展系统](#扩展系统)
8. [流程工作流](#流程工作流)
9. [配置与部署](#配置与部署)
10. [关键集成点](#关键集成点)

---

## 项目概览

### 一句话描述
FeedoBridge 是一个 Shopify 应用，用于将 Shopify 店铺与 FeedoGo Cloud 平台无缝集成，实现客户自动注册、订单同步、SSO 单点登录、感谢页面定制等功能。

### 核心功能清单
- ✅ **Shopify OAuth2 认证** - 应用安装和授权
- ✅ **嵌入式 iframe 集成** - 在店铺前台加载 FeedoGo 云平台
- ✅ **自动客户注册** - 订单生成时自动在 FeedoGo 注册用户
- ✅ **单点登录 (SSO)** - HMAC 签名验证的安全 SSO 登录
- ✅ **订单同步** - 自动推送 Shopify 订单到 FeedoGo
- ✅ **感谢页面弹窗** - 结账后自定义弹窗（Checkout UI Extension）
- ✅ **数据统计仪表盘** - 展示订单和用户同步状态
- ✅ **灵活配置管理** - Web UI 配置所有集成参数

---

## 核心功能

### 1. Shopify OAuth 认证流程
```
用户 → 安装应用 → Shopify OAuth 授权 → 后端获取 accessToken → 保存店铺数据
```
**相关文件**: [pages/api/auth/callback.ts](pages/api/auth/callback.ts)

- 获取 OAuth code 并交换 access token
- 存储 accessToken 用于后续 Shopify API 调用
- 自动创建或更新 Shop 记录

### 2. 嵌入式 iframe 集成
```
店铺前台 → 加载 FeedoGo iframe → SSO 登录 → 交互
```
**相关文件**: 
- [components/EmbeddedIframe.tsx](components/EmbeddedIframe.tsx)
- [pages/embed.tsx](pages/embed.tsx)
- [extensions/theme-app-extension/blocks/feedobridge-embed.liquid](extensions/theme-app-extension/blocks/feedobridge-embed.liquid)

**功能特性**:
- 响应式设计（PC/移动端自适应）
- SSO 签名生成和验证
- 消息传递（postMessage）支持高度自适应
- 设备类型检测
- 安全的同源策略

### 3. 自动客户注册流程
```
订单创建 → Webhook 触发 → 检查用户是否存在 → 自动注册 → 发送欢迎邮件 → 推送订单
```
**相关文件**: [pages/api/webhooks/order-auto-register.ts](pages/api/webhooks/order-auto-register.ts)

**工作流程**:
1. **用户存在检查** - 调用 FeedoGo API `/api/v1/users/check`
2. **自动注册** - 若用户不存在，调用 `/api/v1/users/register`
3. **欢迎邮件** - 发送密码重置链接（作为欢迎邮件）
4. **订单推送** - 调用 `/api/v1/orders/push` 同步订单
5. **记录映射** - 创建 Shopify 客户 ID 与 FeedoGo 用户 ID 的映射

**API 调用示例**:
```typescript
// 检查用户
GET /api/v1/users/check?email=${orderEmail}
Headers: Authorization: Bearer ${apiKey}

// 注册用户
POST /api/v1/users/register
{
  email: orderEmail,
  firstName, lastName,
  source: 'shopify',
  shopifyOrderId, shopifyStore,
  autoRegister: true
}

// 推送订单
POST /api/v1/orders/push
```

### 4. SSO 单点登录
```
用户在店铺前台 → 访问 iframe → 生成 SSO 签名 → FeedoGo 验证 → 登录成功
```
**相关文件**: 
- [pages/api/sso/generate-signature.ts](pages/api/sso/generate-signature.ts)
- [lib/auth.ts](lib/auth.ts)

**签名生成流程**:
```typescript
// 生成数据包
data = {
  action: 'LOGIN',
  timestamp: 当前时间戳,
  shopifyStoreId: 店铺ID,
  customerId: 客户ID,
  customerEmail: 邮箱
}

// 生成 HMAC-SHA256 签名
hmac = HMAC-SHA256(JSON.stringify(data), SHOPIFY_API_SECRET)

// 返回给前端，iframe 通过 SSO 参数发送到 FeedoGo
```

**参数格式**:
```
sso_data={
  "action":"LOGIN",
  "timestamp":1234567890,
  "shopifyStoreId":"shop.myshopify.com",
  "customerId":"customer123",
  "customerEmail":"customer@example.com",
  "hmac":"abc123..."
}
```

### 5. 感谢页面弹窗 (Checkout UI Extension)
```
顾客完成购物 → 进入 Thank You 页面 → 显示自定义弹窗 → 点击按钮跳转
```
**相关文件**: [extensions/thank-you-modal/src/index.jsx](extensions/thank-you-modal/src/index.jsx)

**功能特性**:
- 扩展点: `purchase.thank-you.block.render`
- 完全可配置的弹窗内容（标题、描述、优惠码）
- 自定义按钮文字和链接
- 实时配置更新（通过管理后台）

### 6. 仪表盘统计
```
查询数据库 → 汇总订单和用户统计 → 计算同步率 → 展示可视化数据
```
**相关文件**: [pages/api/stats.ts](pages/api/stats.ts)

**统计指标**:
- **订单统计**: 总数、已同步、待处理、失败
- **用户统计**: 总用户数、已同步用户数
- **同步率**: 订单同步率、用户同步率
- **最后同步**: 上次成功同步的时间

---

## 技术架构

### 系统架构图
```
┌─────────────────────────────────────────────────────────────┐
│                     Shopify Admin Panel                       │
│                  (FeedoBridge App Installed)                  │
└────────────────────────┬────────────────────────────────────┘
                         │ OAuth 认证 + API 调用
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   FeedoBridge App Server                      │
│                   (Next.js @ Vercel/Node.js)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Pages / API Routes                                   │   │
│  │  ├─ pages/index.tsx (设置管理)                        │   │
│  │  ├─ pages/embed.tsx (嵌入页面)                        │   │
│  │  ├─ pages/api/settings (配置 CRUD)                   │   │
│  │  ├─ pages/api/stats (统计查询)                        │   │
│  │  ├─ pages/api/auth/* (OAuth 流程)                    │   │
│  │  ├─ pages/api/sso/* (SSO 签名)                       │   │
│  │  └─ pages/api/webhooks/* (订单处理)                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Components (React)                                  │   │
│  │  ├─ SettingsPage (主设置页面)                        │   │
│  │  ├─ EmbeddedIframe (iframe 管理)                     │   │
│  │  ├─ DashboardStats (统计仪表盘)                      │   │
│  │  ├─ ThankYouModalSettings (弹窗配置)                │   │
│  │  ├─ ApiSettings (API 配置)                           │   │
│  │  └─ EmbedPreview (预览)                              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Library Functions                                   │   │
│  │  ├─ lib/shopify.ts (请求验证)                        │   │
│  │  ├─ lib/auth.ts (SSO 签名生成)                       │   │
│  │  ├─ lib/prisma.ts (数据库客户端)                     │   │
│  │  └─ lib/redis.ts (缓存)                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                           │
         ├─ PostgreSQL ────────────► 💾 (数据持久化)
         │
         ├─ Redis ─────────────────► 🗄️ (缓存)
         │
         └─ Shopify API ───────────► 📊 (同步 / 验证)
         
         ├─ FeedoGo API ───────────► ☁️ (客户同步 / 订单推送)
         │
         └─ Shopify Webhooks ──────► 🔔 (订单事件)
```

### 技术栈详解
| 层级 | 技术 | 用途 |
|-----|------|------|
| **前端框架** | Next.js 14.1 | SSR + SSG + API Routes |
| **UI 库** | React 18.2 | 组件开发 |
| **UI 组件** | Shopify Polaris | Shopify 原生设计系统 |
| **类型系统** | TypeScript 5.3 | 类型安全 |
| **状态管理** | React Hooks | 局部状态管理 |
| **ORM** | Prisma 5.8 | 数据库管理 |
| **数据库** | PostgreSQL | 主要数据存储 |
| **缓存** | Redis 4.6 | 会话 / 缓存 |
| **API 客户端** | Axios 1.6 | HTTP 请求 |
| **认证** | JWT + HMAC-SHA256 | Token + 签名验证 |
| **密码学** | crypto (Node.js 内置) | 哈希和签名 |
| **打包工具** | Shopify CLI 3.55 | 开发和部署 |

### 部署配置 (shopify.app.toml)
```toml
name = "FeedoBridge"
client_id = "9da46159e4de788dab1f3cc2533551e4"
application_url = "https://shopifyapp.xmasforest.com"
embedded = true  # 嵌入式应用

[access_scopes]
scopes = "read_products,write_products,read_customers,write_customers,read_orders,write_orders"

[webhooks]
api_version = "2024-01"

[extensions]
# 主题应用扩展 - 嵌入块
[[extensions]]
type = "theme"
name = "FeedoBridge Theme Extension"

# 结账 UI 扩展 - 感谢页面
[[extensions]]
type = "checkout_ui_extension"
name = "Thank You Modal"
handle = "thank-you-modal"
```

---

## 数据库设计

### Entity Relationship Diagram (ERD)
```
┌──────────────┐
│    Shop      │ 主体：Shopify 店铺
├──────────────┤
│ id (PK)      │
│ shopifyShopId│ (唯一)
│ shopName     │
│ accessToken  │
│ apiVersion   │
│ createdAt    │
│ updatedAt    │
└──────────────┘
       │
       ├─── 1:1 ──── AppSetting (配置)
       │
       ├─── 1:N ──── UserMapping (用户映射)
       │
       ├─── 1:N ──── OrderPushLog (订单日志)
       │
       └─── 1:N ──── ThankYouModalEvent (弹窗事件)
```

### 表详细设计

#### 1. **Shop** 表 - 店铺记录
存储 Shopify 店铺的基本信息和认证数据。
```typescript
model Shop {
  id               String    @id @default(uuid())  // 主键
  shopifyShopId    String    @unique              // Shopify 店铺 ID
  shopName         String                         // 店铺名称
  accessToken      String                         // OAuth access token
  apiVersion       String    @default("2024-01")  // API 版本
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  // 关系
  settings         AppSetting?                    // 一对一：配置
  userMappings     UserMapping[]                  // 一对多：用户映射
  orderLogs        OrderPushLog[]                 // 一对多：订单日志
  thankYouModalEvents ThankYouModalEvent[]        // 一对多：弹窗事件
}
```

#### 2. **AppSetting** 表 - 应用配置
存储应用的所有配置参数。
```typescript
model AppSetting {
  id                  String   @id @default(uuid())
  shopId              String   @unique           // 外键
  shop                Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  
  // 基础设置
  embeddedIframeUrl   String   @default("https://shopifyapp.xmasforest.com")
  embedHeight         Int      @default(600)
  enableAutoRegister  Boolean  @default(true)    // 启用自动注册
  enableSso           Boolean  @default(true)    // 启用 SSO
  
  // FeedoGo 配置
  feedogoApiKey       String?                    // API 密钥
  feedogoWebhookUrl   String?                    // Webhook 接收地址
  feedogoSsoSecret    String?                    // SSO 签名密钥
  
  // 感谢页面配置
  thankYouModalConfig Json?                      // JSON: { enabled, title, description, ... }
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

#### 3. **UserMapping** 表 - 用户映射
记录 Shopify 客户与 FeedoGo 用户的关系。
```typescript
model UserMapping {
  id                String   @id @default(uuid())
  shopId            String                       // 外键
  shop              Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  
  shopifyCustomerId String                       // Shopify 客户 ID
  feedogoUserId     String?                      // FeedoGo 用户 ID
  feedogoEmail      String                       // FeedoGo 邮箱
  
  syncStatus        String   @default("pending") // pending | synced | failed
  lastSyncAt        DateTime?                    // 最后同步时间
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([shopifyCustomerId, shopId])         // 复合唯一约束
}
```

#### 4. **OrderPushLog** 表 - 订单推送日志
记录订单推送到 FeedoGo 的详细日志。
```typescript
model OrderPushLog {
  id              String   @id @default(uuid())
  shopId          String                        // 外键
  shop            Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  
  shopifyOrderId  String                        // Shopify 订单 ID
  feedogoOrderId  String?                       // FeedoGo 订单 ID（成功时填充）
  
  status          String   @default("pending")  // pending | success | failed
  errorMessage    String?                       // 失败原因
  retryCount      Int      @default(0)          // 重试次数
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([shopifyOrderId])                     // 查询索引
  @@index([status])                             // 按状态查询
}
```

#### 5. **ThankYouModalEvent** 表 - 感谢页面弹窗事件
记录用户与感谢页面弹窗的交互。
```typescript
model ThankYouModalEvent {
  id          String   @id @default(uuid())
  shopId      String                           // 外键
  shop        Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  
  orderId     String                           // 订单 ID
  eventType   String                           // shown | clicked | closed
  buttonLink  String?                          // 点击的链接
  
  userAgent   String?                          // 浏览器 UA
  ipAddress   String?                          // 用户 IP
  
  createdAt   DateTime @default(now())
  
  @@index([orderId])
  @@index([eventType])
  @@index([shopId])
}
```

### 数据关系示例
```
一个 Shop：
├─ 1 个 AppSetting（配置）
├─ N 个 UserMapping（用户映射）
│  ├─ Shopify 客户 1 ──→ FeedoGo 用户 A
│  └─ Shopify 客户 2 ──→ FeedoGo 用户 B
├─ N 个 OrderPushLog（订单日志）
│  ├─ 订单 #001 ──→ 推送成功
│  └─ 订单 #002 ──→ 待推送
└─ N 个 ThankYouModalEvent（弹窗事件）
   ├─ 订单 #001 显示弹窗
   └─ 订单 #002 点击按钮
```

---

## API 路由详解

### 路由总览
```
/api
├── /auth
│   ├── /index.ts         → OAuth 授权页面
│   └── /callback.ts      → OAuth 回调处理
├── /settings.ts          → 应用配置（GET/POST）
├── /stats.ts             → 统计数据（GET）
├── /test-connection.ts   → 测试 FeedoGo 连接
├── /sso
│   └── /generate-signature.ts  → SSO 签名生成
└── /webhooks
    ├── /register.ts           → Webhooks 注册（Shopify 内部）
    ├── /app-uninstalled.ts    → 应用卸载处理
    └── /order-auto-register.ts → 订单自动注册（核心业务）
```

### API 详细说明

#### 1. **GET/POST /api/settings** - 应用配置管理
获取或更新应用的所有配置。

**GET 请求**:
```bash
GET /api/settings?shop=mystore.myshopify.com

Response 200:
{
  "embeddedIframeUrl": "https://shopifyapp.xmasforest.com",
  "embedHeight": 600,
  "enableAutoRegister": true,
  "enableSso": true,
  "feedogoApiKey": "***",
  "feedogoWebhookUrl": "https://...",
  "feedogoSsoSecret": "***",
  "thankYouModalConfig": {
    "enabled": true,
    "title": "恭喜！您的订单已确认",
    "description": "感谢购买...",
    "couponCode": "WELCOME2026",
    "buttonText": "继续购物",
    "buttonLink": "https://..."
  }
}
```

**POST 请求**:
```bash
POST /api/settings?shop=mystore.myshopify.com
Content-Type: application/json

{
  "embeddedIframeUrl": "https://...",
  "embedHeight": 700,
  "enableAutoRegister": true,
  "enableSso": true,
  "feedogoApiKey": "key...",
  "feedogoWebhookUrl": "https://...",
  "feedogoSsoSecret": "secret...",
  "thankYouModalConfig": { ... }
}

Response 200: { ...保存的配置... }
```

#### 2. **GET /api/stats** - 统计数据查询
获取订单和用户同步的统计数据。

```bash
GET /api/stats?shop=mystore.myshopify.com

Response 200:
{
  "totalOrders": 156,
  "syncedOrders": 142,
  "pendingOrders": 10,
  "failedOrders": 4,
  "totalUsers": 128,
  "syncedUsers": 125,
  "lastSyncAt": "2026-01-28T10:30:00.000Z"
}
```

#### 3. **POST /api/test-connection** - 测试 FeedoGo 连接
验证 FeedoGo API 配置是否正确。

```bash
POST /api/test-connection
Content-Type: application/json

{
  "apiKey": "test-key",
  "webhookUrl": "https://feedogo.com/webhooks/shopify"
}

Response 200 (成功):
{
  "success": true,
  "message": "FeedoGo API 连接成功！"
}

Response 200 (失败):
{
  "success": false,
  "message": "API Key 验证失败，请检查密钥是否正确"
}
```

#### 4. **POST /api/sso/generate-signature** - SSO 签名生成
为需要 SSO 登录的用户生成认证签名。

```bash
POST /api/sso/generate-signature
Content-Type: application/json

{
  "customerId": "gid://shopify/Customer/123",
  "customerEmail": "customer@example.com",
  "shopId": "mystore.myshopify.com"
}

Response 200:
{
  "data": {
    "action": "LOGIN",
    "timestamp": 1706425800,
    "shopifyStoreId": "mystore.myshopify.com",
    "customerId": "gid://shopify/Customer/123",
    "customerEmail": "customer@example.com"
  },
  "hmac": "abc123def456..."
}
```

#### 5. **POST /api/webhooks/order-auto-register** - 订单自动注册（核心）
处理新订单，自动注册用户，推送订单到 FeedoGo。

```bash
POST /api/webhooks/order-auto-register
Content-Type: application/json

{
  "shopDomain": "mystore.myshopify.com",
  "orderId": "gid://shopify/Order/123",
  "orderEmail": "customer@example.com",
  "orderName": "John Doe",
  "orderData": {
    "id": "gid://shopify/Order/123",
    "email": "customer@example.com",
    "name": "#1001",
    "total_price": "99.99",
    "line_items": [...]
  }
}

Response 200:
{
  "success": true,
  "message": "Order synced successfully"
}
```

**处理逻辑**:
1. 验证店铺是否存在
2. 检查自动注册是否启用
3. 检查 FeedoGo 配置是否完整
4. **用户检查**: 查询是否已存在
5. **用户注册**: 若不存在则注册
6. **欢迎邮件**: 发送登录链接
7. **订单推送**: 调用 FeedoGo 订单 API
8. **记录映射**: 保存用户关系

#### 6. **GET /api/auth/index** - OAuth 授权
重定向到 Shopify OAuth 授权页面。

#### 7. **GET /api/auth/callback** - OAuth 回调
处理 Shopify OAuth 授权回调，获取 access token。

```
流程:
1. Shopify 重定向到此端点 (code + shop 参数)
2. 用 client_secret 交换 access_token
3. 保存 accessToken 到数据库
4. 重定向到应用首页
```

#### 8. **POST /api/webhooks/register** - Webhook 注册
向 Shopify 注册应用所需的 webhooks（Shopify 内部调用）。

#### 9. **POST /api/webhooks/app-uninstalled** - 应用卸载
处理应用从店铺卸载的事件，清理相关数据。

---

## 前端组件架构

### 页面结构

#### [pages/index.tsx](pages/index.tsx) - 主应用入口
```
主页面
└─ SettingsPage (shop 参数)
```
- 从 URL 参数获取 shop
- 渲染设置管理页面

#### [pages/embed.tsx](pages/embed.tsx) - 嵌入页面
```
嵌入页面
└─ EmbeddedIframe (shop, customerId, customerEmail)
```
- 在店铺前台加载 FeedoGo iframe
- 支持 SSO 登录

### 组件树

#### 1. **SettingsPage** - 主设置页面容器
```
SettingsPage (shopId)
├─ Tabs (4 个标签页)
│  ├─ Tab 0: DashboardStats
│  ├─ Tab 1: EmbedPreview
│  ├─ Tab 2: ThankYouModalSettings
│  └─ Tab 3: ApiSettings
├─ 保存按钮
└─ 加载/错误状态
```

**功能**:
- 加载全部配置到本地状态
- 管理 4 个主要配置区域
- 保存所有变更到后端
- 实时反馈和错误提示

**核心状态**:
```typescript
const [selectedTab, setSelectedTab] = useState(0);
const [url, setUrl] = useState('');           // iframe URL
const [embedHeight, setEmbedHeight] = useState(600);
const [autoRegister, setAutoRegister] = useState(true);
const [enableSso, setEnableSso] = useState(true);
const [thankYouModalConfig, setThankYouModalConfig] = useState({...});
const [apiConfig, setApiConfig] = useState({...});
```

#### 2. **DashboardStats** - 统计仪表盘
```
DashboardStats (shopId)
├─ 订单同步状态卡片
│  ├─ 总订单数
│  ├─ 已同步数
│  ├─ 待处理数
│  ├─ 失败数
│  └─ 进度条
└─ 用户映射统计卡片
   ├─ 总用户数
   ├─ 已同步数
   └─ 同步率
```

**数据来源**: `/api/stats?shop=${shopId}`

#### 3. **EmbedPreview** - iframe 预览和配置
```
EmbedPreview (url, embedHeight, onChange)
├─ URL 输入框
├─ 高度输入框
├─ 设备类型选择 (PC/Mobile)
├─ 预览 iframe
└─ 实时调整功能
```

#### 4. **ThankYouModalSettings** - 感谢页面配置
```
ThankYouModalSettings (config, onChange)
├─ 启用开关
├─ 标题输入
├─ 描述输入
├─ 优惠码输入
├─ 按钮文字输入
├─ 按钮链接输入
└─ 实时预览效果
```

**配置结构**:
```typescript
{
  enabled: boolean,
  title: string,
  description: string,
  couponCode: string,
  buttonText: string,
  buttonLink: string
}
```

#### 5. **ApiSettings** - FeedoGo API 配置
```
ApiSettings (config, onChange, onTest)
├─ API Key 输入 (密码隐藏)
├─ Webhook URL 输入
├─ SSO Secret 输入 (密码隐藏)
├─ 测试连接按钮
└─ 测试结果显示
```

**特性**:
- 敏感信息掩码显示
- 可切换显示/隐藏
- 一键测试连接功能
- 实时验证反馈

#### 6. **EmbeddedIframe** - iframe 容器
```
EmbeddedIframe (url, customerId, customerEmail, shopId, onLoad, onError)
├─ SSO 初始化
├─ iframe 容器
├─ 消息处理 (postMessage)
└─ 高度自适应
```

**功能**:
- 自动生成 SSO 签名
- 构建带 SSO 参数的 URL
- 监听来自 iframe 的消息 (resize 等)
- 动态调整 iframe 高度
- 同源验证安全检查

**消息协议**:
```javascript
// 接收消息
{
  type: 'SSO_SUCCESS',      // SSO 登录成功
  type: 'RESIZE',           // iframe 需要调整高度
  height: 800
}

// 发送消息
{
  type: 'SHOPIFY_CUSTOMER_DATA',
  customerId,
  customerEmail
}
```

### 数据流

#### 设置加载流程
```
SettingsPage mount
  ↓
useEffect 触发
  ↓
fetch /api/settings?shop=${shopId}
  ↓
setState (url, embedHeight, autoRegister, ...)
  ↓
组件 re-render，显示当前配置
```

#### 配置保存流程
```
用户修改配置
  ↓
组件状态更新
  ↓
点击保存按钮
  ↓
POST /api/settings?shop=${shopId}
  ↓
后端验证并保存到 database
  ↓
返回保存结果
  ↓
显示成功/失败提示
```

#### iframe SSO 流程
```
EmbeddedIframe mount
  ↓
useEffect: initSSO()
  ↓
fetch /api/sso/generate-signature
  ↓
获得 { data, hmac }
  ↓
构建 SSO URL: url?sso_data={...}
  ↓
iframe src = SSO URL
  ↓
iframe 加载完成 → onLoad
  ↓
postMessage 发送客户信息
```

---

## 扩展系统

### 1. 主题应用扩展 (Theme App Extension)
```
extensions/theme-app-extension/
├── shopify.ui.extension.toml     # 配置
├── blocks/
│   └── feedobridge-embed.liquid  # 嵌入块
└── locales/
    └── en.default.json           # 本地化
```

#### [feedobridge-embed.liquid](extensions/theme-app-extension/blocks/feedobridge-embed.liquid)
**用途**: 在店铺前台的任何位置添加 FeedoGo iframe 块

**功能**:
- 自适应 PC/移动端 URL
- SSO 参数传递
- 设备类型检测
- 屏幕尺寸检测
- iframe 高度自适应

**块设置**:
```liquid
{% if block.settings.enable_sso and customer %}
  {% assign sso_params = ... %}
{% endif %}

<iframe 
  id="feedobridge-iframe"
  data-pc-url="{{ block.settings.embed_url_pc }}"
  data-mobile-url="{{ block.settings.embed_url_mobile }}"
  data-sso-params="{{ sso_params }}"
  style="width: 100%; height: 90vh;"
/>
```

**JavaScript 逻辑**:
1. 检测设备类型 (User-Agent)
2. 获取屏幕尺寸
3. 选择 PC 或移动端 URL
4. 拼接参数 (shop, device, screenWidth, screenHeight, SSO)
5. 加载 iframe

### 2. 结账 UI 扩展 (Checkout UI Extension)
```
extensions/thank-you-modal/
├── package.json                  # 依赖配置
├── shopify.extension.toml        # 扩展配置
└── src/
    └── index.jsx                 # 弹窗组件
```

#### [index.jsx](extensions/thank-you-modal/src/index.jsx)
**用途**: 在 Shopify 结账流程的感谢页面显示自定义弹窗

**扩展点**: `purchase.thank-you.block.render`
- 类型: Block Extension
- 位置: 感谢页面主要内容区域
- 可配置: 是（通过管理后台）

**组件结构**:
```jsx
export default reactExtension(
  'purchase.thank-you.block.render',
  () => <Extension />
);

function Extension() {
  return (
    <View border="base" cornerRadius="base" padding="base">
      <BlockStack spacing="base">
        <Heading>🎁 恭喜！您的订单已确认</Heading>
        <Text>感谢您的购买！...</Text>
        <Text emphasis="bold">专属优惠码：WELCOME2026</Text>
        <Button kind="primary" to="https://feedogostore.myshopify.com">
          继续购物
        </Button>
      </BlockStack>
    </View>
  );
}
```

**配置源**: `AppSetting.thankYouModalConfig`
- 可从管理面板动态修改
- 通过 Shopify Admin API 实时更新

---

## 流程工作流

### 1. 应用安装流程
```
商户访问应用商店
   ↓
点击"安装应用"
   ↓
重定向到 OAuth 授权页面
   ↓
商户授予权限
   ↓
GET /api/auth/callback?code=xxx&shop=xxx.myshopify.com
   ↓
获取 access_token
   ↓
prisma.shop.upsert() → 保存店铺信息
   ↓
重定向到 Shopify Admin
   ↓
应用显示在 Admin 的应用列表中
```

### 2. 配置管理流程
```
商户访问应用首页
   ↓
SettingsPage 挂载
   ↓
fetchSettings() → GET /api/settings?shop=xxx
   ↓
渲染 4 个标签页：仪表盘、嵌入、感谢页、API
   ↓
商户修改配置
   ↓
点击保存按钮
   ↓
POST /api/settings?shop=xxx (所有配置)
   ↓
prisma.appSetting.upsert()
   ↓
返回保存的配置
   ↓
显示成功提示（3 秒后消失）
```

### 3. 顾客购物 → SSO → iframe 流程
```
顾客在店铺前台
   ↓
加载含 FeedoBridge 块的页面
   ↓
Liquid 代码执行
   ├─ 检测设备类型
   ├─ 选择 PC/Mobile URL
   └─ 拼接参数
   ↓
<iframe src="https://...?shop=xxx&device=desktop&...">
   ↓
iframe 内容加载
   ↓
如果客户已登录 (Shopify customer object):
   ├─ customerId = customer.id
   └─ customerEmail = customer.email
   ↓
构建 SSO 参数
   ↓
FeedoGo 平台接收 SSO 数据
   ↓
验证 HMAC 签名
   ↓
用户自动登录（无需密码）
   ↓
展示个性化内容
```

### 4. 新订单 → 自动注册 → 订单同步流程
```
顾客完成购买
   ↓
Shopify 生成订单
   ↓
触发 "orders/create" webhook
   ↓
POST /api/webhooks/order-auto-register
{
  shopDomain: "xxx.myshopify.com",
  orderId: "gid://...",
  orderEmail: "customer@example.com",
  orderData: { ... }
}
   ↓
验证店铺是否存在
   ↓
检查自动注册是否启用
   ↓
获取 FeedoGo API 配置
   ↓
✅ 用户存在检查
   GET https://feedogo.com/api/v1/users/check?email=xxx
   ├─ 若存在 → 跳过注册
   └─ 若不存在 → 继续注册
   ↓
✅ 自动注册用户
   POST /api/v1/users/register
   {
     email, firstName, lastName,
     source: "shopify",
     shopifyOrderId, shopifyStore
   }
   ↓
✅ 发送欢迎邮件
   POST /api/v1/password-reset
   {
     email,
     type: "welcome",
     redirectUrl: "https://..."
   }
   ↓
✅ 推送订单到 FeedoGo
   POST /api/v1/orders/push
   {
     orderId, orderData, customerEmail, ...
   }
   ↓
✅ 记录用户映射
   prisma.userMapping.upsert()
   {
     shopifyCustomerId,
     feedogoUserId,
     feedogoEmail,
     syncStatus: "synced"
   }
   ↓
✅ 记录订单日志
   prisma.orderPushLog.create()
   {
     shopifyOrderId,
     feedogoOrderId,
     status: "success"
   }
   ↓
返回 200 成功
```

**错误处理**:
- 若 API 调用失败 → 记录失败状态
- 重试机制 → 记录 retryCount
- 异步处理 → 不阻塞订单流程

### 5. 感谢页面弹窗展示流程
```
顾客完成支付
   ↓
跳转到感谢页面 (Thank You Page)
   ↓
Shopify 加载 Checkout UI Extensions
   ↓
加载 "thank-you-modal" 扩展
   ↓
调用 index.jsx 中的组件
   ↓
获取 thankYouModalConfig
   ├─ enabled: true
   ├─ title: "恭喜！..."
   ├─ description: "感谢..."
   ├─ couponCode: "WELCOME2026"
   ├─ buttonText: "继续购物"
   └─ buttonLink: "https://..."
   ↓
渲染弹窗 UI
   ├─ 标题
   ├─ 描述
   ├─ 优惠码
   └─ 按钮
   ↓
如果配置改变 → 实时更新（无需重新部署）
   ↓
顾客可与弹窗交互
   ├─ 查看优惠码
   ├─ 点击按钮跳转
   └─ 关闭弹窗
```

### 6. 仪表盘统计流程
```
商户打开仪表盘标签页
   ↓
DashboardStats 组件挂载
   ↓
fetchStats() → GET /api/stats?shop=xxx
   ↓
后端查询数据库
   ├─ SELECT COUNT(*) FROM orderPushLog WHERE shopId=xxx
   ├─ GROUP BY status → (success, pending, failed)
   ├─ SELECT COUNT(*) FROM userMapping WHERE shopId=xxx
   └─ GROUP BY syncStatus
   ↓
计算统计值
   ├─ totalOrders = sum
   ├─ syncedOrders = success count
   ├─ pendingOrders = pending count
   ├─ failedOrders = failed count
   ├─ totalUsers = sum
   ├─ syncedUsers = synced count
   ├─ syncRate = (synced / total) * 100%
   └─ lastSyncAt = MAX(updatedAt)
   ↓
返回 JSON
   ↓
组件 setState(stats)
   ↓
渲染可视化卡片
   ├─ 订单统计（数字 + 进度条）
   └─ 用户统计（数字 + 进度条）
```

---

## 配置与部署

### 环境变量 (.env)
```bash
# Shopify OAuth
SHOPIFY_API_KEY=9da46159e4de788dab1f3cc2533551e4
SHOPIFY_API_SECRET=xxxxx

# 应用 URL
NEXTAUTH_URL=https://shopifyapp.xmasforest.com
NEXTAUTH_SECRET=xxxxx

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/feedobridge

# Redis 缓存
REDIS_URL=redis://localhost:6379

# JWT (SSO Token)
JWT_SECRET=xxxxx

# 其他
NODE_ENV=production
API_VERSION=2024-01
```

### 构建和部署
```bash
# 开发环境
npm run dev

# Shopify 开发模式
npm run shopify:dev

# 生产构建
npm run build
npm run start

# 数据库管理
npm run db:generate  # 生成 Prisma Client
npm run db:migrate   # 运行迁移
npm run db:push      # 推送 schema
```

### Shopify App Toml 配置说明
```toml
# 基础配置
name = "FeedoBridge"
client_id = "9da46159e4de788dab1f3cc2533551e4"
application_url = "https://shopifyapp.xmasforest.com"
embedded = true  # 嵌入式应用（在 Shopify Admin 中打开）

# API 权限范围
[access_scopes]
scopes = "read_products,write_products,read_customers,write_customers,read_orders,write_orders"

# Webhooks 配置
[webhooks]
api_version = "2024-01"
# Webhooks 由应用在运行时动态注册

# 扩展配置
[[extensions]]
type = "theme"
name = "FeedoBridge Theme Extension"
handle = "feedobridge-theme-extension"

[[extensions]]
type = "checkout_ui_extension"
name = "Thank You Modal"
handle = "thank-you-modal"
```

---

## 关键集成点

### 1. Shopify 官方集成
| 集成点 | 功能 | 文件 |
|------|------|------|
| OAuth 2.0 | 应用安装认证 | pages/api/auth/callback.ts |
| GraphQL API | 产品/订单查询 | lib/shopify.ts |
| Webhooks | 订单实时通知 | pages/api/webhooks/* |
| Theme App Extension | 前台块扩展 | extensions/theme-app-extension/ |
| Checkout UI Extension | 感谢页面扩展 | extensions/thank-you-modal/ |
| Polaris UI | UI 组件库 | components/* |

### 2. FeedoGo 云平台集成
| 集成点 | 功能 | API 端点 | 文件 |
|------|------|--------|------|
| 用户检查 | 判断用户是否存在 | GET /api/v1/users/check | pages/api/webhooks/order-auto-register.ts |
| 用户注册 | 自动注册新用户 | POST /api/v1/users/register | pages/api/webhooks/order-auto-register.ts |
| 密码重置 | 发送欢迎邮件 | POST /api/v1/password-reset | pages/api/webhooks/order-auto-register.ts |
| 订单推送 | 同步订单数据 | POST /api/v1/orders/push | pages/api/webhooks/order-auto-register.ts |
| Webhooks | 接收 Shopify 数据 | POST /webhooks/shopify | shopify.app.toml |

### 3. 数据库集成
| 集成点 | 用途 | ORM |
|------|------|-----|
| PostgreSQL | 持久化存储 | Prisma |
| Redis | 会话/缓存 | redis (node) |
| Prisma | 数据访问层 | lib/prisma.ts |

### 4. 安全集成
| 集成点 | 机制 | 文件 |
|------|------|------|
| OAuth | Shopify 应用认证 | pages/api/auth/callback.ts |
| HMAC 验证 | Webhook 签名验证 | lib/shopify.ts |
| JWT | SSO Token | lib/auth.ts |
| HMAC-SHA256 | SSO 签名 | lib/auth.ts |
| 密钥存储 | 环境变量 | .env |

---

## 项目统计

### 代码量
```
├── pages/          →  5 个文件（路由 + API）
├── components/     →  6 个组件
├── extensions/     →  2 个扩展
├── lib/            →  4 个工具库
├── prisma/         →  1 个 schema
├── tsconfig.json   →  TypeScript 配置
└── package.json    →  16 个依赖

总计：~2000+ 行代码
```

### 主要依赖
- **Next.js 14.1** - 全栈框架
- **React 18.2** - UI 库
- **TypeScript 5.3** - 类型系统
- **Prisma 5.8** - ORM
- **@shopify/polaris** - UI 组件
- **@shopify/app-bridge** - Shopify 集成
- **axios 1.6** - HTTP 客户端
- **jsonwebtoken 9.0** - JWT 处理
- **redis 4.6** - 缓存

---

## 总结

FeedoBridge 是一个**功能完整、设计完善的 Shopify 应用**，具有以下特点：

✅ **完整的 OAuth 认证流程** - 从安装到授权到 token 管理  
✅ **双向数据同步** - Shopify → FeedoGo (订单) 和 FeedoGo → Shopify (UI 更新)  
✅ **安全的 SSO 实现** - HMAC-SHA256 签名 + JWT Token  
✅ **灵活的配置系统** - Web UI 管理所有参数  
✅ **实时统计仪表盘** - 订单和用户同步状态可视化  
✅ **多种扩展方式** - Theme 块 + Checkout UI Extension  
✅ **健壮的错误处理** - 重试机制、日志记录、状态追踪  
✅ **现代化技术栈** - Next.js + TypeScript + Prisma  

这是一个**生产级别的应用**，适合与第三方 SaaS 平台深度集成。

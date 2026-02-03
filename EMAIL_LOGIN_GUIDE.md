# 邮箱登录功能实现文档

## 功能概述

用户在 Shopify 网站登录后，系统会自动发送用户邮箱给 FeedoGo 云平台，用户可以无缝自动登录 FeedoGo 平台，无需再次输入密码。

## 工作流程

```
┌─────────────────────────────────────────────────────────────┐
│ 用户在 Shopify 前台浏览网站                                  │
│ (已登录状态，customerEmail 已获得)                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ FeedoBridge iframe 组件加载                                  │
│ ├─ 检测到 customerEmail                                     │
│ └─ feedogoWebhookUrl 已配置                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 前端发送邮箱到后端 API                                       │
│ POST /api/email-login                                        │
│ { email, feedogoWebhookUrl }                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 后端 API 调用 FeedoGo emailLogin 接口                        │
│ POST https://shop.feedogocloud.com/api/user/emailLogin    │
│ { email }                                                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ FeedoGo 返回登录结果                                         │
│ {                                                            │
│   "code": 1,                                                │
│   "data": {                                                 │
│     "userinfo": {                                           │
│       "token": "xxx",                                       │
│       "user_id": 16,                                        │
│       "nickname": "...",                                    │
│       "expires_in": 2592000                                 │
│     }                                                        │
│   }                                                          │
│ }                                                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 后端返回 Token 给前端                                        │
│ {                                                            │
│   "success": true,                                          │
│   "data": {                                                 │
│     "token": "xxx",                                         │
│     "userId": 16,                                           │
│     "nickname": "...",                                      │
│     "expiresIn": 2592000                                    │
│   }                                                          │
│ }                                                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 前端构建 Token 登录 URL                                      │
│ https://feedogocloud.com?token=xxx&user_id=16&method=...  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ iframe 加载并通过 postMessage 发送 TOKEN_DATA               │
│ {                                                            │
│   "type": "TOKEN_DATA",                                     │
│   "token": "xxx",                                           │
│   "userId": 16,                                             │
│   "nickname": "..."                                         │
│ }                                                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ FeedoGo 平台接收 TOKEN_DATA                                  │
│ ├─ 验证 token 有效性                                        │
│ ├─ 自动设置用户登录状态                                     │
│ ├─ 加载用户个人化内容                                       │
│ └─ 完成自动登录                                             │
└─────────────────────────────────────────────────────────────┘
```

## API 接口详解

### 1. 前端 API: `/api/email-login`

**请求方式**: `POST`

**请求参数**:
```typescript
{
  email: string;              // 用户邮箱（必填）
  feedogoWebhookUrl: string; // FeedoGo Webhook 地址（必填）
}
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "Email login successful",
  "data": {
    "token": "a06c7d2e-f17c-4185-a7e8-4ff2e5af01e1",
    "userId": 16,
    "nickname": "Tail Guardian16",
    "avatar": "/assets/img/54.png",
    "expiresIn": 2592000
  }
}
```

**失败响应** (200):
```json
{
  "success": false,
  "message": "该邮箱未注册或 FeedoGo 地址有误"
}
```

**错误处理**:
- `400` - 缺少必要参数
- `200` - 业务错误（邮箱不存在、服务不可用等）

### 2. FeedoGo API: `/api/user/emailLogin`

**请求方式**: `POST`

**请求地址**: `https://shop.feedogocloud.com/api/user/emailLogin`

**请求参数**:
```json
{
  "email": "customer@example.com"
}
```

**响应格式**:
```json
{
  "code": 1,
  "msg": "Login successful",
  "time": "1769505130",
  "data": {
    "userinfo": {
      "id": 16,
      "username": "",
      "nickname": "Tail Guardian16",
      "mobile": "",
      "avatar": "/assets/img/54.png",
      "score": 5020,
      "token": "a06c7d2e-f17c-4185-a7e8-4ff2e5af01e1",
      "user_id": 16,
      "createtime": 1769505130,
      "expiretime": 1772097130,
      "expires_in": 2592000
    }
  }
}
```

## 前端组件实现

### EmbeddedIframe 组件

**新增属性**:
```typescript
interface EmbeddedIframeProps {
  feedogoWebhookUrl?: string;  // 新增：FeedoGo Webhook URL
  // ... 其他现有属性
}
```

**登录逻辑**:

1. **优先邮箱登录**:
   ```typescript
   if (feedogoWebhookUrl && customerEmail) {
     // 调用 /api/email-login
     // 若成功，构建 token 登录 URL
     // 若失败，降级到 SSO 登录
   }
   ```

2. **降级 SSO 登录**:
   ```typescript
   if (!feedogoWebhookUrl || emailLoginFailed) {
     // 使用原有的 SSO 签名方式登录
   }
   ```

3. **消息传递**:
   ```typescript
   // iframe 加载完成后发送
   iframe.postMessage({
     type: 'TOKEN_DATA',
     token: result.data.token,
     userId: result.data.userId,
     // ...
   }, originUrl);
   ```

## 流程说明

### 步骤 1: 用户登录状态检测
当用户在 Shopify 前台登录时，系统获得：
- `customerEmail` - 用户邮箱
- `customerId` - 用户 ID
- `shopId` - 店铺 ID

### 步骤 2: iframe 初始化
```typescript
useEffect(() => {
  async function initLogin() {
    if (!customerEmail) return;
    
    // 尝试邮箱登录
    if (feedogoWebhookUrl) {
      const result = await fetch('/api/email-login', {
        body: JSON.stringify({ 
          email: customerEmail,
          feedogoWebhookUrl 
        })
      });
      
      if (result.success) {
        // 构建 token URL
      } else {
        // 降级到 SSO
      }
    }
  }
  
  initLogin();
}, [customerEmail, feedogoWebhookUrl]);
```

### 步骤 3: 后端 API 调用
```typescript
// pages/api/email-login.ts
export default async function handler(req, res) {
  const { email, feedogoWebhookUrl } = req.body;
  
  // 调用 FeedoGo emailLogin
  const response = await axios.post(
    `${baseUrl}/api/user/emailLogin`,
    { email }
  );
  
  if (response.data?.code === 1) {
    // 提取 token 并返回
    return res.json({ success: true, data: ... });
  }
}
```

### 步骤 4: iframe 接收 Token
```typescript
// iframe 内部脚本监听消息
window.addEventListener('message', (event) => {
  if (event.data.type === 'TOKEN_DATA') {
    const { token, userId } = event.data;
    // 调用 FeedoGo 内部登录 API
    // 或通过 localStorage 保存 token
    // 刷新页面或加载用户数据
  }
});
```

## 配置要求

在管理后台配置以下参数：

1. **嵌入网站 URL**
   - 示例: `https://feedogocloud.com`
   - 用途: iframe 加载的目标地址

2. **FeedoGo Webhook URL** ✨ 新增
   - 示例: `https://shop.feedogocloud.com/webhooks/shopify`
   - 用途: 用于获取 emailLogin 接口地址
   - 提取方式: 移除 `/webhooks/shopify` 后缀

3. **启用邮箱登录**
   - 类型: 布尔值（checkbox）
   - 默认: true
   - 用途: 控制是否使用邮箱登录功能

## 错误处理

### 场景 1: 邮箱不存在
```
emailLogin 返回 code !== 1
└─ 系统降级到 SSO 登录方式
└─ 用户可通过 SSO 正常登录
```

### 场景 2: FeedoGo 服务不可用
```
网络错误或连接超时
└─ 返回友好的错误提示
└─ 系统尝试降级到 SSO
```

### 场景 3: Webhook URL 配置错误
```
emailLogin 接口返回 404
└─ 提示用户检查配置
└─ 降级到 SSO 方式
```

## 安全考虑

✅ **已实现**:
- HTTPS 只通信
- Token 有效期限制 (expires_in)
- 同源策略验证 (postMessage)
- 敏感信息不存储在 localStorage
- 邮箱参数验证

## 使用场景

### 场景 A: 邮箱登录（推荐）
```
前提: 用户已在 Shopify 登录，且邮箱已在 FeedoGo 注册
流程:
  1. 自动检测用户邮箱
  2. 调用 emailLogin 获取 token
  3. iframe 通过 token 自动登录
  4. 无需额外操作
  
优点: 用户体验最佳，完全无缝
```

### 场景 B: SSO 登录（备选）
```
前提: 未配置 Webhook URL 或 emailLogin 失败
流程:
  1. 系统生成 HMAC 签名
  2. 通过 sso_data 参数传递
  3. iframe 接收并验证签名
  4. 验证通过后登录
  
优点: 安全性高，支持不同的 API 配置方式
```

### 场景 C: 未登录用户
```
前提: 用户在 Shopify 前台未登录
流程:
  1. iframe 加载空白或免登陆内容
  2. FeedoGo 展示登录界面
  3. 用户手动登录或注册
  
优点: 允许匿名用户访问部分内容
```

## 部署清单

- [x] 新建 `/api/email-login.ts` API 端点
- [x] 更新 `EmbeddedIframe.tsx` 组件支持邮箱登录
- [x] 更新 `SettingsPage.tsx` 显示配置选项
- [x] 添加 `feedogoWebhookUrl` 参数传递
- [ ] 测试邮箱登录流程
- [ ] 测试 SSO 降级方案
- [ ] 测试错误场景处理
- [ ] 更新 Shopify 管理后台配置页面
- [ ] 发布到生产环境

## 测试步骤

### 1. 功能测试
```bash
# 1. 设置 Webhook URL
POST /api/settings?shop=xxx.myshopify.com
{
  "feedogoWebhookUrl": "https://shop.feedogocloud.com/webhooks/shopify"
}

# 2. 以已注册邮箱的用户登录 Shopify 前台
# 3. 加载 iframe
# 4. 验证自动登录成功（无需输入密码）
# 5. 查看浏览器控制台是否有错误
```

### 2. 错误测试
```bash
# 测试未注册邮箱
# 预期: 系统降级到 SSO，显示登录界面

# 测试错误的 Webhook URL
# 预期: 系统降级到 SSO，显示错误提示

# 测试网络断开
# 预期: 显示友好的错误消息，降级到 SSO
```

## 日志监控

关键日志点：
```typescript
console.log('Email login attempt:', customerEmail);
console.log('Email login success:', tokenData);
console.error('Email login failed, falling back to SSO:', error);
console.log('SSO login fallback initiated');
```

## 更新记录

| 版本 | 日期 | 更改 |
|-----|------|------|
| 1.0 | 2026-01-28 | 初始实现邮箱登录功能 |

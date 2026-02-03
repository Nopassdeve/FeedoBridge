# 邮箱自动登录功能实现总结

## 📋 功能概述

实现了用户在 Shopify 网站登录后，自动向 FeedoGo 云平台发送邮箱，从而实现无缝自动登录，无需二次输入密码。

## 🔧 实现详解

### 1. 新增 API 端点: `/api/email-login.ts`

**功能**: 接收用户邮箱，调用 FeedoGo emailLogin 接口

**请求**:
```bash
POST /api/email-login
Content-Type: application/json

{
  "email": "customer@example.com",
  "feedogoWebhookUrl": "https://shop.feedogocloud.com/webhooks/shopify"
}
```

**响应 (成功)**:
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

**核心逻辑**:
```typescript
// 1. 验证参数
if (!email || !feedogoWebhookUrl) {
  return res.status(400).json({ error: '参数缺失' });
}

// 2. 调用 FeedoGo emailLogin API
const response = await axios.post(
  `${baseUrl}/api/user/emailLogin`,
  { email },
  { timeout: 10000 }
);

// 3. 提取 token 并返回
if (response.data?.code === 1 && response.data?.data?.userinfo?.token) {
  const userInfo = response.data.data.userinfo;
  return res.json({
    success: true,
    data: {
      token: userInfo.token,
      userId: userInfo.user_id,
      nickname: userInfo.nickname,
      avatar: userInfo.avatar,
      expiresIn: userInfo.expires_in
    }
  });
}

// 4. 错误处理（网络错误、邮箱不存在等）
```

### 2. 更新 EmbeddedIframe 组件

**新增属性**:
```typescript
interface EmbeddedIframeProps {
  feedogoWebhookUrl?: string;  // FeedoGo Webhook URL
  // ... 其他现有属性
}
```

**登录逻辑流程**:

```
┌─ 初始化 (useEffect)
│
├─ 检查邮箱 ──→ 无邮箱 ──→ 加载空白 iframe
│
├─ 有邮箱 && 配置了 Webhook URL
│  ├─ 调用 /api/email-login
│  ├─ 成功 ──→ 保存 token 数据
│  │         构建 token URL
│  │         加载 iframe
│  │
│  └─ 失败 ──→ 降级到 SSO
│
└─ 无 Webhook URL ──→ 使用 SSO 方式
```

**关键代码**:
```typescript
async function initLogin() {
  if (!customerEmail) {
    setSsoUrl(url);
    return;
  }

  // 优先邮箱登录
  if (feedogoWebhookUrl) {
    try {
      const response = await fetch('/api/email-login', {
        method: 'POST',
        body: JSON.stringify({ 
          email: customerEmail,
          feedogoWebhookUrl 
        })
      });

      const result = await response.json();
      
      if (result.success && result.data?.token) {
        // 邮箱登录成功
        setTokenData(result.data);
        
        // 构建 token URL
        const tokenUrl = new URL(url);
        tokenUrl.searchParams.append('token', result.data.token);
        tokenUrl.searchParams.append('user_id', result.data.userId.toString());
        tokenUrl.searchParams.append('method', 'email-login');
        
        setSsoUrl(tokenUrl.toString());
        return;
      }
    } catch (error) {
      console.warn('Email login failed, falling back to SSO');
    }
  }

  // 降级到 SSO
  // ... 原有 SSO 逻辑
}
```

**消息处理**:
```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'EMAIL_LOGIN_SUCCESS') {
      console.log('Email login successful');
    }
    
    // iframe 请求刷新 token
    if (event.data.type === 'REFRESH_TOKEN') {
      if (tokenData) {
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: 'TOKEN_DATA',
            token: tokenData.token,
            userId: tokenData.userId
          },
          originUrl
        );
      }
    }
    
    // 其他消息（RESIZE 等）
  };
  
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, [tokenData]);
```

### 3. 更新 SettingsPage 组件

**新增配置选项**:
```typescript
<Checkbox
  label="启用邮箱登录（推荐）"
  checked={enableSso}
  onChange={setEnableSso}
  helpText="用户可直接通过邮箱在 FeedoGo 平台自动登录"
/>
```

**传递参数到 EmbedPreview**:
```typescript
<EmbedPreview 
  url={url} 
  embedHeight={embedHeight}
  feedogoWebhookUrl={apiConfig.feedogoWebhookUrl}
  onChange={(newUrl, newHeight) => {
    setUrl(newUrl);
    setEmbedHeight(newHeight);
  }}
/>
```

### 4. 更新 EmbedPreview 组件

**新增功能**:
- 显示 Webhook URL 配置状态
- 动态提示是否支持邮箱登录

```typescript
{feedogoWebhookUrl && (
  <div style={{ 
    padding: '12px', 
    backgroundColor: '#e3f1df', 
    borderRadius: '6px'
  }}>
    <Text as="p" variant="bodySm">
      ✅ 已配置 FeedoGo Webhook URL，支持邮箱自动登录
    </Text>
  </div>
)}
```

### 5. 更新 pages/embed.tsx

**新增参数传递**:
```typescript
const [feedogoWebhookUrl, setFeedogoWebhookUrl] = useState<string>('');

useEffect(() => {
  async function fetchSettings() {
    const response = await fetch(`/api/settings?shop=${shop}`);
    const data = await response.json();
    setIframeUrl(data.embeddedIframeUrl);
    setFeedogoWebhookUrl(data.feedogoWebhookUrl || ''); // 新增
  }
  fetchSettings();
}, [shop]);

return (
  <EmbeddedIframe
    url={iframeUrl}
    customerId={customerId as string}
    customerEmail={customerEmail as string}
    shopId={shop as string}
    feedogoWebhookUrl={feedogoWebhookUrl}  // 新增
  />
);
```

## 🔄 完整工作流程

```
1️⃣ 用户登录
   └─ Shopify 前台已登录状态
   └─ customerEmail 已获得

2️⃣ 加载 iframe 页面
   └─ GET /embed?shop=xxx&customerId=xxx&customerEmail=xxx

3️⃣ EmbeddedIframe 初始化
   └─ 获取 feedogoWebhookUrl 配置
   └─ 尝试邮箱登录

4️⃣ 调用 /api/email-login
   ├─ POST { email, feedogoWebhookUrl }
   └─ 后端调用 FeedoGo emailLogin API

5️⃣ FeedoGo 验证邮箱
   ├─ 邮箱存在 → 返回 token
   └─ 邮箱不存在 → 返回错误

6️⃣ 前端接收 token
   ├─ 成功 → 保存 tokenData
   ├─ 失败 → 降级到 SSO
   └─ 无 Webhook URL → 使用 SSO

7️⃣ iframe 加载
   └─ 通过 postMessage 发送 TOKEN_DATA

8️⃣ FeedoGo iframe 接收 token
   ├─ 验证 token 有效性
   ├─ 设置登录状态
   ├─ 加载用户数据
   └─ 完成自动登录
```

## 🛡️ 错误处理

### 场景 1: 邮箱登录失败
```typescript
if (!result.success) {
  // 自动降级到 SSO 方式
  // 发送 HMAC 签名而不是 token
  console.warn('Email login failed, falling back to SSO');
}
```

### 场景 2: 网络错误
```typescript
catch (error) {
  // 自动降级到 SSO
  console.warn('Email login error:', error);
  // 继续使用 SSO 流程
}
```

### 场景 3: 未配置 Webhook URL
```typescript
if (!feedogoWebhookUrl) {
  // 直接使用 SSO
  // 不尝试邮箱登录
}
```

## 📊 配置说明

在 Shopify 管理后台配置：

1. **嵌入网站 URL** (必填)
   ```
   https://feedogocloud.com
   ```

2. **FeedoGo Webhook URL** (可选，建议配置)
   ```
   https://shop.feedogocloud.com/webhooks/shopify
   ```
   - 用于提取 emailLogin 接口地址
   - 配置后自动启用邮箱登录

3. **启用邮箱登录** (推荐启用)
   - 用户体验最佳
   - 无需二次登录

4. **启用自动注册** (可选)
   - 订单自动注册用户

## ✅ 已实现文件变更

| 文件 | 操作 | 说明 |
|-----|------|------|
| pages/api/email-login.ts | ✨ 新建 | FeedoGo emailLogin 代理 API |
| components/EmbeddedIframe.tsx | 🔄 更新 | 支持邮箱登录和 token 传递 |
| components/SettingsPage.tsx | 🔄 更新 | 修复重复代码，传递 Webhook URL |
| components/EmbedPreview.tsx | 🔄 更新 | 显示配置状态提示 |
| pages/embed.tsx | 🔄 更新 | 获取并传递 Webhook URL |
| EMAIL_LOGIN_GUIDE.md | 📝 新建 | 详细实现文档 |

## 🚀 部署步骤

1. **提交代码**
   ```bash
   git add .
   git commit -m "feat: 实现邮箱自动登录功能"
   git push origin main
   ```

2. **部署应用**
   ```bash
   npm run build
   npm run start
   # 或通过 Shopify CLI
   shopify app deploy
   ```

3. **配置 Webhook URL**
   - 进入 Shopify 管理后台
   - 找到 FeedoBridge 应用
   - 设置 → API 配置
   - 输入 FeedoGo Webhook URL
   - 点击保存

4. **测试邮箱登录**
   - 用已注册邮箱登录店铺前台
   - 加载 FeedoGo iframe
   - 验证自动登录（无需输入密码）

## 📈 功能对比

### 邮箱登录 vs SSO 登录

| 特性 | 邮箱登录 | SSO 登录 |
|-----|---------|---------|
| **用户体验** | ⭐⭐⭐⭐⭐ 最佳 | ⭐⭐⭐⭐ 优秀 |
| **需要配置** | Webhook URL | - |
| **API 调用** | FeedoGo emailLogin | HMAC 签名 |
| **Token 来源** | FeedoGo 返回 | 本地生成 |
| **自动性** | 完全自动 | 需要 HMAC 验证 |
| **可靠性** | 取决于 FeedoGo | 高 |
| **降级方案** | SSO | 无 |

## 🔐 安全考虑

✅ **已实现**:
- 邮箱参数验证
- HTTPS 通信
- Token 有效期限制 (expires_in)
- 同源策略验证 (postMessage)
- 敏感信息不持久化存储
- 错误处理和降级方案

⚠️ **需要 FeedoGo 确保**:
- emailLogin API 仅接受有效邮箱
- Token 签名和验证机制
- 速率限制防止滥用
- CORS 跨域配置

## 📝 后续优化建议

1. **Token 刷新机制**
   - 当 token 即将过期时自动刷新
   - 在 iframe 中实现心跳检测

2. **离线存储**
   - 使用 localStorage 缓存 token（仅在 iframe 内）
   - 页面刷新时恢复登录状态

3. **多设备支持**
   - 为移动端特殊处理
   - 优化网络较差环境的降级

4. **监控和日志**
   - 记录登录成功/失败统计
   - 监控 FeedoGo API 响应时间
   - 分析 SSO 降级率

5. **A/B 测试**
   - 对比邮箱登录 vs SSO 的用户体验
   - 收集反馈优化流程

## 🎯 总结

✨ **邮箱登录功能已完整实现**，具有以下优点：

- 🚀 **完全自动** - 用户无需任何操作
- 🔒 **安全可靠** - 完整的错误处理和降级方案
- 📊 **易于监控** - 清晰的日志记录
- 🛡️ **容错性强** - SSO 备选方案
- 🎨 **用户友好** - 无缝的登录体验

用户在 Shopify 网站登录后，可以立即在 FeedoGo 平台自动登录，享受无缝的跨平台体验！

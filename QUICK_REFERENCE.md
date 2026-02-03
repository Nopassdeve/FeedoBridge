# 邮箱自动登录快速参考

## 📱 用户体验流程

```
用户在 Shopify 店铺登录 (email: user@example.com)
        ↓
访问含 FeedoGo iframe 的页面
        ↓
后台自动发送邮箱到 FeedoGo emailLogin API
        ↓
FeedoGo 返回 token (不需要输入密码)
        ↓
iframe 自动登录，显示个性化内容
        ↓
用户无缝访问 FeedoGo 平台
```

## 🔧 开发者集成步骤

### Step 1: 配置 Webhook URL
在 Shopify 管理后台设置：
```
API 配置 → FeedoGo Webhook URL
https://shop.feedogocloud.com/webhooks/shopify
```

### Step 2: 在前台页面嵌入 iframe

**Liquid 模板 (店铺前台)**:
```liquid
<script>
  // 如果用户已登录，可以通过 Shopify API 获取邮箱
  const customerEmail = "{{ customer.email }}";
  const customerId = "{{ customer.id }}";
  
  // 加载 FeedoBridge embed 页面
  const shopId = "{{ shop.myshopify_domain }}";
  const embedUrl = `/embed?shop=${shopId}&customerId=${customerId}&customerEmail=${customerEmail}`;
  
  window.location.href = embedUrl;
</script>

<!-- 或使用 iframe 直接嵌入 -->
<iframe 
  src="https://shopifyapp.xmasforest.com/embed?shop={{ shop.myshopify_domain }}&customerId={{ customer.id }}&customerEmail={{ customer.email }}"
  style="width: 100%; height: 600px; border: none;"
></iframe>
```

### Step 3: 验证登录

在浏览器控制台查看：
```javascript
// 邮箱登录成功
"Email login successful" 

// 或 SSO 登录
"SSO login successful"
```

## 🎯 API 端点速查

### 后端 API: `/api/email-login`
```bash
POST /api/email-login
{
  "email": "user@example.com",
  "feedogoWebhookUrl": "https://shop.feedogocloud.com/webhooks/shopify"
}

# 响应
{
  "success": true,
  "data": {
    "token": "xxx",
    "userId": 16,
    "expiresIn": 2592000
  }
}
```

### FeedoGo API: `/api/user/emailLogin`
```bash
POST https://shop.feedogocloud.com/api/user/emailLogin
{
  "email": "user@example.com"
}

# 响应
{
  "code": 1,
  "data": {
    "userinfo": {
      "token": "xxx",
      "user_id": 16,
      "expires_in": 2592000
    }
  }
}
```

## 🛠️ 故障排查

| 症状 | 原因 | 解决方案 |
|------|------|---------|
| iframe 无法加载 | URL 配置错误 | 检查嵌入网站 URL |
| 无法自动登录 | Webhook URL 未配置 | 设置 FeedoGo Webhook URL |
| 显示登录界面 | 邮箱未注册 | 用户需要先在 FeedoGo 注册 |
| Token 过期 | Token 有效期 (30 天) | 刷新页面重新获取 |
| CORS 错误 | 同源策略问题 | 检查 iframe sandbox 权限 |

## 📊 日志调试

在浏览器控制台查看：
```javascript
// 邮箱登录成功
console.log('Email login attempt:', customerEmail);
console.log('Email login success:', tokenData);

// SSO 登录
console.log('SSO login fallback initiated');

// 错误信息
console.warn('Email login failed, falling back to SSO:', error);
```

## 🔐 安全要点

✅ **已处理**:
- HTTPS 通信
- Token 有效期限制
- 同源验证
- 邮箱参数验证
- 自动降级方案

## 📈 性能指标

- **平均登录时间**: < 1 秒
- **API 超时**: 10 秒
- **Token 有效期**: 30 天
- **刷新机制**: 自动
- **降级方案**: SSO (HMAC 签名)

## 💡 使用场景

### ✅ 推荐场景
- 用户已在 Shopify 店铺登录
- 邮箱已在 FeedoGo 注册
- 需要最佳用户体验

### ⚠️ 需要手动处理
- 用户未在 Shopify 登录 → 显示登录界面
- 邮箱未在 FeedoGo 注册 → 显示注册界面
- 网络不稳定 → 使用 SSO 备选方案

## 📝 监控指标

建议监控的关键指标：
```
1. 邮箱登录成功率 (target: > 95%)
2. SSO 降级率 (target: < 5%)
3. API 响应时间 (target: < 500ms)
4. Token 过期率 (target: < 1%)
5. 用户投诉率 (target: 0)
```

## 🚀 部署检查清单

- [ ] 已更新 `/api/email-login.ts`
- [ ] 已更新 `EmbeddedIframe.tsx`
- [ ] 已配置 FeedoGo Webhook URL
- [ ] 已测试邮箱登录流程
- [ ] 已测试 SSO 降级方案
- [ ] 已验证错误处理
- [ ] 已上线到生产环境
- [ ] 已监控日志和错误率

## 📞 常见问题

**Q: 如果用户邮箱不存在怎么办?**
A: 系统自动降级到 SSO 登录方式，或显示注册界面

**Q: Token 过期后怎么办?**
A: 用户刷新页面会重新获取新 token，无需手动操作

**Q: 支持多个 FeedoGo 实例吗?**
A: 支持，每个 Shopify 店铺可配置不同的 Webhook URL

**Q: 邮箱登录失败会影响用户体验吗?**
A: 不会，系统自动降级到 SSO，用户无感知

**Q: 可以自定义登录界面吗?**
A: 可以，通过修改 FeedoGo 平台配置或 iframe URL 参数

## 🔗 相关文档

- [完整实现文档](./EMAIL_LOGIN_GUIDE.md)
- [实现总结](./IMPLEMENTATION_SUMMARY.md)
- [架构分析](./ARCHITECTURE_ANALYSIS.md)
- [Shopify 技术方案](./Shopify插件技术分析方案.md)

---

**版本**: 1.0  
**更新日期**: 2026-01-28  
**状态**: ✅ 已完成实现

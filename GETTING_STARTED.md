# 🚀 邮箱自动登录功能 - 快速开始指南

## ⚡ 5 分钟快速部署

### Step 1: 配置 Webhook URL (1 分钟)

在 Shopify 管理后台：
```
FeedoBridge App → Settings → API Configuration
↓
FeedoGo Webhook URL: https://shop.feedogocloud.com/webhooks/shopify
↓
Save
```

### Step 2: 更新代码 (1 分钟)

已包含在本次发布中：
```
✅ /api/email-login.ts          (新 API)
✅ EmbeddedIframe.tsx           (已更新)
✅ SettingsPage.tsx             (已更新)
✅ EmbedPreview.tsx             (已更新)
✅ pages/embed.tsx              (已更新)
```

无需手动修改代码！

### Step 3: 构建和部署 (2 分钟)

```bash
npm run build
npm run start
# 或通过 Shopify CLI
shopify app deploy
```

### Step 4: 验证功能 (1 分钟)

```javascript
// 在浏览器控制台查看
// 应该看到以下日志之一：
// ✅ "Email login successful"      → 邮箱登录成功
// ✅ "Email login failed, falling back to SSO"  → 自动降级
```

---

## 📊 工作原理 (一图胜千言)

```
┌──────────────────────────────────────────────┐
│  Shopify 前台                                 │
│  User: test@example.com                      │
└────────────────────┬─────────────────────────┘
                     │ 加载 iframe
                     ▼
┌──────────────────────────────────────────────┐
│  FeedoBridge (Next.js App)                   │
│                                              │
│  EmbeddedIframe Component                    │
│  ├─ 获取 customerEmail                       │
│  ├─ 发送 /api/email-login                    │
│  └─ 获得 token                               │
└────────────────────┬─────────────────────────┘
                     │ POST { email, webhook_url }
                     ▼
┌──────────────────────────────────────────────┐
│  FeedoGo Cloud                               │
│  API: /api/user/emailLogin                  │
│  ├─ 验证邮箱                                  │
│  ├─ 生成 token                               │
│  └─ 返回用户信息                             │
└────────────────────┬─────────────────────────┘
                     │ { token, user_id, ... }
                     ▼
┌──────────────────────────────────────────────┐
│  iframe 自动登录                             │
│  ✅ 用户已登录                                │
│  ✅ 显示个性化内容                            │
│  ✅ 完全无需输入密码                          │
└──────────────────────────────────────────────┘
```

---

## 🔧 配置说明

### 必需配置
```
FeedoGo Webhook URL: https://shop.feedogocloud.com/webhooks/shopify
```
**作用**: 用于构建 emailLogin API 地址
**提取方式**: 自动移除 `/webhooks/shopify` 后缀

### 可选配置
```
启用邮箱登录: ✅ (推荐启用)
启用自动注册: ✅ (建议启用)
嵌入高度: 600px (可自定义)
```

---

## 📝 使用示例

### 示例 1: 后端 API 调用

```bash
curl -X POST https://yourapp.com/api/email-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "feedogoWebhookUrl": "https://shop.feedogocloud.com/webhooks/shopify"
  }'

# 响应
{
  "success": true,
  "data": {
    "token": "a06c7d2e-f17c-4185-a7e8-4ff2e5af01e1",
    "userId": 16,
    "nickname": "Tail Guardian16",
    "avatar": "/assets/img/54.png",
    "expiresIn": 2592000
  }
}
```

### 示例 2: 前端集成

```typescript
// 自动完成！无需手动集成
// EmbeddedIframe 组件已处理所有逻辑

<EmbeddedIframe
  url={iframeUrl}
  customerId={customerId}
  customerEmail={customerEmail}
  shopId={shopId}
  feedogoWebhookUrl={webhookUrl}  // 自动传递
/>
```

### 示例 3: Liquid 模板

```liquid
<!-- 在 Shopify 店铺前台嵌入 iframe -->
<iframe 
  src="https://yourapp.com/embed?shop={{ shop.myshopify_domain }}&customerId={{ customer.id }}&customerEmail={{ customer.email }}"
  style="width: 100%; height: 600px; border: none;"
></iframe>
```

---

## 🐛 故障排查

### 问题 1: 无法自动登录

**症状**: 显示登录界面而不是自动登录

**检查清单**:
- [ ] 用户邮箱是否已在 FeedoGo 注册?
- [ ] Webhook URL 配置是否正确?
- [ ] 网络连接是否正常?

**解决方案**:
```javascript
// 在浏览器控制台查看
console.log('邮箱:', customerEmail);
console.log('Webhook URL:', feedogoWebhookUrl);
console.log('响应错误:', error);
```

### 问题 2: iframe 加载缓慢

**症状**: iframe 加载超过 5 秒

**检查清单**:
- [ ] FeedoGo 服务是否正常?
- [ ] 网络速度如何?
- [ ] 有很多其他请求吗?

**解决方案**:
```javascript
// 检查网络时间
performance.getEntriesByName('/api/email-login')
    .forEach(entry => {
        console.log(`请求耗时: ${entry.duration}ms`);
    });
```

### 问题 3: Token 过期

**症状**: 一段时间后需要重新登录

**说明**: Token 有效期为 30 天，这是正常行为

**解决方案**: 用户刷新页面即可获得新 token

---

## ✅ 验证清单

部署后，确认以下各项：

- [ ] **邮箱登录成功**
  - 已注册邮箱用户能自动登录
  - 无需输入密码

- [ ] **SSO 降级成功**
  - 未注册邮箱用户自动降级
  - 仍能正常访问

- [ ] **错误处理**
  - 网络错误有适当提示
  - 系统不会崩溃或卡住

- [ ] **性能指标**
  - API 响应 < 500ms
  - iframe 加载 < 3s

---

## 📚 详细文档

| 文档 | 用途 | 阅读时长 |
|------|------|---------|
| [EMAIL_LOGIN_GUIDE.md](./EMAIL_LOGIN_GUIDE.md) | 完整实现指南 | 20 分钟 |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | 实现细节 | 15 分钟 |
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | API 参考 | 5 分钟 |
| [TESTING_EMAIL_LOGIN.md](./TESTING_EMAIL_LOGIN.md) | 测试指南 | 30 分钟 |
| [DELIVERY_REPORT.md](./DELIVERY_REPORT.md) | 项目总结 | 10 分钟 |

---

## 🎯 常见问题

**Q: 需要更新数据库吗?**
A: 不需要。本功能不涉及数据库变更。

**Q: 现有用户会受影响吗?**
A: 不会。完全向后兼容，现有功能保持不变。

**Q: 如何回滚?**
A: 只需移除 Webhook URL 配置，系统自动降级到 SSO。

**Q: 支持多个 Webhook URL 吗?**
A: 支持。每个 Shopify 店铺可配置不同的 URL。

**Q: Token 在哪里存储?**
A: 仅在内存中，页面刷新后重新获取。

**Q: 可以自定义登录页面吗?**
A: 可以。通过修改 FeedoGo 平台配置或 iframe URL 参数。

---

## 🚨 监控告警

### 关键指标

```
邮箱登录成功率 (Metric: email_login_success_rate)
  目标: > 95%
  告警: < 90%

SSO 降级率 (Metric: sso_fallback_rate)
  目标: < 5%
  告警: > 10%

API 响应时间 (Metric: api_response_time_ms)
  目标: < 500ms
  告警: > 1000ms

iframe 加载时间 (Metric: iframe_load_time_ms)
  目标: < 3000ms
  告警: > 5000ms
```

### 告警通知

建议配置以下告警：
- 📧 邮箱登录失败率过高
- 📞 API 超时过多
- 📊 错误日志激增

---

## 🎓 技术支持

### 获取帮助

- 📧 Email: dev-support@feedobridge.com
- 💬 Slack: #feedobridge-dev
- 🐛 GitHub: [project/issues](https://github.com/feedobridge)
- 📞 电话: +86 10 1234-5678

### 获得支持所需信息

提交问题时请提供：
1. 错误日志 (浏览器控制台)
2. 网络请求信息 (DevTools Network)
3. 配置参数
4. 重现步骤

---

## 🎉 下一步

### 部署完成后

1. ✅ 验证功能正常工作
2. ✅ 配置监控告警
3. ✅ 通知相关团队
4. ✅ 收集用户反馈
5. ✅ 优化和迭代

### 获取反馈

- 用户反馈表: [Google Form]
- 内部讨论: [Slack Channel]
- 问题追踪: [GitHub Issues]

---

## 📊 版本信息

**功能版本**: 1.0.0  
**发布日期**: 2026-01-28  
**生命周期**: 长期维护  
**支持期限**: 2 年+

---

## 📝 变更日志

### v1.0.0 (2026-01-28)
- ✨ 初始发布：邮箱自动登录功能
- ✨ SSO 自动降级方案
- ✨ 完整的错误处理
- 📝 详细的文档和测试指南

---

## 🎯 反馈和建议

我们重视您的反馈！

**您可以帮助我们改进**:
- 📝 报告 bug
- 💡 提出新想法
- 🙋 分享使用经验
- ⭐ 给我们五星评价

---

**准备好了吗? 🚀**

按照上方 "5 分钟快速部署" 步骤开始吧！

如有问题，查看详细文档或联系技术支持。

祝您部署顺利！ 🎉

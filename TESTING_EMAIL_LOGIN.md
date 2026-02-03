# 邮箱自动登录功能测试指南

## 🧪 测试环境准备

### 前置条件
1. ✅ FeedoBridge 应用已在 Shopify 店铺安装
2. ✅ FeedoGo Webhook URL 已配置
3. ✅ 至少 1 个测试用户账户已在 FeedoGo 注册
4. ✅ 测试用户邮箱与 Shopify 客户邮箱一致

### 测试账户信息表

| 账户 | 邮箱 | FeedoGo | Shopify | 状态 |
|-----|------|---------|---------|------|
| 测试用户 1 | test1@example.com | ✅ 已注册 | ✅ 已存在 | 就绪 |
| 测试用户 2 | test2@example.com | ❌ 未注册 | ✅ 已存在 | 测试降级 |
| 测试用户 3 | test3@example.com | ✅ 已注册 | ❌ 不存在 | 测试异常 |

---

## 🎯 功能测试用例

### TC-001: 邮箱登录成功流程

**测试目的**: 验证已注册邮箱的用户能自动登录

**前置条件**:
- 用户邮箱已在 FeedoGo 注册
- 用户已在 Shopify 前台登录

**测试步骤**:
```
1. 以 test1@example.com 身份登录 Shopify 店铺
2. 访问含 iframe 的页面
3. 等待 iframe 加载
4. 观察是否自动登录（无输入密码）
```

**预期结果**:
- ✅ iframe 快速加载（< 3 秒）
- ✅ 用户自动登录（无登录界面）
- ✅ 显示用户昵称和头像
- ✅ 浏览器控制台输出: `Email login successful`

**验证方式**:
```javascript
// 浏览器控制台
console.log('验证自动登录');
// 应该看到用户信息已加载
document.querySelector('iframe')  // iframe 已加载
```

---

### TC-002: SSO 降级流程

**测试目的**: 验证邮箱登录失败时自动降级到 SSO

**前置条件**:
- 用户邮箱未在 FeedoGo 注册
- Webhook URL 配置正确

**测试步骤**:
```
1. 以 test2@example.com 身份登录 Shopify 店铺
2. 访问含 iframe 的页面
3. 观察降级过程
4. 验证 SSO 登录
```

**预期结果**:
- ✅ 系统尝试邮箱登录（失败）
- ✅ 自动降级到 SSO 方式
- ✅ 浏览器控制台输出: `Email login failed, falling back to SSO`
- ✅ iframe 仍可正常工作

**验证方式**:
```javascript
// 浏览器控制台
// 查看是否有降级日志
window.console.logs  // 应包含 "falling back to SSO"
```

---

### TC-003: 无 Webhook URL 配置

**测试目的**: 验证未配置 Webhook URL 时直接使用 SSO

**前置条件**:
- Webhook URL 为空
- 用户已在 Shopify 登录

**测试步骤**:
```
1. 临时移除 Webhook URL 配置
2. 刷新页面
3. 观察使用的登录方式
```

**预期结果**:
- ✅ 跳过邮箱登录尝试
- ✅ 直接使用 SSO 登录
- ✅ iframe 正常加载

---

### TC-004: 未登录用户处理

**测试目的**: 验证未登录用户的处理

**前置条件**:
- 用户未在 Shopify 登录

**测试步骤**:
```
1. 清除 Shopify 登录状态
2. 访问 iframe 页面
3. 观察行为
```

**预期结果**:
- ✅ 显示 FeedoGo 登录界面
- ✅ 允许用户手动登录或注册
- ✅ 无错误提示

---

## ⚡ 性能测试

### PT-001: API 响应时间

**测试方法**:
```bash
# 1. 打开浏览器 DevTools → Network 标签
# 2. 访问 iframe 页面
# 3. 查看 /api/email-login 的响应时间

# 预期: < 500ms
```

**验证步骤**:
```javascript
// 在控制台执行
performance.getEntriesByName('/api/email-login')
    .forEach(entry => {
        console.log(`请求时间: ${entry.duration}ms`);
    });
```

### PT-002: iframe 加载时间

**测试方法**:
```javascript
// 在 iframe 的 onLoad 回调中
const startTime = performance.now();
// ... iframe 加载完成
const endTime = performance.now();
console.log(`iframe 加载时间: ${endTime - startTime}ms`);

// 预期: < 3000ms
```

---

## 🔍 错误处理测试

### ET-001: FeedoGo 服务不可用

**测试方法**:
```
1. 停止或限制 FeedoGo 服务
2. 尝试邮箱登录
3. 观察系统反应
```

**预期结果**:
- ✅ 自动降级到 SSO
- ✅ 显示友好的错误消息
- ✅ 不崩溃或卡住

### ET-002: 网络超时

**测试方法**:
```
1. 打开浏览器开发者工具
2. 在 Network 标签中限制速度
3. 触发邮箱登录
```

**预期结果**:
- ✅ 10 秒后超时
- ✅ 自动降级到 SSO
- ✅ 无挂起状态

### ET-003: 无效的 Webhook URL

**测试方法**:
```
1. 配置错误的 Webhook URL
2. 刷新页面
3. 观察处理
```

**预期结果**:
- ✅ 返回 404 错误
- ✅ 自动降级到 SSO
- ✅ 显示配置提示

---

## 🔐 安全测试

### ST-001: HTTPS 通信验证

**测试方法**:
```javascript
// 在浏览器控制台
console.log('当前协议:', window.location.protocol);
// 应输出: https:

// 检查 API 请求
fetch('/api/email-login').then(res => console.log(res.url));
// 应使用 https
```

### ST-002: 同源策略验证

**测试方法**:
```javascript
// iframe postMessage 应验证 origin
const message = { type: 'TEST' };
iframe.contentWindow.postMessage(message, 'https://wrong-origin.com');
// 应被忽略（不处理）
```

### ST-003: Token 有效期验证

**测试方法**:
```javascript
// 获取 token 信息
const tokenData = {
    token: '...',
    expiresIn: 2592000  // 30 天
};

// 计算过期时间
const expiresAt = new Date().getTime() + (tokenData.expiresIn * 1000);
console.log('Token 过期时间:', new Date(expiresAt));
```

---

## 📊 集成测试

### IT-001: 完整登录流程

**测试清单**:
- [ ] 1. 用户在 Shopify 登录
- [ ] 2. 访问 iframe 页面
- [ ] 3. API 调用 /api/email-login
- [ ] 4. FeedoGo API 验证邮箱
- [ ] 5. 返回 token
- [ ] 6. iframe 接收 TOKEN_DATA
- [ ] 7. 显示用户内容
- [ ] 8. 用户能正常交互

**验证脚本**:
```javascript
// 验证整个流程
const logs = {
    apiCalled: false,
    tokenReceived: false,
    iframeLoaded: false,
    userLoggedIn: false
};

// 监听 API 调用
window.addEventListener('fetch', (e) => {
    if (e.request.url.includes('/api/email-login')) {
        logs.apiCalled = true;
    }
});

// 监听 iframe 加载
document.querySelector('iframe').onload = () => {
    logs.iframeLoaded = true;
};

// 验证最终状态
setTimeout(() => {
    console.log('完整流程验证:', logs);
}, 5000);
```

---

## 🐛 调试技巧

### 1. 启用详细日志

在 API 端点添加日志:
```typescript
console.log('Email login attempt:', { email, feedogoWebhookUrl });
console.log('FeedoGo API response:', response.data);
console.log('Token data:', userInfo);
```

### 2. 浏览器控制台命令

```javascript
// 查看网络请求
fetch('/api/email-login', {
    method: 'POST',
    body: JSON.stringify({
        email: 'test@example.com',
        feedogoWebhookUrl: 'https://...'
    })
}).then(r => r.json()).then(console.log);

// 查看 iframe 消息
window.addEventListener('message', (e) => {
    console.log('Received message:', e.data);
});

// 查看 token 数据
window.__TOKEN_DATA__ = tokenData;
console.log(window.__TOKEN_DATA__);
```

### 3. 网络代理调试

使用 Charles 或 Fiddler:
```
1. 设置代理拦截 /api/email-login 请求
2. 修改请求/响应体进行测试
3. 观察客户端处理
```

---

## ✅ 测试检查清单

### 功能性测试
- [ ] 邮箱登录成功
- [ ] SSO 降级流程
- [ ] 未登录用户处理
- [ ] Token 有效期处理
- [ ] 多设备支持

### 性能测试
- [ ] API 响应 < 500ms
- [ ] iframe 加载 < 3s
- [ ] 内存泄漏检查
- [ ] 缓存效率验证

### 安全测试
- [ ] HTTPS 通信验证
- [ ] 同源策略验证
- [ ] Token 安全性
- [ ] 参数验证

### 兼容性测试
- [ ] Chrome 浏览器
- [ ] Firefox 浏览器
- [ ] Safari 浏览器
- [ ] Edge 浏览器
- [ ] 移动浏览器

### 错误处理测试
- [ ] FeedoGo 不可用
- [ ] 网络超时
- [ ] 无效 URL
- [ ] 邮箱不存在

---

## 📈 测试报告模板

```
测试日期: 2026-01-28
测试环境: Staging
测试人员: [名字]

总体结果: ✅ PASS / ❌ FAIL

详细结果:
┌─────────────────────┬────────┬──────────┐
│ 测试用例           │ 结果    │ 备注      │
├─────────────────────┼────────┼──────────┤
│ TC-001              │ ✅ PASS│ 无异常   │
│ TC-002              │ ✅ PASS│ 正常降级 │
│ TC-003              │ ✅ PASS│ 使用 SSO │
│ TC-004              │ ✅ PASS│ 显示登录 │
│ PT-001              │ ✅ PASS│ 350ms   │
│ PT-002              │ ✅ PASS│ 1.2s    │
│ ST-001              │ ✅ PASS│ HTTPS   │
│ IT-001              │ ✅ PASS│ 完整流程 │
└─────────────────────┴────────┴──────────┘

遇到的问题:
[问题描述]

建议:
[优化建议]

批准签名: ________________  日期: ________
```

---

## 🚀 发布前检查

在部署到生产环境前：

- [ ] 所有测试用例通过
- [ ] 性能指标达标
- [ ] 安全审计完成
- [ ] 错误处理完善
- [ ] 文档更新完成
- [ ] 监控告警配置
- [ ] 回滚方案准备
- [ ] 用户文档发布

---

**版本**: 1.0  
**更新日期**: 2026-01-28  
**维护者**: Development Team

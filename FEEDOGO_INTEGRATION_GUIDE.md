# FeedoGo 前端集成指南

## 概述
FeedoBridge 已经成功调用 FeedoGo 的 `emailLogin` API 并获取了 token。现在需要 FeedoGo 前端处理这个 token 以实现自动登录。

## Token 传递方式

FeedoBridge 使用 **三种方式** 同时传递 token，FeedoGo 前端只需选择其中一种实现：

### 方式 1：URL 查询参数（推荐）

**URL 格式**：
```
https://feedogocloud.com/?token=xxx&user_id=28&username=xxx&nickname=xxx&shop=feedogostore.myshopify.com&method=email-login&auto_login=1
```

**参数说明**：
- `token`: 用户登录 token（String）
- `user_id`: 用户 ID（Number）
- `username`: 用户名（String，可能为空）
- `nickname`: 昵称（String）
- `shop`: Shopify 商店域名
- `method`: 固定值 "email-login"
- `auto_login`: 固定值 "1"，表示需要自动登录

**FeedoGo 前端实现示例**：
```javascript
// 在 Vue/React 应用入口处添加
function checkAutoLogin() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const autoLogin = urlParams.get('auto_login');
  
  if (token && autoLogin === '1') {
    // 存储 token 到 localStorage
    localStorage.setItem('userToken', token);
    localStorage.setItem('userId', urlParams.get('user_id'));
    localStorage.setItem('username', urlParams.get('username') || '');
    localStorage.setItem('nickname', urlParams.get('nickname') || '');
    
    // 设置到 Axios 默认 header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // 清理 URL 参数（可选，防止刷新时重复处理）
    window.history.replaceState({}, document.title, window.location.pathname);
    
    console.log('✅ 自动登录成功');
  }
}

// 在应用启动时调用
checkAutoLogin();
```

---

### 方式 2：URL Hash（备选）

**URL 格式**：
```
https://feedogocloud.com/#auth=%7B%22token%22%3A%22xxx%22%2C%22userId%22%3A28%7D
```

解码后的 hash 内容：
```json
{
  "token": "61e11789-1a94-4570-9197-8dcf94e3f8d5",
  "userId": 28,
  "username": "user123",
  "nickname": "用户昵称",
  "autoLogin": true
}
```

**FeedoGo 前端实现示例**：
```javascript
function checkHashAutoLogin() {
  const hash = window.location.hash;
  if (hash.startsWith('#auth=')) {
    try {
      const authData = JSON.parse(decodeURIComponent(hash.substring(6)));
      
      if (authData.autoLogin && authData.token) {
        localStorage.setItem('userToken', authData.token);
        localStorage.setItem('userId', authData.userId);
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
        
        // 清理 hash
        window.location.hash = '';
        
        console.log('✅ Hash 自动登录成功');
      }
    } catch (e) {
      console.error('Hash 解析失败:', e);
    }
  }
}

checkHashAutoLogin();
```

---

### 方式 3：PostMessage（高级）

FeedoBridge 在 iframe 加载后会通过 `window.postMessage` 发送 token 数据。

**消息格式**：
```javascript
{
  type: 'TOKEN_DATA',
  id: 123,                    // 用户记录 ID
  userId: 28,                 // 用户 ID
  username: 'user123',
  nickname: '用户昵称',
  mobile: '13800138000',
  avatar: 'https://...',
  score: 100,
  token: '61e11789-1a94-4570-9197-8dcf94e3f8d5',
  createtime: 1234567890,
  expiretime: 1234567890,
  expiresIn: 2592000
}
```

**FeedoGo 前端实现示例**：
```javascript
// 监听来自父窗口的消息
window.addEventListener('message', function(event) {
  // 安全检查：验证来源
  if (event.origin !== 'https://shopifyapp.xmasforest.com') {
    return;
  }
  
  if (event.data.type === 'TOKEN_DATA' && event.data.token) {
    console.log('收到来自 Shopify 的 token:', event.data);
    
    // 存储 token
    localStorage.setItem('userToken', event.data.token);
    localStorage.setItem('userId', event.data.userId);
    localStorage.setItem('username', event.data.username || '');
    localStorage.setItem('nickname', event.data.nickname || '');
    
    // 设置 Axios header
    axios.defaults.headers.common['Authorization'] = `Bearer ${event.data.token}`;
    
    // 发送确认消息（可选）
    event.source.postMessage({
      type: 'EMAIL_LOGIN_SUCCESS',
      userId: event.data.userId
    }, event.origin);
    
    console.log('✅ PostMessage 自动登录成功');
  }
});
```

---

## 推荐实现方案

**最简单的实现**：在应用入口（如 `App.vue` 或 `index.js`）添加以下代码：

```javascript
// 完整的自动登录检测代码
(function initShopifyAutoLogin() {
  // 方法1: 检查 URL 参数
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token && urlParams.get('auto_login') === '1') {
    console.log('🔗 检测到 Shopify 自动登录 (URL 参数)');
    
    localStorage.setItem('userToken', token);
    localStorage.setItem('userId', urlParams.get('user_id') || '');
    localStorage.setItem('username', urlParams.get('username') || '');
    localStorage.setItem('nickname', urlParams.get('nickname') || '');
    
    if (window.axios) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // 清理 URL（可选）
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    
    console.log('✅ Shopify 自动登录成功');
    return;
  }
  
  // 方法2: 监听 postMessage（作为备用）
  window.addEventListener('message', function(event) {
    if (event.data.type === 'TOKEN_DATA' && event.data.token) {
      console.log('📨 收到 Shopify postMessage token');
      
      localStorage.setItem('userToken', event.data.token);
      localStorage.setItem('userId', event.data.userId);
      
      if (window.axios) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${event.data.token}`;
      }
      
      console.log('✅ PostMessage 自动登录成功');
    }
  });
})();
```

---

## 测试验证

### 1. 检查 URL 参数
在浏览器控制台运行：
```javascript
console.log(window.location.href);
// 应该看到: ?token=xxx&user_id=28&auto_login=1
```

### 2. 检查 localStorage
```javascript
console.log(localStorage.getItem('userToken'));
// 应该输出 token 值
```

### 3. 检查登录状态
```javascript
// 根据 FeedoGo 现有的用户状态检查方式
console.log('当前用户:', store.state.user); // Vuex
// 或
console.log('当前用户:', this.$store.getters.currentUser);
```

---

## 常见问题

### Q1: 为什么 iframe 中看不到 URL 参数？
A: 请检查浏览器控制台是否有跨域错误。如果 FeedoGo 网站和 Shopify 应用不同域，需要确保 CORS 配置正确。

### Q2: 如何调试 postMessage？
A: 在控制台添加全局监听：
```javascript
window.addEventListener('message', e => console.log('Message received:', e.data));
```

### Q3: Token 过期怎么办？
A: emailLogin API 返回的 token 包含 `expiretime` 和 `expiresIn` 字段，FeedoGo 前端应该检查 token 是否过期，并在过期时清理 localStorage。

---

## 联系支持

如有集成问题，请联系 FeedoBridge 开发团队：
- GitHub Issues: https://github.com/Nopassdeve/FeedoBridge/issues
- 当前实现状态：✅ emailLogin API 调用成功，token 已传递到 iframe

**已验证的功能**：
- ✅ Shopify 客户信息获取
- ✅ emailLogin API 调用成功
- ✅ Token 生成成功（示例：`61e11789-1a94-4570-9197-8dcf94e3f8d5`）
- ✅ URL 参数传递成功
- ✅ PostMessage 发送成功
- ⚠️ FeedoGo 前端 token 处理：待实现

**下一步**：FeedoGo 前端团队需要选择上述任一方式处理 token 以完成自动登录功能。

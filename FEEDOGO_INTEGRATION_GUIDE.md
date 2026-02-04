# Shopify × FeedoGo 自动登录集成文档

> **收件人**: FeedoGo 前端开发团队  
> **发件人**: FeedoBridge 开发团队  
> **日期**: 2026-02-04  
> **主题**: Shopify 自动登录功能集成需求

---

## 📋 概述

FeedoBridge（Shopify 应用）已完成与 FeedoGo 的 API 对接，成功调用了贵方的 `emailLogin` 接口并获取了用户 token。现需要 **FeedoGo 前端添加代码读取 token 并自动登录用户**。

---

## ✅ 已完成的工作（Shopify 侧）

1. ✅ 获取 Shopify 登录用户的邮箱
2. ✅ 调用 FeedoGo API: `POST https://shop.feedogocloud.com/api/user/emailLogin`
3. ✅ 成功获取 token 和用户信息
4. ✅ 将 token 传递到 iframe（3种方式同时传递）

### API 调用示例
```javascript
// Shopify 端调用
POST https://shop.feedogocloud.com/api/user/emailLogin
Content-Type: application/json

{
  "email": "nopassdeve@gmail.com"
}

// 成功响应（贵方 API 返回）
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
      "token": "a06c7d2e-f17c-4185-a7e8-4ff2e5af01e1",  // ← 这个 token 需要前端处理
      "user_id": 16,
      "createtime": 1769505130,
      "expiretime": 1772097130,
      "expires_in": 2592000
    }
  }
}
```

---

## 🔧 需要 FeedoGo 前端实现的功能

当用户从 Shopify 商店访问 FeedoGo 时，URL 会携带 token 参数：

```
https://feedogocloud.com/?token=a06c7d2e-f17c-4185-a7e8-4ff2e5af01e1&user_id=16&username=&nickname=Tail%20Guardian16&shop=feedogostore.myshopify.com&method=email-login&auto_login=1
```

**前端需要**：
1. 检测 URL 中是否有 `token` 和 `auto_login=1` 参数
2. 如果有，将 token 存储到 localStorage（或贵方使用的状态管理方案）
3. 设置用户登录状态
4. 清理 URL 参数（避免刷新重复处理）

---

## 💻 实现代码（复制粘贴即可）

### 方案 1：在应用入口添加（推荐，最简单）

在 FeedoGo 前端的入口文件（如 `App.vue`、`main.js` 或 `index.js`）中添加以下代码：

```javascript
/**
 * Shopify 自动登录处理
 * 检测 URL 参数中的 token，如果存在则自动登录
 */
(function initShopifyAutoLogin() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const userId = urlParams.get('user_id');
  const autoLogin = urlParams.get('auto_login');
  
  if (token && userId && autoLogin === '1') {
    console.log('🔗 检测到 Shopify 自动登录', { userId, token: token.substring(0, 20) + '...' });
    
    // 1. 存储 token 和用户信息（根据贵方实际使用的 key 调整）
    localStorage.setItem('token', token);                              // 必须
    localStorage.setItem('user_id', userId);                           // 必须
    localStorage.setItem('username', urlParams.get('username') || ''); // 可选
    localStorage.setItem('nickname', urlParams.get('nickname') || ''); // 可选
    
    // 2. 如果使用 Vuex/Pinia，需要提交到 store（根据实际情况调整）
    // if (window.$store) {
    //   window.$store.commit('SET_TOKEN', token);
    //   window.$store.commit('SET_USER_INFO', {
    //     id: userId,
    //     username: urlParams.get('username'),
    //     nickname: urlParams.get('nickname')
    //   });
    // }
    
    // 3. 设置 axios 请求头（如果 API 需要 token 认证）
    if (window.axios) {
      window.axios.defaults.headers.common['token'] = token;
      // 或者根据贵方的认证方式：
      // window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // 4. 清理 URL 参数（避免刷新时重复处理，保留 hash）
    const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);
    
    console.log('✅ Shopify 自动登录成功');
    
    // 5. 可选：重新加载用户数据或刷新页面
    // location.reload();
  }
})();
```

### 方案 2：Vue 3 Composition API 示例

如果使用 Vue 3，可以在 `App.vue` 中：

```vue
<script setup>
import { onMounted } from 'vue';
import { useUserStore } from '@/stores/user'; // 假设使用 Pinia

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const userId = urlParams.get('user_id');
  
  if (token && userId && urlParams.get('auto_login') === '1') {
    const userStore = useUserStore();
    
    // 存储到 store
    userStore.setToken(token);
    userStore.setUserInfo({
      id: userId,
      username: urlParams.get('username') || '',
      nickname: urlParams.get('nickname') || ''
    });
    
    // 清理 URL
    window.history.replaceState({}, '', window.location.pathname);
    
    console.log('✅ Shopify 自动登录成功');
  }
});
</script>
```

### 方案 3：React 示例

```jsx
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setToken, setUserInfo } from './store/userSlice';

function App() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userId = urlParams.get('user_id');
    
    if (token && userId && urlParams.get('auto_login') === '1') {
      // 存储到 Redux
      dispatch(setToken(token));
      dispatch(setUserInfo({
        id: userId,
        username: urlParams.get('username') || '',
        nickname: urlParams.get('nickname') || ''
      }));
      
      // 清理 URL
      window.history.replaceState({}, '', window.location.pathname);
      
      console.log('✅ Shopify 自动登录成功');
    }
  }, [dispatch]);
  
  return <div>...</div>;
}
```

---

## 📊 URL 参数说明

| 参数 | 类型 | 示例值 | 说明 |
|------|------|--------|------|
| `token` | String | `a06c7d2e-f17c-4185-a7e8-4ff2e5af01e1` | 用户登录 token（来自 emailLogin API） |
| `user_id` | String | `16` | 用户 ID（对应 API 返回的 `user_id`） |
| `username` | String | `""` | 用户名（可能为空） |
| `nickname` | String | `Tail Guardian16` | 昵称 |
| `shop` | String | `feedogostore.myshopify.com` | Shopify 商店域名 |
| `method` | String | `email-login` | 固定值，标识登录方式 |
| `auto_login` | String | `1` | 固定值，标识需要自动登录 |

---

## 🧪 测试验证

### 1. 打开浏览器开发者工具

访问 Shopify 商店的 FeedoGo 嵌入页面后，按 F12 打开控制台。

### 2. 检查 URL 是否包含 token

```javascript
console.log('当前 URL:', window.location.href);
// 应该看到：https://feedogocloud.com/?token=xxx&user_id=16&auto_login=1
```

### 3. 检查 localStorage 是否存储成功

```javascript
console.log('Token:', localStorage.getItem('token'));
console.log('User ID:', localStorage.getItem('user_id'));
// 应该输出对应的值
```

### 4. 检查登录状态

```javascript
// 根据贵方的用户状态检查方式
console.log('当前用户:', window.$store?.state?.user); // Vuex
// 或
console.log('登录状态:', !!localStorage.getItem('token'));
```

---

## 🔄 备用方案：PostMessage

如果 URL 参数方式不可行，我们还同时通过 `postMessage` 发送了 token 数据。

**接收代码**：
```javascript
window.addEventListener('message', function(event) {
  // 安全验证：确认来源
  if (event.origin !== 'https://shopifyapp.xmasforest.com') {
    return;
  }
  
  if (event.data.type === 'TOKEN_DATA' && event.data.token) {
    console.log('📨 收到 Shopify postMessage token');
    
    // 存储 token
    localStorage.setItem('token', event.data.token);
    localStorage.setItem('user_id', event.data.userId);
    
    console.log('✅ PostMessage 自动登录成功');
  }
});
```

---

## ⚠️ 注意事项

1. **Token 存储 Key**: 请根据贵方现有代码使用的 localStorage key 调整（如 `token`、`userToken`、`access_token` 等）
2. **状态管理**: 如果使用 Vuex/Pinia/Redux，需要在上述代码中添加对应的 commit/dispatch
3. **API 认证**: 确认贵方 API 请求的 token 传递方式（header 中的 key 是 `token`、`Authorization` 还是其他）
4. **Token 过期**: API 返回的 `expiretime` 可用于判断 token 是否过期

---

## 📞 技术支持

如有任何疑问或需要协助，请联系：

- **GitHub**: https://github.com/Nopassdeve/FeedoBridge
- **邮箱**: nopassdeve@gmail.com

---

## ✨ 总结

**Shopify 侧**：✅ 已完成  
**FeedoGo 侧**：⏳ 需添加上述任一代码即可完成集成

**预计工作量**：约 10-20 分钟（复制粘贴代码 + 根据实际项目调整）

**集成完成后效果**：Shopify 用户访问嵌入的 FeedoGo 页面时，将自动登录，无需手动输入账号密码。

# Shopify 应用安装问题修复指南

## 🚨 问题：安装链接无效

### 原因
Shopify Partners 后台配置与实际请求不匹配。

---

## ✅ 解决方案：在 Shopify Partners 后台配置

### 步骤 1：登录 Shopify Partners
访问：https://partners.shopify.com

### 步骤 2：找到 FeedoBridge 应用
Apps → 点击 FeedoBridge

### 步骤 3：进入 Configuration 标签页

### 步骤 4：确保以下配置完全匹配

#### App URL（必填）
```
https://shopifyapp.xmasforest.com
```

#### Allowed redirection URL(s)（必填）
```
https://shopifyapp.xmasforest.com/api/auth/callback
```

#### App setup（应用设置）
- Extension点击 "Configure" 或 "Set up"
- 确保勾选 "Embedded app" (嵌入式应用)

### 步骤 5：配置 Access scopes（权限范围）

在 "API access scopes" 部分，确保勾选以下权限：

**Products（产品）**
- ✅ read_products
- ✅ write_products

**Customers（客户）**
- ✅ read_customers  
- ✅ write_customers

**Orders（订单）**
- ✅ read_orders
- ✅ write_orders

### 步骤 6：保存所有更改
点击页面顶部或底部的 "Save" 按钮

---

## 🔄 配置保存后的操作

### 方法 1：从 Shopify Admin 安装（最简单）

1. 登录你的 Shopify 商店后台  
   https://feedogostore.myshopify.com/admin

2. 进入 **Apps** 页面  
   https://feedogostore.myshopify.com/admin/apps

3. 点击右上角 **"Develop apps"** 或 **"开发应用"**

4. 找到 **FeedoBridge**，点击

5. 点击 **"安装应用"** 或 **"Install app"**

---

### 方法 2：使用测试商店链接

在 Shopify Partners 的 FeedoBridge 应用页面：

1. 找到 **"Test your app"** 部分
2. 选择商店：feedogostore.myshopify.com  
3. 点击 **"Test app"** 按钮
4. 会自动打开安装页面

---

### 方法 3：生成自定义安装链接

1. 在 Shopify Partners，进入 **Distribution** 标签
2. 找到 **"Get install link"**
3. 选择 `feedogostore.myshopify.com`
4. 复制生成的链接并访问

---

## 📝 验证配置是否正确

保存配置后，访问这个检查端点：

```
https://shopifyapp.xmasforest.com/api/check-config
```

应该看到：
```json
{
  "SHOPIFY_API_KEY": "9da46159e4...",
  "expectedConfig": {
    "applicationUrl": "https://shopifyapp.xmasforest.com",
    "redirectUrls": ["https://shopifyapp.xmasforest.com/api/auth/callback"],
    "scopes": "read_products,write_products,read_customers,write_customers,read_orders,write_orders"
  }
}
```

确保 `scopes` 包含所有需要的权限。

---

## ⚠️ 常见错误

### 错误 1：App URL 末尾有斜杠
❌ 错误：`https://shopifyapp.xmasforest.com/`  
✅ 正确：`https://shopifyapp.xmasforest.com`

### 错误 2：Redirect URL 不匹配
确保 Redirect URL 列表中包含：  
`https://shopifyapp.xmasforest.com/api/auth/callback`

### 错误 3：权限未勾选
必须在 "API access scopes" 中勾选所有需要的权限。

---

## 📞 如果还是不行

1. 在 Shopify Partners 后台截图当前配置
2. 提供错误截图
3. 检查浏览器控制台（F12）是否有错误信息

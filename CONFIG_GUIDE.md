# ⚙️ FeedoBridge 后台配置说明

## 📋 配置字段说明

根据FeedoGo提供的API文档，以下是各个配置字段的填写方法：

---

## ✅ 必填配置

### FeedoGo Webhook URL

**填写内容**:
```
https://shop.feedogocloud.com
```

**说明**:
- 这是最重要的配置，必须填写
- 这是FeedoGo的基础URL地址
- 系统会自动拼接API路径：
  - `/api/user/emailLogin` - 邮箱登录（自动注册新用户）
  - `/api/user/exchangeLoveCoin` - 爱心币兑换
  - `/api/user/profile` - 修改用户信息
  - `/api/common/upload` - 上传文件

**注意**: 
- ✅ 正确：`https://shop.feedogocloud.com`
- ❌ 错误：`https://shop.feedogocloud.com/webhooks/shopify`

---

## ⚠️ 可选配置（可留空）

### FeedoGo API Key

**填写内容**:
```
留空即可
```

**说明**:
- FeedoGo提供的API不需要API Key认证
- 这个字段可以留空
- 如果已经填写了任意值，不影响功能

---

### FeedoGo SSO Secret

**填写内容**:
```
留空即可
```

**说明**:
- 当前使用邮箱自动登录，不需要SSO密钥
- 这个字段可以留空
- SSO方式仅作为降级方案

---

## 🎯 完整配置示例

在 Shopify 管理后台 → FeedoBridge App → Settings → API Configuration：

```
┌─────────────────────────────────────────────────┐
│  FeedoGo Base URL (必填):                       │
│  https://shop.feedogocloud.com                  │
├─────────────────────────────────────────────────┤
│  FeedoGo API Key (可选):                        │
│  [留空]                                         │
├─────────────────────────────────────────────────┤
│  FeedoGo SSO Secret (可选):                     │
│  [留空]                                         │
└─────────────────────────────────────────────────┘
```

---

## 🔧 其他配置

### 启用自动注册

```
☑ Enable Auto Register
```
- 建议启用
- 用户注册时自动记录映射关系

### 启用 SSO

```
☑ Enable SSO
```
- 建议启用
- 作为邮箱登录的降级方案

### 嵌入 iframe URL

```
https://shop.feedogocloud.com
```
- 这是要嵌入的FeedoGo页面地址

### 嵌入高度

```
600
```
- iframe的高度（像素）
- 可根据需要调整

---

## ✅ 配置验证

配置保存后，可以通过以下方式验证：

### 1. 测试邮箱登录

访问测试页面：
```
https://shopifyapp.xmasforest.com/test-sync?shop=yourstore.myshopify.com
```

输入一个在FeedoGo已注册的邮箱，测试是否能成功同步。

### 2. 测试订单同步

访问测试页面：
```
https://shopifyapp.xmasforest.com/test-order-sync?shop=yourstore.myshopify.com
```

输入邮箱和金额，测试爱心币兑换是否成功。

### 3. 查看连接状态

在设置页面的"API配置"标签，点击"测试连接"按钮。

---

## 🚨 常见问题

### Q1: Base URL 填写错误会怎样？

**现象**: 所有功能都无法正常工作
**解决**: 确保URL格式正确，应该是 `https://shop.feedogocloud.com`（不要加 /webhooks/shopify）

### Q2: API Key 留空会影响功能吗？

**答案**: 不会！FeedoGo的API不需要API Key，留空完全正常。

### Q3: 如何知道配置是否生效？

**方法**:
1. 保存配置后，使用测试页面验证
2. 查看服务器日志：
   ```bash
   ssh root@76.13.98.3
   cd /opt/feedobridge
   docker compose logs -f app
   ```

### Q4: 配置后需要重启应用吗？

**答案**: 不需要！配置实时生效。

---

## 📊 配置对应的功能

| 配置项 | 对应功能 | 是否必需 |
|--------|---------|---------|
| Base URL | 所有FeedoGo API调用 | ✅ 必需 |
| API Key | 无（不使用） | ❌ 可选 |
| SSO Secret | SSO降级登录 | ❌ 可选 |
| Auto Register | 自动记录用户 | ✅ 建议启用 |
| Enable SSO | 登录降级 | ✅ 建议启用 |

---

## 🎉 配置完成后

配置完成后，系统会自动提供以下功能：

1. ✅ **邮箱自动登录**
   - 用户访问时自动登录，无需密码

2. ✅ **订单金额同步**
   - 用户下单时自动兑换爱心币

3. ✅ **客户信息记录**
   - 用户注册时自动记录映射关系

---

## 💡 最佳实践

1. **必须配置 Base URL**
   ```
   https://shop.feedogocloud.com
   ```

2. **启用自动注册和SSO**
   - 确保功能完整性

3. **定期测试**
   - 使用测试页面验证功能正常

4. **查看日志**
   - 遇到问题时检查服务器日志

---

## 📞 技术支持

如果配置后仍有问题，请提供：
1. Base URL配置
2. 错误信息截图
3. 服务器日志（如有权限）

---

**总结**: 只需要填写 **https://shop.feedogocloud.com** 即可，其他字段都可以留空！

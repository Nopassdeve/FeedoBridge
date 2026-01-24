# Thank You Modal 测试指南

## ⚠️ 重要:不要在 Editor 中测试!

你看到的 DataCloneError 是 **Shopify Checkout Editor 预览环境的限制**,不代表真实环境的问题。

## 正确测试步骤

### 1. 完整 Checkout 流程测试

1. **打开店铺前台**:
   ```
   https://feedogostore.myshopify.com
   ```

2. **添加商品到购物车**

3. **进入 Checkout 页面**

4. **完成测试订单**:
   - 使用 Shopify 测试信用卡: 1
   - 过期日期: 任何未来日期
   - CVV: 任何3位数字

5. **查看 Thank You 页面**:
   - 订单完成后会自动跳转
   - 在 "Customer information" 区域后应该看到模态框
   - 标题: "感谢您的购买!"
   - 内容: "我们已为您创建了 FeedoGo 账户,快来探索更多功能吧!"
   - 按钮: "立即探索"

### 2. 检查控制台

在 Thank You 页面打开浏览器控制台 (F12):

**可以忽略的错误**:
- ✅ `401 Unauthorized` → private_access_tokens (Shopify内部)
- ✅ `Failed to fetch` → OpenTelemetry metrics (Shopify遥测)
- ✅ `WebSocket connection failed` → Shopify Analytics
- ✅ `lit-element deprecated` → Shopify 内部依赖警告
- ✅ `A router only supports one blocker` → Shopify Editor 警告
- ✅ `Taxes are unavailable` → 测试环境正常

**需要关注的错误**:
- ❌ `ExtensionUsageError` 
- ❌ `DataCloneError` (如果在真实 Thank You 页面出现)
- ❌ Extension 相关的渲染错误

### 3. 验证按钮功能

1. 点击 "立即探索" 按钮
2. 应该跳转到: `https://feedogocloud.com/dashboard`
3. 验证 URL 是否正确

## 当前部署状态

- **版本**: feedobridge-15 (active)
- **部署时间**: 2026-01-24 13:54:34
- **扩展点**: purchase.thank-you.customer-information.render-after
- **实现方式**: 标准 JSX 组件 with default export

## 如果问题依然存在

### 场景 A: 真实 Thank You 页面没有显示模态框

可能原因:
1. 扩展未激活
2. 位置配置错误
3. 店铺设置问题

解决:
1. 进入 Shopify Admin → Settings → Checkout
2. 在 "Thank you" 页面部分检查 "Thank You Modal" 是否启用
3. 确认位置在 "Customer information" 下方

### 场景 B: 真实页面仍有 DataCloneError

这说明是 Shopify 平台限制,需要:
1. 联系 Shopify Support
2. 提供错误截图
3. 询问 thank-you 扩展点的 React 使用限制

### 场景 C: 模态框显示但样式/功能不对

检查:
1. Shopify UI Components 版本兼容性
2. 尝试更简单的组件 (Text only)
3. 逐步添加功能

## 技术背景

### 为什么 Editor 预览会报错?

Shopify Checkout Editor 使用**双重沙箱**:
1. 外层: Editor UI 沙箱
2. 内层: Extension 执行沙箱

在 Editor 中,React elements 需要在两个沙箱之间传递,可能触发 DataCloneError。

真实环境只有一层沙箱,不会有这个问题。

### 当前代码结构

```jsx
// index.jsx - CORRECT
export default function ThankYouModal() {
  return (
    <View border="base" cornerRadius="large" padding="large">
      <BlockStack spacing="base">
        <Heading level={2}>感谢您的购买!</Heading>
        <Text>我们已为您创建了 FeedoGo 账户,快来探索更多功能吧!</Text>
        <Button kind="primary" to="https://feedogocloud.com/dashboard">
          立即探索
        </Button>
      </BlockStack>
    </View>
  );
}
```

- ✅ 使用标准 JSX
- ✅ Default export (符合 module-based targeting)
- ✅ Shopify UI Components
- ✅ 所有 React 特性可用

## 下一步行动

1. **立即**: 在真实 checkout 流程中测试
2. **如果成功**: 记录可忽略的 Editor 错误
3. **如果失败**: 提供真实页面的错误截图

---

**记住**: Editor 预览 ≠ 真实环境

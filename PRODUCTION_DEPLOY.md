# 🚀 FeedoBridge 生产环境部署指南

## ✅ 清理完成

所有开发文档、测试文件和调试代码已删除，项目已准备好部署到生产环境。

---

## 📦 当前项目结构

```
FeedoBridge/
├── components/          # React 组件
│   ├── ApiSettings.tsx
│   ├── DashboardStats.tsx
│   ├── EmbedPreview.tsx
│   ├── EmbeddedIframe.tsx
│   ├── SettingsPage.tsx
│   └── ThankYouModalSettings.tsx
├── extensions/          # Shopify 扩展
│   ├── thank-you-modal/
│   └── theme-app-extension/
├── lib/                 # 核心库
│   ├── auth.ts         # 认证逻辑
│   ├── prisma.ts       # 数据库客户端
│   ├── redis.ts        # Redis 客户端
│   └── shopify.ts      # Shopify API + Webhook 验证
├── pages/              # Next.js 页面
│   ├── api/            # API 路由
│   │   ├── auth/       # OAuth 认证
│   │   │   ├── callback.ts
│   │   │   └── index.ts
│   │   ├── sso/        # 单点登录
│   │   │   └── generate-signature.ts
│   │   ├── webhooks/   # Shopify Webhooks
│   │   │   ├── app-uninstalled.ts
│   │   │   ├── customers-create.ts
│   │   │   ├── order-auto-register.ts
│   │   │   ├── orders-create.ts
│   │   │   └── register.ts
│   │   ├── email-login.ts      # 邮箱自动登录
│   │   ├── order-logs.ts       # 订单同步日志
│   │   ├── settings.ts         # 应用设置
│   │   ├── stats.ts            # 统计数据
│   │   └── sync-customer.ts    # 客户同步
│   ├── _app.tsx        # App 入口
│   ├── embed.tsx       # 嵌入页面
│   └── index.tsx       # 主页
├── prisma/
│   └── schema.prisma   # 数据库模型
├── .env.example        # 环境变量模板
├── README.md           # 项目说明
├── next.config.js      # Next.js 配置
├── package.json        # 依赖管理
├── shopify.app.toml    # Shopify 应用配置
└── tsconfig.json       # TypeScript 配置
```

---

## 🎯 生产环境配置

### 环境变量 (.env)

```bash
# Shopify App 配置
SHOPIFY_API_KEY=9da46159e4de788dab1f3cc2533551e4
SHOPIFY_API_SECRET=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
SCOPES=read_products,write_products,read_customers,write_customers,read_orders,write_orders

# 应用 URL
APP_URL=https://plugin.ifeedog.com
HOST=https://plugin.ifeedog.com

# 数据库
DATABASE_URL=postgresql://postgres:password@db:5432/feedobridge

# Redis
REDIS_URL=redis://redis:6379

# FeedoGo API
FEEDOGO_BASE_URL=https://shop.feedogocloud.com

# JWT (可选)
JWT_SECRET=your-secret-key
```

---

## 📋 部署步骤

### 1. 本地构建测试

```bash
# 安装依赖
npm install

# 生成 Prisma Client
npx prisma generate

# 构建项目
npm run build

# 本地运行测试
npm start
```

### 2. 部署到 VPS

```bash
# 同步代码到服务器
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  ./ root@31.97.211.143:/opt/feedobridge/

# SSH 到服务器
ssh root@31.97.211.143

# 进入项目目录
cd /opt/feedobridge

# 重启容器
docker compose down && docker compose up -d

# 等待构建完成（约 2-3 分钟）
sleep 180

# 检查日志
docker logs feedobridge-app-1 --tail 50

# 验证应用启动
docker logs feedobridge-app-1 2>&1 | grep "Ready in"
```

### 3. 验证部署

```bash
# 健康检查
curl "https://plugin.ifeedog.com/api/test-db?shop=feedogostore.myshopify.com"
# 应返回: {"status": "ok", ...}

# 检查设置
curl "https://plugin.ifeedog.com/api/settings?shop=feedogostore.myshopify.com"
# 应返回配置信息

# 检查 Webhooks
curl "https://plugin.ifeedog.com/api/webhooks/register?shop=feedogostore.myshopify.com"
# 应返回 3 个已注册的 webhooks
```

---

## ✨ 核心功能

### 1. OAuth 认证
- **入口**: `/api/auth`
- **回调**: `/api/auth/callback`
- **作用**: 安装应用时获取 Shopify access token

### 2. Webhook 处理
- **订单创建**: `/api/webhooks/orders-create`
  - 自动将订单金额兑换为 FeedoGo 爱心币
  - 记录到 OrderPushLog 表
- **客户创建**: `/api/webhooks/customers-create`
  - 自动注册客户到 FeedoGo（如果启用）
- **应用卸载**: `/api/webhooks/app-uninstalled`
  - 清理店铺数据

### 3. 邮箱自动登录
- **接口**: `/api/email-login`
- **作用**: 嵌入页面自动登录 FeedoGo
- **流程**: 
  1. 前端传入客户邮箱
  2. 调用 FeedoGo emailLogin API
  3. 返回 token 用于自动登录

### 4. 嵌入页面
- **路由**: `/embed`
- **参数**: `?shop=xxx&customerId=xxx&email=xxx`
- **作用**: 在 Shopify 商店嵌入 FeedoGo 页面

---

## 🔒 安全特性

- ✅ Webhook 签名验证（HMAC-SHA256）
- ✅ OAuth token 安全存储
- ✅ HTTPS 强制加密
- ✅ 环境变量保护敏感信息
- ✅ Prisma 防止 SQL 注入
- ✅ Redis 会话管理

---

## 📊 监控建议

### 日志监控
```bash
# 实时日志
docker logs feedobridge-app-1 -f

# 错误日志
docker logs feedobridge-app-1 2>&1 | grep -i error

# Webhook 日志
docker logs feedobridge-app-1 2>&1 | grep "webhook\|订单\|客户"
```

### 数据库监控
```bash
# 查看订单同步统计
curl "https://plugin.ifeedog.com/api/order-logs?shop=YOUR_SHOP"

# 查看应用统计
curl "https://plugin.ifeedog.com/api/stats?shop=YOUR_SHOP"
```

---

## 🆘 故障排查

### 应用无法访问
```bash
# 检查容器状态
docker ps | grep feedobridge

# 检查 Nginx 配置
systemctl status nginx
curl -I https://plugin.ifeedog.com
```

### Webhook 不触发
```bash
# 检查 Webhook 注册状态
curl "https://plugin.ifeedog.com/api/webhooks/register?shop=YOUR_SHOP"

# 检查最近的 webhook 日志
docker logs feedobridge-app-1 --tail 100 | grep webhook
```

### 数据库连接失败
```bash
# 检查数据库容器
docker ps | grep feedobridge-db

# 测试数据库连接
docker exec feedobridge-db-1 psql -U postgres -d feedobridge -c "SELECT NOW();"
```

---

## 📞 支持信息

- **VPS IP**: 31.97.211.143
- **应用域名**: https://plugin.ifeedog.com
- **Shopify Store**: feedogostore.myshopify.com
- **数据库**: PostgreSQL 15
- **缓存**: Redis 7

---

## ✅ 生产就绪检查清单

- [x] 所有开发文档已删除
- [x] 测试文件和脚本已删除
- [x] 调试日志已清理
- [x] 环境变量已配置
- [x] 数据库表已创建
- [x] Webhooks 已注册
- [x] OAuth 流程测试通过
- [x] 爱心币兑换功能正常
- [x] 邮箱自动登录正常
- [x] SSL 证书有效
- [x] 防火墙配置正确

**🎉 系统已准备好投入生产使用！**

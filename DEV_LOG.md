# FeedoBridge 开发记录

## 项目信息

| 项目 | 信息 |
|-----|------|
| 项目名称 | FeedoBridge |
| 开发者 | NopassDev |
| GitHub | https://github.com/Nopassdeve/FeedoBridge |
| App 域名 | https://shopifyapp.xmasforest.com |
| VPS | Hostinger (76.13.98.3) |
| 部署路径 | /opt/feedobridge |

---

## 服务器配置

### VPS 连接信息

```
IP: 76.13.98.3
用户: root
部署目录: /opt/feedobridge
```

### Shopify App 配置

```
Client ID: 9da46159e4de788dab1f3cc2533551e4
Client Secret: 在 .env 文件中配置 (SHOPIFY_API_SECRET)
App URL: https://shopifyapp.xmasforest.com
```

### 环境变量 (.env)

在 VPS 的 `/opt/feedobridge/.env` 文件中配置：

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/feedobridge"

# Redis
REDIS_URL="redis://localhost:6379"

# Shopify App
SHOPIFY_API_KEY="9da46159e4de788dab1f3cc2533551e4"
SHOPIFY_API_SECRET="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"

# App URL
APP_URL="https://shopifyapp.xmasforest.com"

# FeedoGo API (待配置)
FEEDOGO_API_KEY=""
FEEDOGO_WEBHOOK_URL=""
SSO_SECRET=""
```

---

## 开发进度

### ✅ 已完成

#### 2026-01-23

**1. 项目初始化与基础架构**
- 创建 Next.js + TypeScript 项目
- 集成 Shopify Polaris UI 组件库
- 配置 Prisma ORM + PostgreSQL
- 设置 Redis 缓存

**2. GitHub Actions 自动部署**
- 创建 `.github/workflows/deploy.yml`
- 推送到 main 分支自动触发 VPS 部署
- 需要配置的 Secrets：
  - `HOST` - VPS IP 地址
  - `USERNAME` - SSH 用户名
  - `PASSWORD` - SSH 密码

**3. 插件面板管理（功能一）**
- 创建完整的管理后台界面
- 4 个 Tab 页面：
  - **仪表盘** - 订单/用户同步统计
  - **嵌入设置** - URL 配置、自动注册、SSO 开关、多设备预览
  - **感谢页面** - 弹窗配置（标题/描述/按钮/颜色/延迟）+ 实时预览
  - **API 配置** - FeedoGo API Key、Webhook URL、SSO 密钥、连接测试

**组件文件：**
- `components/SettingsPage.tsx` - 主设置页面（Tabs 布局）
- `components/DashboardStats.tsx` - 统计仪表盘
- `components/EmbedPreview.tsx` - 嵌入预览（桌面/平板/移动端）
- `components/ThankYouModalSettings.tsx` - 感谢页面弹窗设置
- `components/ApiSettings.tsx` - API 配置面板

**API 接口：**
- `pages/api/settings.ts` - 设置读写
- `pages/api/stats.ts` - 统计数据
- `pages/api/test-connection.ts` - API 连接测试

---

### 🔧 待处理问题

#### 问题 1：页面显示 "Example Domain"

**现象：** Shopify 店铺中嵌入的 iframe 显示 "Example Domain" 页面

**原因分析：**
1. `block.settings.embed_url` 默认值是 `https://feedogocloud.com`
2. 如果该域名未配置或解析错误，会显示 Example Domain

**解决方案：**

**方案 A - 在 Shopify 主题编辑器中修改 URL：**
1. 进入 Shopify 后台 → Online Store → Themes
2. 点击 Customize（自定义）
3. 找到 FeedoBridge Embed 区块
4. 将 Embed URL 修改为正确的 FeedoGo 地址

**方案 B - 修改代码默认值：**
在 `extensions/theme-app-extension/blocks/feedobridge-embed.liquid` 中：
```liquid
{
  "type": "url",
  "id": "embed_url",
  "label": "Embed URL",
  "default": "https://你的实际域名.com"  // 修改这里
}
```

**方案 C - 使用 VPS 服务地址：**
如果 FeedoGo 部署在 VPS 上，URL 应该是：
- `https://shopifyapp.xmasforest.com` ✅ 已配置

---

### 📋 待开发功能

按优先级排序：

| 优先级 | 功能 | 状态 |
|-------|------|------|
| P0 | 内嵌网站模块 | ✅ 已完成 |
| P0 | 订单自动推送 | ⏳ 待开发 |
| P0 | 自动账户注册 | ⏳ 待开发 |
| P0 | 单点登录 (SSO) | ⏳ 待开发 |
| P1 | 感谢页面弹窗 | ⏳ 待开发 |

---

## 部署说明

### VPS 部署 (Hostinger)

```bash
# SSH 登录
ssh root@76.13.98.3

# 进入项目目录
cd /opt/feedobridge

# 拉取最新代码
git pull origin main

# Docker 部署
docker compose up -d --build
```

### 环境变量配置

**重要：敏感信息已配置在 VPS 的 .env 文件中，不要提交到 Git！**

SSH 登录 VPS 后编辑 `.env` 文件：
```bash
ssh root@76.13.98.3
cd /opt/feedobridge
nano .env
```

### 数据库迁移

```bash
# 生成 Prisma Client
npm run db:generate

# 运行迁移
npm run db:migrate
```

---

## Shopify 配置

### 安装 App

1. 在 Shopify Partner Dashboard 创建 App
2. 配置 OAuth 回调 URL
3. 安装到测试店铺

### 添加嵌入区块

1. 进入店铺后台 → Online Store → Themes
2. Customize（自定义）主题
3. 添加 App Block → FeedoBridge Embed
4. 配置正确的 Embed URL

---

## 常用命令

```bash
# 本地开发
npm run dev

# 构建
npm run build

# Shopify CLI 开发模式
npm run shopify:dev

# 数据库操作
npm run db:generate   # 生成 Prisma Client
npm run db:migrate    # 运行迁移
npm run db:push       # 同步 Schema（开发用）

# Git 推送（触发自动部署）
git add .
git commit -m "your message"
git push
```

---

## 联系方式

开发者: NopassDev

---

*最后更新: 2026-01-23*

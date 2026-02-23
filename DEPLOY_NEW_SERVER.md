# 🚀 新服务器部署指南

## 服务器信息
- **IP**: 31.97.211.143
- **域名**: plugin.ifeedog.com
- **系统**: Ubuntu 20.04/22.04 LTS

---

## 📋 部署步骤

### 第一步：登录服务器并初始化

```bash
# 1. SSH 登录到新服务器
ssh root@31.97.211.143

# 2. 下载并运行初始化脚本
cd /tmp
curl -o server-init.sh https://raw.githubusercontent.com/Nopassdeve/FeedoBridge/main/server-init.sh
chmod +x server-init.sh
./server-init.sh
```

初始化脚本会自动安装：
- Docker & Docker Compose
- Nginx
- Certbot (SSL 证书工具)
- 并配置好基础的 Nginx 反向代理

---

### 第二步：配置 DNS

确保域名 `plugin.ifeedog.com` 的 A 记录已指向：`31.97.211.143`

检查 DNS 是否生效：
```bash
ping plugin.ifeedog.com
```

---

### 第三步：获取 SSL 证书

```bash
certbot --nginx -d plugin.ifeedog.com --non-interactive --agree-tos -m your-email@example.com
```

---

### 第四步：克隆代码并配置

```bash
cd /opt/feedobridge

# 使用 GitHub Token 克隆（从 Actions Secrets 中获取）
git clone https://YOUR_GITHUB_TOKEN@github.com/Nopassdeve/FeedoBridge.git .

# 创建 .env 文件
cat > .env << 'EOF'
# Shopify App 配置
SHOPIFY_API_KEY=9da46159e4de788dab1f3cc2533551e4
SHOPIFY_API_SECRET=YOUR_SHOPIFY_API_SECRET
SCOPES=read_products,write_products,read_customers,write_customers,read_orders,write_orders

# 应用 URL
APP_URL=https://plugin.ifeedog.com
HOST=https://plugin.ifeedog.com

# 数据库
DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@db:5432/feedobridge

# Redis
REDIS_URL=redis://redis:6379

# FeedoGo API
FEEDOGO_BASE_URL=https://shop.feedogocloud.com

# JWT
JWT_SECRET=YOUR_RANDOM_SECRET_KEY_HERE
EOF

# 修改数据库密码
nano .env  # 修改 YOUR_DB_PASSWORD 和其他敏感信息
```

---

### 第五步：启动应用

```bash
cd /opt/feedobridge

# 启动所有容器
docker compose up -d

# 查看构建进度（首次构建需要 3-5 分钟）
docker compose logs -f app
```

等待看到类似以下输出：
```
feedobridge-app | ✓ Ready in 3.2s
```

---

### 第六步：初始化数据库

```bash
# 进入应用容器
docker exec -it feedobridge-app sh

# 运行数据库迁移
npx prisma migrate deploy

# 退出容器
exit
```

---

### 第七步：验证部署

```bash
# 1. 检查容器状态
docker ps

# 应该看到 3 个容器正在运行：
# - feedobridge-app
# - feedobridge-db
# - feedobridge-redis

# 2. 测试应用
curl -I https://plugin.ifeedog.com

# 3. 测试数据库连接
curl "https://plugin.ifeedog.com/api/test-db?shop=feedogostore.myshopify.com"

# 4. 查看应用日志
docker logs feedobridge-app --tail 50
```

---

## 🔄 自动部署配置

### GitHub Actions 配置

GitHub Actions 已配置为在推送到 `main` 分支时自动部署：

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
```

需要在 GitHub Secrets 中配置：
- `HOST`: 31.97.211.143
- `USERNAME`: root
- `PASSWORD`: 服务器 root 密码
- `GH_TOKEN`: GitHub Personal Access Token

---

## 📊 监控和维护

### 查看日志
```bash
# 应用日志
docker logs feedobridge-app -f

# 数据库日志
docker logs feedobridge-db -f

# Redis 日志
docker logs feedobridge-redis -f
```

### 重启应用
```bash
cd /opt/feedobridge
docker compose restart app
```

### 更新应用
```bash
cd /opt/feedobridge
git pull
docker compose restart app
```

### 备份数据库
```bash
# 导出数据库
docker exec feedobridge-db pg_dump -U postgres feedobridge > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
docker exec -i feedobridge-db psql -U postgres feedobridge < backup.sql
```

---

## 🆘 故障排查

### 应用无法访问
```bash
# 检查 Nginx
systemctl status nginx
nginx -t

# 检查容器
docker ps -a
docker logs feedobridge-app --tail 100
```

### 数据库连接失败
```bash
# 检查数据库容器
docker ps | grep db

# 进入数据库
docker exec -it feedobridge-db psql -U postgres -d feedobridge

# 检查连接
\l  # 列出数据库
\dt # 列出表
```

### SSL 证书问题
```bash
# 检查证书
certbot certificates

# 续期证书
certbot renew --dry-run
certbot renew
```

---

## ✅ 部署检查清单

- [ ] 服务器初始化完成（Docker, Nginx, Certbot）
- [ ] DNS 解析正确（plugin.ifeedog.com → 31.97.211.143）
- [ ] SSL 证书获取成功
- [ ] 代码克隆完成
- [ ] .env 文件配置完成
- [ ] Docker 容器全部运行
- [ ] 数据库迁移完成
- [ ] 应用可以通过 HTTPS 访问
- [ ] GitHub Actions 秘钥配置完成
- [ ] Shopify App URL 更新为新域名

---

## 📞 支持

如遇问题，检查：
1. 服务器日志：`docker logs feedobridge-app`
2. Nginx 日志：`tail -f /var/log/nginx/error.log`
3. 系统日志：`journalctl -xe`


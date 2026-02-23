# 🚀 部署到新服务器的操作步骤

## 服务器信息
- **IP**: 31.97.211.143
- **域名**: plugin.ifeedog.com

---

## ⚡ 快速部署（推荐）

在新服务器上执行以下命令：

```bash
# 1. SSH 登录到服务器
ssh root@31.97.211.143

# 2. 下载并运行完整初始化脚本
curl -o /tmp/setup.sh https://raw.githubusercontent.com/Nopassdeve/FeedoBridge/main/full-server-setup.sh
chmod +x /tmp/setup.sh
/tmp/setup.sh

# 脚本会提示输入 GitHub Token（可选，如果仓库是私有的）

# 3. 等待初始化完成后，配置环境变量
nano /opt/feedobridge/.env

# 需要填写:
# - SHOPIFY_API_SECRET=shpss_xxxxxxxxx
# - DATABASE_URL 中修改 YOUR_DB_PASSWORD 为强密码
# - JWT_SECRET=随机生成的长字符串
# - FEEDOGO_API_KEY=你的 FeedoGo API Key
# - SSO_SECRET=随机生成的长字符串

# 4. 同步修改 docker-compose.yml 中的数据库密码
nano /opt/feedobridge/docker-compose.yml
# 找到 POSTGRES_PASSWORD=password
# 改为和 .env 中 DATABASE_URL 一样的密码

# 5. 确认 DNS 已解析后，获取 SSL 证书
certbot --nginx -d plugin.ifeedog.com --non-interactive --agree-tos -m your-email@example.com

# 6. 启动应用
cd /opt/feedobridge
docker-compose up -d

# 7. 查看构建进度（首次需要 5-10 分钟）
docker logs feedobridge-app -f

# 看到 "Ready in X.Xs" 表示启动成功

# 8. 运行数据库迁移
docker exec feedobridge-app npx prisma migrate deploy

# 9. 验证部署
curl https://plugin.ifeedog.com/api/test-db?shop=feedogostore.myshopify.com
```

---

## 📋 详细说明

### 初始化脚本做了什么？

`full-server-setup.sh` 会自动：

1. ✅ 更新系统包
2. ✅ 安装 Docker 和 Docker Compose
3. ✅ 安装 Nginx
4. ✅ 安装 Certbot (SSL 证书工具)
5. ✅ 配置防火墙 (开放 22, 80, 443 端口)
6. ✅ 克隆项目代码到 `/opt/feedobridge`
7. ✅ 配置 Nginx 反向代理
8. ✅ 创建 `.env` 模板文件

### 手动配置的部分

以下内容需要手动配置：

#### 1. 环境变量 (.env)

```bash
nano /opt/feedobridge/.env
```

**必须填写的敏感信息：**

```env
SHOPIFY_API_SECRET=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
DATABASE_URL=postgresql://postgres:StrongPassword123@db:5432/feedobridge
JWT_SECRET=your-random-secret-min-32-chars-long-string
FEEDOGO_API_KEY=your-feedogo-api-key
SSO_SECRET=another-random-secret-string
```

生成随机密钥：
```bash
# JWT_SECRET
openssl rand -base64 32

# SSO_SECRET
openssl rand -base64 32

# 数据库密码
openssl rand -base64 16
```

#### 2. Docker Compose 配置

```bash
nano /opt/feedobridge/docker-compose.yml
```

找到并修改数据库密码（与 .env 中一致）：
```yaml
environment:
  - POSTGRES_USER=postgres
  - POSTGRES_PASSWORD=StrongPassword123  # 改成你的密码
  - POSTGRES_DB=feedobridge
```

---

## 🔍 故障排查

### 如果初始化失败

```bash
# 检查错误日志
tail -f /tmp/setup.sh.log

# 手动安装 Docker
curl -fsSL https://get.docker.com | sh

# 手动安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 如果应用启动失败

```bash
# 查看完整日志
docker logs feedobridge-app

# 查看容器状态
docker ps -a

# 重启容器
docker-compose restart

# 重新构建
docker-compose down
docker-compose up -d --build
```

### 如果 SSL 证书失败

```bash
# 检查 DNS 是否解析
dig plugin.ifeedog.com
ping plugin.ifeedog.com

# 手动获取证书
certbot certonly --nginx -d plugin.ifeedog.com

# 查看证书状态
certbot certificates
```

---

## ✅ 验证清单

部署完成后，检查以下项目：

```bash
# 1. 检查容器运行
docker ps
# 应该看到: feedobridge-app, feedobridge-db, feedobridge-redis

# 2. 检查应用日志
docker logs feedobridge-app --tail 20
# 应该看到: "Ready in X.Xs"

# 3. 测试 HTTPS 访问
curl -I https://plugin.ifeedog.com
# 应该返回: HTTP/2 200

# 4. 测试数据库连接
curl "https://plugin.ifeedog.com/api/test-db?shop=feedogostore.myshopify.com"
# 应该返回: {"status":"ok",...}

# 5. 检查 SSL 证书
openssl s_client -connect plugin.ifeedog.com:443 -servername plugin.ifeedog.com < /dev/null 2>/dev/null | grep 'Verify return code'
# 应该返回: Verify return code: 0 (ok)
```

---

## 🔄 GitHub Actions 自动部署

配置完成后，每次推送到 `main` 分支，GitHub Actions 会自动：

1. SSH 连接到服务器
2. 拉取最新代码
3. 重启应用

需确保 GitHub Secrets 已配置：
- `HOST`: 31.97.211.143
- `USERNAME`: root
- `PASSWORD`: 服务器密码
- `GH_TOKEN`: GitHub Token

---

## 📞 需要帮助？

如遇到问题，提供以下信息：

```bash
# 系统信息
uname -a

# Docker 版本
docker --version
docker-compose --version

# 应用日志
docker logs feedobridge-app --tail 100

# Nginx 日志
tail -50 /var/log/nginx/error.log

# 容器状态
docker ps -a
```

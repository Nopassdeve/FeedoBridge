# Docker 修复指南

## 🚀 快速修复（推荐）

SSH 登录到服务器后，复制粘贴以下命令：

```bash
# 一键修复脚本
cd /opt/feedobridge && \
docker compose down && \
docker compose pull && \
docker compose up -d && \
sleep 5 && \
docker compose logs --tail 50 app
```

看到 `✓ Ready in XXXms` 就说明成功了！

---

## 📋 分步修复（如果快速修复失败）

### 步骤 1: SSH 登录服务器

```bash
ssh root@76.13.98.3
```

### 步骤 2: 进入应用目录

```bash
cd /opt/feedobridge
```

### 步骤 3: 停止所有容器

```bash
docker compose down
```

### 步骤 4: 拉取最新代码

```bash
git pull origin main
```

如果遇到权限错误：
```bash
git reset --hard origin/main
```

### 步骤 5: 重新构建并启动

```bash
docker compose build --no-cache
docker compose up -d
```

### 步骤 6: 查看日志确认启动

```bash
docker compose logs -f app
```

**成功标志**：看到类似这样的输出
```
✓ Ready in 3241ms
✓ Server listening on http://localhost:3000
```

按 `Ctrl+C` 退出日志查看。

---

## 🔍 诊断问题

### 检查容器状态

```bash
docker compose ps
```

**正常状态**：应该看到 `app` 容器的 STATE 是 `Up`

### 检查应用是否响应

```bash
curl http://localhost:3000
```

**正常响应**：应该返回 HTML 内容，不是错误

### 查看详细日志

```bash
# 查看最近 100 行日志
docker compose logs --tail 100 app

# 查看实时日志
docker compose logs -f app
```

---

## ⚠️ 常见问题

### 问题 1: 容器一直重启 (Restarting)

**原因**: 应用启动失败，可能是环境变量或数据库问题

**解决**:
```bash
# 查看错误日志
docker compose logs app | grep -i error

# 检查环境变量
cat .env
```

确保 `.env` 文件包含：
- `DATABASE_URL`
- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `HOST`
- `APP_URL`

### 问题 2: 端口被占用

**检查 3000 端口**:
```bash
netstat -tuln | grep 3000
# 或
ss -tuln | grep 3000
```

**杀死占用进程**:
```bash
lsof -ti:3000 | xargs kill -9
```

### 问题 3: Docker 磁盘空间不足

**清理未使用的镜像和容器**:
```bash
docker system prune -a
```

### 问题 4: 数据库连接失败

**检查数据库容器**:
```bash
docker compose ps db
```

**重启数据库**:
```bash
docker compose restart db
docker compose restart app
```

---

## 🧪 测试应用是否正常

### 在服务器上测试

```bash
# 测试主页
curl -I http://localhost:3000

# 测试 API
curl http://localhost:3000/api/test-db
```

### 从外部测试

```bash
# 在你的电脑上运行
curl -I https://shopifyapp.xmasforest.com

# 测试订单日志 API
curl https://shopifyapp.xmasforest.com/api/order-logs?shop=feedogostore.myshopify.com
```

---

## 🔧 完全重置（最后手段）

如果以上都不行，完全重置：

```bash
cd /opt/feedobridge

# 停止并删除所有容器、网络、卷
docker compose down -v

# 删除所有旧镜像
docker rmi $(docker images -q feedobridge*)

# 重新拉取代码
git fetch origin main
git reset --hard origin/main

# 重新构建
docker compose build --no-cache

# 启动
docker compose up -d

# 查看日志
docker compose logs -f app
```

---

## ✅ 验证修复成功

1. **容器运行正常**
   ```bash
   docker compose ps
   # 应该看到 app 容器 STATE 为 Up
   ```

2. **应用响应正常**
   ```bash
   curl http://localhost:3000
   # 返回 HTML 内容
   ```

3. **日志无错误**
   ```bash
   docker compose logs --tail 30 app
   # 没有 Error 或 Exception
   ```

4. **外部可访问**
   ```bash
   # 在你的电脑上
   curl -I https://shopifyapp.xmasforest.com
   # 返回 HTTP/1.1 200 OK
   ```

---

## 📞 仍然有问题？

运行诊断脚本获取详细信息：

```bash
cd /opt/feedobridge
bash diagnose.sh
```

把输出发给我，我可以帮你分析！

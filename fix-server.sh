#!/bin/bash
# 在 VPS 上运行此脚本来诊断和修复应用

echo "=== FeedoBridge 服务器诊断和修复 ==="
echo ""

echo "1. 检查 Docker 容器状态:"
docker ps -a | grep feedobridge || docker ps -a
echo ""

echo "2. 检查应用目录:"
ls -la /opt/feedobridge/
echo ""

echo "3. 查看最近的日志:"
cd /opt/feedobridge
docker compose logs --tail 50 app
echo ""

echo "4. 重启应用容器:"
docker compose restart app
echo ""

echo "5. 等待 5 秒后检查状态:"
sleep 5
docker compose ps
echo ""

echo "6. 测试应用是否响应:"
curl -I http://localhost:3000 || echo "应用未在 3000 端口响应"
echo ""

echo "=== 如果还是 502，尝试完全重启 ==="
echo "运行: cd /opt/feedobridge && docker compose down && docker compose up -d"

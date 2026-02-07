#!/bin/bash
# 在 VPS 上以 root 用户运行此脚本
# 用法: bash diagnose.sh

echo "========================================="
echo "FeedoBridge 服务器完整诊断"
echo "========================================="
echo ""

echo "【1】检查 Docker 容器状态"
echo "-------------------------------------"
docker ps -a
echo ""

echo "【2】检查应用日志（最近 30 行）"
echo "-------------------------------------"
cd /opt/feedobridge
docker compose logs --tail 30 app
echo ""

echo "【3】检查容器是否在运行"
echo "-------------------------------------"
docker compose ps
echo ""

echo "【4】检查应用端口（应该监听 3000）"
echo "-------------------------------------"
netstat -tuln | grep 3000 || ss -tuln | grep 3000 || echo "未找到 3000 端口"
echo ""

echo "【5】测试应用是否响应（本地 3000 端口）"
echo "-------------------------------------"
curl -I http://localhost:3000 2>&1 | head -5
echo ""

echo "【6】检查 Nginx 配置"
echo "-------------------------------------"
nginx -t
echo ""

echo "【7】检查 Nginx 状态"
echo "-------------------------------------"
systemctl status nginx | head -10
echo ""

echo "【8】检查网络监听端口"
echo "-------------------------------------"
netstat -tuln | grep -E "80|443|3000" || ss -tuln | grep -E "80|443|3000"
echo ""

echo "【9】检查防火墙状态"
echo "-------------------------------------"
ufw status || iptables -L -n | head -20
echo ""

echo "========================================="
echo "诊断完成！"
echo "========================================="
echo ""
echo "如果发现问题，尝试修复："
echo ""
echo "修复步骤 1: 重启 Docker 容器"
echo "  cd /opt/feedobridge"
echo "  docker compose down"
echo "  docker compose up -d"
echo ""
echo "修复步骤 2: 查看实时日志"
echo "  docker compose logs -f app"
echo ""
echo "修复步骤 3: 重启 Nginx"
echo "  systemctl restart nginx"
echo ""
echo "修复步骤 4: 检查域名解析"
echo "  nslookup shopifyapp.xmasforest.com"
echo ""

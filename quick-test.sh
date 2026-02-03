#!/bin/bash

# FeedoBridge 邮箱登录对接 - 快速测试脚本
# 使用方法: chmod +x quick-test.sh && ./quick-test.sh

echo "═══════════════════════════════════════════════════"
echo "   FeedoBridge - 邮箱登录对接快速测试"
echo "═══════════════════════════════════════════════════"
echo ""

# 配置
TEST_EMAIL="test@example.com"  # 修改为实际测试邮箱
FEEDOGO_URL="https://shop.feedogocloud.com"
LOCAL_API="http://localhost:3000"

echo "📋 测试配置:"
echo "   测试邮箱: $TEST_EMAIL"
echo "   FeedoGo URL: $FEEDOGO_URL"
echo "   本地API: $LOCAL_API"
echo ""
echo "───────────────────────────────────────────────────"
echo ""

# 测试1: 直接调用 FeedoGo API
echo "🧪 测试 1: 直接调用 FeedoGo emailLogin API"
echo ""
echo "请求: POST $FEEDOGO_URL/api/user/emailLogin"
echo "参数: {\"email\": \"$TEST_EMAIL\"}"
echo ""

RESPONSE=$(curl -s -X POST "$FEEDOGO_URL/api/user/emailLogin" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\"}" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP状态码: $HTTP_CODE"
echo ""
echo "响应内容:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  CODE=$(echo "$BODY" | jq -r '.code' 2>/dev/null)
  if [ "$CODE" = "1" ]; then
    echo "✅ FeedoGo API 调用成功!"
    TOKEN=$(echo "$BODY" | jq -r '.data.userinfo.token' 2>/dev/null)
    NICKNAME=$(echo "$BODY" | jq -r '.data.userinfo.nickname' 2>/dev/null)
    echo "   Token: ${TOKEN:0:20}..."
    echo "   昵称: $NICKNAME"
  else
    echo "❌ FeedoGo API 返回错误"
    echo "   $(echo "$BODY" | jq -r '.msg' 2>/dev/null)"
  fi
else
  echo "❌ HTTP 请求失败"
fi

echo ""
echo "───────────────────────────────────────────────────"
echo ""

# 等待2秒
sleep 2

# 测试2: 通过 FeedoBridge API
echo "🧪 测试 2: 通过 FeedoBridge API 代理"
echo ""
echo "请求: POST $LOCAL_API/api/email-login"
echo "参数: {\"email\": \"$TEST_EMAIL\", \"feedogoWebhookUrl\": \"$FEEDOGO_URL/webhooks/shopify\"}"
echo ""

RESPONSE2=$(curl -s -X POST "$LOCAL_API/api/email-login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\", \"feedogoWebhookUrl\": \"$FEEDOGO_URL/webhooks/shopify\"}" \
  -w "\n%{http_code}")

HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
BODY2=$(echo "$RESPONSE2" | sed '$d')

echo "HTTP状态码: $HTTP_CODE2"
echo ""
echo "响应内容:"
echo "$BODY2" | jq '.' 2>/dev/null || echo "$BODY2"
echo ""

if [ "$HTTP_CODE2" = "200" ]; then
  SUCCESS=$(echo "$BODY2" | jq -r '.success' 2>/dev/null)
  if [ "$SUCCESS" = "true" ]; then
    echo "✅ FeedoBridge API 调用成功!"
    
    # 提取并显示所有字段
    ID=$(echo "$BODY2" | jq -r '.data.id' 2>/dev/null)
    USER_ID=$(echo "$BODY2" | jq -r '.data.userId' 2>/dev/null)
    USERNAME=$(echo "$BODY2" | jq -r '.data.username' 2>/dev/null)
    NICKNAME=$(echo "$BODY2" | jq -r '.data.nickname' 2>/dev/null)
    MOBILE=$(echo "$BODY2" | jq -r '.data.mobile' 2>/dev/null)
    AVATAR=$(echo "$BODY2" | jq -r '.data.avatar' 2>/dev/null)
    SCORE=$(echo "$BODY2" | jq -r '.data.score' 2>/dev/null)
    TOKEN=$(echo "$BODY2" | jq -r '.data.token' 2>/dev/null)
    CREATETIME=$(echo "$BODY2" | jq -r '.data.createtime' 2>/dev/null)
    EXPIRETIME=$(echo "$BODY2" | jq -r '.data.expiretime' 2>/dev/null)
    EXPIRES_IN=$(echo "$BODY2" | jq -r '.data.expiresIn' 2>/dev/null)
    
    echo ""
    echo "📊 返回的用户信息:"
    echo "   ID: $ID"
    echo "   User ID: $USER_ID"
    echo "   用户名: ${USERNAME:-'(空)'}"
    echo "   昵称: $NICKNAME"
    echo "   手机: ${MOBILE:-'(空)'}"
    echo "   头像: $AVATAR"
    echo "   积分: $SCORE"
    echo "   Token: ${TOKEN:0:30}..."
    echo "   创建时间: $CREATETIME ($(date -d @$CREATETIME 2>/dev/null || echo 'N/A'))"
    echo "   过期时间: $EXPIRETIME ($(date -d @$EXPIRETIME 2>/dev/null || echo 'N/A'))"
    echo "   有效期: $EXPIRES_IN 秒 (约 $((EXPIRES_IN / 86400)) 天)"
    
    # 验证字段完整性
    echo ""
    echo "🔍 字段完整性检查:"
    MISSING_FIELDS=()
    
    [ "$ID" = "null" ] || [ -z "$ID" ] && MISSING_FIELDS+=("id")
    [ "$USER_ID" = "null" ] || [ -z "$USER_ID" ] && MISSING_FIELDS+=("userId")
    [ "$NICKNAME" = "null" ] || [ -z "$NICKNAME" ] && MISSING_FIELDS+=("nickname")
    [ "$AVATAR" = "null" ] || [ -z "$AVATAR" ] && MISSING_FIELDS+=("avatar")
    [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ] && MISSING_FIELDS+=("token")
    [ "$EXPIRES_IN" = "null" ] || [ -z "$EXPIRES_IN" ] && MISSING_FIELDS+=("expiresIn")
    
    if [ ${#MISSING_FIELDS[@]} -eq 0 ]; then
      echo "   ✅ 所有必需字段都已返回"
    else
      echo "   ⚠️  缺少字段: ${MISSING_FIELDS[*]}"
    fi
    
  else
    echo "❌ FeedoBridge API 返回失败"
    MESSAGE=$(echo "$BODY2" | jq -r '.message' 2>/dev/null)
    echo "   错误: $MESSAGE"
  fi
else
  echo "❌ HTTP 请求失败"
  if [ "$HTTP_CODE2" = "000" ]; then
    echo "   可能原因: Next.js 开发服务器未启动"
    echo "   请运行: npm run dev"
  fi
fi

echo ""
echo "───────────────────────────────────────────────────"
echo ""

# 总结
echo "📋 测试总结:"
echo ""

if [ "$HTTP_CODE" = "200" ] && [ "$CODE" = "1" ]; then
  echo "✅ FeedoGo API 对接正常"
else
  echo "❌ FeedoGo API 对接异常"
fi

if [ "$HTTP_CODE2" = "200" ] && [ "$SUCCESS" = "true" ]; then
  echo "✅ FeedoBridge API 代理正常"
else
  echo "❌ FeedoBridge API 代理异常"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "   测试完成"
echo "═══════════════════════════════════════════════════"
echo ""

# 提供下一步建议
echo "💡 下一步:"
echo ""
if [ "$SUCCESS" = "true" ]; then
  echo "1. 在 Shopify 管理后台配置 FeedoGo Webhook URL"
  echo "2. 在前台使用测试账户登录"
  echo "3. 访问嵌入了 iframe 的页面"
  echo "4. 查看浏览器控制台，应该看到 'Email login successful'"
  echo "5. 确认 iframe 内已自动登录"
else
  echo "1. 确保 Next.js 开发服务器正在运行 (npm run dev)"
  echo "2. 检查测试邮箱是否在 FeedoGo 已注册"
  echo "3. 确认 FeedoGo API 地址正确"
  echo "4. 查看详细错误信息并排查"
fi

echo ""

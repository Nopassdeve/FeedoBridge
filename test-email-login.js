/**
 * 测试邮箱登录API对接
 * 运行: node test-email-login.js
 */

const axios = require('axios');

// 测试配置
const TEST_CONFIG = {
  email: 'test@example.com', // 替换为实际测试邮箱
  feedogoWebhookUrl: 'https://shop.feedogocloud.com/webhooks/shopify',
  apiEndpoint: 'http://localhost:3000/api/email-login' // 本地测试
};

async function testEmailLogin() {
  console.log('🧪 开始测试邮箱登录API对接\n');
  console.log('测试配置:', TEST_CONFIG);
  console.log('\n-----------------------------------\n');

  try {
    console.log('📤 发送请求到:', TEST_CONFIG.apiEndpoint);
    console.log('📧 测试邮箱:', TEST_CONFIG.email);
    console.log('🔗 FeedoGo URL:', TEST_CONFIG.feedogoWebhookUrl);
    console.log('\n请求体:');
    console.log(JSON.stringify({
      email: TEST_CONFIG.email,
      feedogoWebhookUrl: TEST_CONFIG.feedogoWebhookUrl
    }, null, 2));
    console.log('\n-----------------------------------\n');

    const startTime = Date.now();
    
    const response = await axios.post(
      TEST_CONFIG.apiEndpoint,
      {
        email: TEST_CONFIG.email,
        feedogoWebhookUrl: TEST_CONFIG.feedogoWebhookUrl
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const duration = Date.now() - startTime;

    console.log('✅ 请求成功!');
    console.log('⏱️  响应时间:', duration, 'ms');
    console.log('\n📥 响应数据:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n-----------------------------------\n');

    // 验证返回数据结构
    if (response.data.success) {
      console.log('✅ 登录成功!\n');
      
      const data = response.data.data;
      console.log('👤 用户信息:');
      console.log(`   ID: ${data.id || '未提供'}`);
      console.log(`   User ID: ${data.userId || '未提供'}`);
      console.log(`   用户名: ${data.username || '(空)'}`);
      console.log(`   昵称: ${data.nickname || '未提供'}`);
      console.log(`   手机: ${data.mobile || '(空)'}`);
      console.log(`   头像: ${data.avatar || '未提供'}`);
      console.log(`   积分: ${data.score || 0}`);
      console.log(`   Token: ${data.token ? data.token.substring(0, 20) + '...' : '未提供'}`);
      console.log(`   创建时间: ${data.createtime ? new Date(data.createtime * 1000).toLocaleString('zh-CN') : '未提供'}`);
      console.log(`   过期时间: ${data.expiretime ? new Date(data.expiretime * 1000).toLocaleString('zh-CN') : '未提供'}`);
      console.log(`   有效期(秒): ${data.expiresIn || '未提供'}`);
      console.log(`   有效期(天): ${data.expiresIn ? Math.floor(data.expiresIn / 86400) : '未提供'}`);
      
      console.log('\n-----------------------------------\n');
      
      // 验证必需字段
      const requiredFields = ['id', 'userId', 'nickname', 'avatar', 'token', 'expiresIn'];
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        console.log('⚠️  警告: 缺少以下字段:', missingFields.join(', '));
      } else {
        console.log('✅ 所有必需字段都已返回');
      }
      
      // 验证token格式
      if (data.token && data.token.length > 20) {
        console.log('✅ Token格式正确');
      } else {
        console.log('⚠️  Token格式可能有误');
      }
      
      // 验证过期时间
      if (data.expiretime && data.createtime) {
        const expectedExpire = data.createtime + data.expiresIn;
        if (Math.abs(data.expiretime - expectedExpire) < 10) {
          console.log('✅ 过期时间计算正确');
        } else {
          console.log('⚠️  过期时间计算可能有误');
        }
      }
      
    } else {
      console.log('❌ 登录失败!');
      console.log('错误信息:', response.data.message);
    }

  } catch (error) {
    console.log('❌ 测试失败!\n');
    
    if (error.response) {
      console.log('HTTP 状态码:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('错误: 未收到响应');
      console.log('可能原因: 服务器未启动或网络错误');
    } else {
      console.log('错误:', error.message);
    }
    
    console.log('\n完整错误信息:');
    console.log(error);
  }
  
  console.log('\n-----------------------------------\n');
  console.log('🏁 测试完成\n');
}

// 直接调用FeedoGo API测试（绕过本地API）
async function testDirectFeedoGoAPI() {
  console.log('🧪 直接测试FeedoGo API\n');
  
  const feedogoApiUrl = `${TEST_CONFIG.feedogoWebhookUrl.replace('/webhooks/shopify', '')}/api/user/emailLogin`;
  
  console.log('📤 直接请求到:', feedogoApiUrl);
  console.log('📧 测试邮箱:', TEST_CONFIG.email);
  console.log('\n-----------------------------------\n');
  
  try {
    const startTime = Date.now();
    
    const response = await axios.post(
      feedogoApiUrl,
      { email: TEST_CONFIG.email },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    const duration = Date.now() - startTime;
    
    console.log('✅ FeedoGo API 响应成功!');
    console.log('⏱️  响应时间:', duration, 'ms');
    console.log('\n📥 原始响应:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.code === 1) {
      console.log('\n✅ FeedoGo API 返回成功状态');
      console.log('消息:', response.data.msg);
    } else {
      console.log('\n❌ FeedoGo API 返回失败状态');
      console.log('消息:', response.data.msg);
    }
    
  } catch (error) {
    console.log('❌ FeedoGo API 调用失败!\n');
    
    if (error.response) {
      console.log('HTTP 状态码:', error.response.status);
      console.log('响应:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('错误:', error.message);
    }
  }
  
  console.log('\n-----------------------------------\n');
}

// 主函数
async function main() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('   FeedoBridge - 邮箱登录API测试工具');
  console.log('═══════════════════════════════════════════════════');
  console.log('\n');
  
  // 先测试直接调用FeedoGo API
  await testDirectFeedoGoAPI();
  
  console.log('\n等待 2 秒...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 再测试通过本地API代理
  await testEmailLogin();
}

main();

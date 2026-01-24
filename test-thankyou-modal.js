require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testThankYouModal() {
  try {
    // 查找第一个 shop
    const shop = await prisma.shop.findFirst({
      include: { settings: true }
    });

    if (!shop) {
      console.log('No shop found in database');
      return;
    }

    console.log('Shop:', shop.shopName);
    console.log('Current settings:', JSON.stringify(shop.settings, null, 2));

    // 测试保存
    const testConfig = {
      enabled: true,
      title: '测试标题',
      description: '测试描述内容',
      buttonText: '立即体验',
      buttonLink: 'https://feedogocloud.com',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      buttonColor: '#0066cc',
      showDelay: 2000
    };

    console.log('\n保存测试配置:', JSON.stringify(testConfig, null, 2));

    const updated = await prisma.appSetting.upsert({
      where: { shopId: shop.id },
      create: {
        shopId: shop.id,
        embeddedIframeUrl: 'https://feedogocloud.com',
        embedHeight: 600,
        thankYouModalConfig: testConfig,
        enableAutoRegister: true,
        enableSso: true
      },
      update: {
        thankYouModalConfig: testConfig
      }
    });

    console.log('\n保存后的设置:', JSON.stringify(updated, null, 2));

    // 重新读取验证
    const reloaded = await prisma.appSetting.findUnique({
      where: { shopId: shop.id }
    });

    console.log('\n重新加载的设置:', JSON.stringify(reloaded.thankYouModalConfig, null, 2));
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testThankYouModal();

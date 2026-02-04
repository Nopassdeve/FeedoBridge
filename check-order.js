const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
  try {
    // 检查订单日志
    const logs = await prisma.orderPushLog.findMany({
      where: { shop: 'feedogostore.myshopify.com' },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('📊 订单日志数量:', logs.length);
    
    if (logs.length > 0) {
      console.log('\n最新日志:');
      logs.forEach(log => {
        console.log({
          订单ID: log.shopifyOrderId,
          状态: log.status,
          金额: log.orderAmount,
          创建时间: log.createdAt,
          错误: log.errorMessage
        });
      });
    } else {
      console.log('\n❌ 没有找到任何订单日志');
      console.log('\n可能原因:');
      console.log('1. Webhook 没有注册成功');
      console.log('2. Webhook 被 Shopify 调用时失败了');
      console.log('3. 订单创建时没有触发 webhook');
    }
    
    // 检查 Shop 配置
    const shop = await prisma.shop.findUnique({
      where: { shopifyShopId: 'feedogostore.myshopify.com' }
    });
    
    if (shop) {
      console.log('\n✅ Shop 配置存在');
      console.log('Access Token:', shop.accessToken ? '已设置' : '未设置');
    } else {
      console.log('\n❌ Shop 配置不存在');
    }
    
    // 检查设置
    const settings = await prisma.appSetting.findFirst({
      where: { shop: 'feedogostore.myshopify.com' }
    });
    
    if (settings) {
      console.log('\n✅ 应用设置存在');
      console.log('FeedoGo API URL:', settings.feedogoWebhookUrl);
    }
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();

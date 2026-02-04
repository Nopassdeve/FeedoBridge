import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * 诊断页面：检查 webhook 配置和订单日志
 * 访问: /api/diagnose?shop=feedogostore.myshopify.com
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop } = req.query;

  if (!shop || typeof shop !== 'string') {
    return res.status(400).json({ error: 'Shop parameter required' });
  }

  try {
    const result: any = {
      shop,
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // 1. 检查 Shop 配置
    const shopRecord = await prisma.shop.findUnique({
      where: { shopifyShopId: shop },
      include: { settings: true }
    });

    result.checks.shopExists = !!shopRecord;
    
    if (shopRecord) {
      result.shopInfo = {
        hasAccessToken: !!shopRecord.accessToken,
        accessTokenLength: shopRecord.accessToken?.length,
        installedAt: shopRecord.installedAt,
        settingsConfigured: !!shopRecord.settings
      };

      if (shopRecord.settings) {
        result.settings = {
          feedogoWebhookUrl: shopRecord.settings.feedogoWebhookUrl,
          embeddedIframeUrl: shopRecord.settings.embeddedIframeUrl
        };
      }
    }

    // 2. 检查订单日志
    const logs = await prisma.orderPushLog.findMany({
      where: { shop },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    result.checks.hasOrderLogs = logs.length > 0;
    result.orderLogs = {
      total: logs.length,
      logs: logs.map(log => ({
        shopifyOrderId: log.shopifyOrderId,
        status: log.status,
        orderAmount: log.orderAmount,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt,
        responseData: log.responseData
      }))
    };

    // 3. 统计
    const stats = {
      total: logs.length,
      success: logs.filter(l => l.status === 'success').length,
      failed: logs.filter(l => l.status === 'failed').length,
      pending: logs.filter(l => l.status === 'pending').length
    };

    result.stats = stats;

    // 4. 诊断建议
    const suggestions = [];
    
    if (!shopRecord) {
      suggestions.push('❌ Shop 未安装，请先安装应用');
    } else if (!shopRecord.accessToken) {
      suggestions.push('❌ 缺少 Access Token，请重新安装应用');
    } else if (!shopRecord.settings?.feedogoWebhookUrl) {
      suggestions.push('⚠️ FeedoGo API URL 未配置，请在设置页面配置');
    } else if (logs.length === 0) {
      suggestions.push('⚠️ 没有订单日志，可能原因:');
      suggestions.push('  1. Webhook 未注册到 Shopify');
      suggestions.push('  2. 还没有创建订单');
      suggestions.push('  3. Webhook 调用失败（检查服务器日志）');
      suggestions.push(`\n建议访问: https://shopifyapp.xmasforest.com/api/webhooks/register?shop=${shop}`);
    } else {
      suggestions.push('✅ 系统运行正常');
    }

    result.suggestions = suggestions;

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('Diagnose error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

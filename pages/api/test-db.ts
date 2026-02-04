import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { shop } = req.query;
    
    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ 
        error: 'Missing shop parameter',
        received: shop,
        type: typeof shop
      });
    }

    // 测试基本查询
    const shopData = await prisma.shop.findUnique({
      where: { shopifyShopId: shop }
    });

    if (!shopData) {
      return res.status(200).json({
        status: 'not_found',
        shop,
        message: 'Shop not in database'
      });
    }

    // 单独查询 settings
    const settings = await prisma.appSetting.findUnique({
      where: { shopId: shopData.id }
    });

    return res.status(200).json({
      status: 'ok',
      shop,
      shopData: {
        id: shopData.id,
        shopifyShopId: shopData.shopifyShopId,
        shopName: shopData.shopName
      },
      hasSettings: !!settings,
      settings: settings ? {
        embeddedIframeUrl: settings.embeddedIframeUrl,
        feedogoWebhookUrl: settings.feedogoWebhookUrl,
        embedHeight: settings.embedHeight
      } : null
    });
  } catch (error: any) {
    console.error('Test API error:', error);
    return res.status(500).json({ 
      error: 'Internal error',
      message: error?.message || 'Unknown',
      stack: error?.stack?.split('\n').slice(0, 3)
    });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop } = req.query;

  if (!shop || typeof shop !== 'string') {
    return res.status(400).json({ error: 'Shop parameter required' });
  }

  try {
    const shopRecord = await prisma.shop.findUnique({
      where: { shopifyShopId: shop }
    });

    if (!shopRecord) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // 测试直接调用 Shopify API
    const testUrl = `https://${shop}/admin/api/2024-01/webhooks.json`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopRecord.accessToken
      }
    });

    const data = await response.json();

    return res.status(200).json({
      testUrl,
      tokenLength: shopRecord.accessToken.length,
      tokenPreview: shopRecord.accessToken.substring(0, 10) + '...',
      responseStatus: response.status,
      responseData: data,
      envCheck: {
        hasAppUrl: !!process.env.APP_URL,
        hasHost: !!process.env.HOST,
        appUrl: process.env.APP_URL,
        host: process.env.HOST
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

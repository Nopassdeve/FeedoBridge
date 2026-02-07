import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { shop, accessToken } = req.body;

  if (!shop || !accessToken) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: { shop: 'feedogostore.myshopify.com', accessToken: 'shpca_...' }
    });
  }

  try {
    console.log('[Manual Install] Creating shop record:', shop);

    // 创建或更新 Shop 记录
    const shopRecord = await prisma.shop.upsert({
      where: { shopifyShopId: shop },
      create: {
        shopifyShopId: shop,
        shopName: shop.replace('.myshopify.com', ''),
        accessToken: accessToken,
      },
      update: {
        accessToken: accessToken,
      },
    });

    console.log('[Manual Install] Shop record created/updated:', shopRecord.id);

    // 创建默认的 AppSetting
    const setting = await prisma.appSetting.upsert({
      where: { shopId: shopRecord.id },
      create: {
        shopId: shopRecord.id,
        feedogoBaseUrl: 'https://shop.feedogocloud.com', // 默认值
      },
      update: {},
    });

    console.log('[Manual Install] AppSetting created:', setting.id);

    return res.status(200).json({
      success: true,
      shop: shopRecord,
      setting: setting,
      nextStep: 'Visit the app at https://admin.shopify.com/store/feedogostore/apps/feedobridge'
    });
  } catch (error: any) {
    console.error('[Manual Install] Error:', error);
    return res.status(500).json({
      error: 'Database error',
      details: error.message,
    });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop } = req.query;

  if (!shop || typeof shop !== 'string') {
    return res.status(400).json({ error: 'Shop parameter required' });
  }

  try {
    const shopRecord = await prisma.shop.findUnique({
      where: { shopifyShopId: shop },
      select: {
        shopifyShopId: true,
        shopName: true,
        accessToken: true,
        apiVersion: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!shopRecord) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // 只显示 token 的前 10 个字符用于诊断
    const tokenPreview = shopRecord.accessToken 
      ? shopRecord.accessToken.substring(0, 10) + '...' 
      : 'NULL';

    return res.status(200).json({
      shop: shopRecord.shopifyShopId,
      shopName: shopRecord.shopName,
      tokenPreview,
      hasToken: !!shopRecord.accessToken,
      tokenLength: shopRecord.accessToken?.length || 0,
      apiVersion: shopRecord.apiVersion,
      createdAt: shopRecord.createdAt,
      updatedAt: shopRecord.updatedAt
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

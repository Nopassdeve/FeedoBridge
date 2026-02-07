import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * 清空店铺数据以重新安装
 * 警告：这会删除店铺的所有数据
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { shop, confirm } = req.body;

  if (!shop || confirm !== 'DELETE_ALL_DATA') {
    return res.status(400).json({ 
      error: 'Missing parameters',
      usage: 'POST with { shop: "xxx.myshopify.com", confirm: "DELETE_ALL_DATA" }'
    });
  }

  try {
    // 先获取店铺记录
    const shopRecord = await prisma.shop.findUnique({
      where: { shopifyShopId: shop }
    });

    if (!shopRecord) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // 删除店铺的所有相关数据
    await prisma.$transaction([
      // 删除订单日志（shop 字段是 String）
      prisma.orderPushLog.deleteMany({
        where: { shop: shop }
      }),
      // 删除用户映射（shopId 是外键）
      prisma.userMapping.deleteMany({
        where: { shopId: shopRecord.id }
      }),
      // 删除设置（shopId 是外键）
      prisma.appSetting.deleteMany({
        where: { shopId: shopRecord.id }
      }),
      // 最后删除店铺
      prisma.shop.delete({
        where: { id: shopRecord.id }
      })
    ]);

    return res.status(200).json({ 
      success: true,
      message: `All data for ${shop} has been deleted. You can now reinstall the app.`,
      installUrl: `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=read_products,write_products,read_customers,write_customers,read_orders,write_orders&redirect_uri=https://shopifyapp.xmasforest.com/api/auth/callback`
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

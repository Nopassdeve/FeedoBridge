import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop, orderId } = req.query;

  if (req.method === 'GET') {
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

      // 如果提供了 orderId，返回特定订单的日志
      if (orderId && typeof orderId === 'string') {
        const logs = await prisma.orderPushLog.findMany({
          where: {
            shopId: shopRecord.id,
            shopifyOrderId: orderId
          },
          orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({ logs });
      }

      // 否则返回最近的所有日志
      const logs = await prisma.orderPushLog.findMany({
        where: {
          shopId: shopRecord.id
        },
        orderBy: { createdAt: 'desc' },
        take: 50 // 最近 50 条
      });

      const stats = {
        total: logs.length,
        success: logs.filter(l => l.status === 'success').length,
        failed: logs.filter(l => l.status === 'failed').length,
        pending: logs.filter(l => l.status === 'pending').length
      };

      return res.status(200).json({ logs, stats });
    } catch (error: any) {
      console.error('Failed to fetch order logs:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

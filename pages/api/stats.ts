import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop } = req.query;

  if (!shop || typeof shop !== 'string') {
    return res.status(400).json({ error: 'Shop parameter required' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const shopRecord = await prisma.shop.findUnique({
      where: { shopifyShopId: shop }
    });

    if (!shopRecord) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // 获取订单统计
    const orderStats = await prisma.orderPushLog.groupBy({
      by: ['status'],
      where: { shopId: shopRecord.id },
      _count: { status: true }
    });

    const totalOrders = orderStats.reduce((sum, s) => sum + s._count.status, 0);
    const syncedOrders = orderStats.find(s => s.status === 'success')?._count.status || 0;
    const pendingOrders = orderStats.find(s => s.status === 'pending')?._count.status || 0;
    const failedOrders = orderStats.find(s => s.status === 'failed')?._count.status || 0;

    // 获取用户映射统计
    const userStats = await prisma.userMapping.groupBy({
      by: ['syncStatus'],
      where: { shopId: shopRecord.id },
      _count: { syncStatus: true }
    });

    const totalUsers = userStats.reduce((sum, s) => sum + s._count.syncStatus, 0);
    const syncedUsers = userStats.find(s => s.syncStatus === 'synced')?._count.syncStatus || 0;

    // 获取最后同步时间
    const lastSync = await prisma.orderPushLog.findFirst({
      where: { 
        shopId: shopRecord.id,
        status: 'success'
      },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true }
    });

    return res.status(200).json({
      totalOrders,
      syncedOrders,
      pendingOrders,
      failedOrders,
      totalUsers,
      syncedUsers,
      lastSyncAt: lastSync?.updatedAt?.toISOString() || null
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

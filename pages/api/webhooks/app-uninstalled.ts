import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyShopifyWebhook } from '@/lib/shopify';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const hmac = req.headers['x-shopify-hmac-sha256'] as string;
  const body = JSON.stringify(req.body);

  if (!verifyShopifyWebhook(body, hmac)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const shop = req.headers['x-shopify-shop-domain'] as string;

  try {
    await prisma.shop.delete({
      where: { shopifyShopId: shop }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to uninstall' });
  }
}

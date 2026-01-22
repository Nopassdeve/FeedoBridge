import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { makeShopifyRequest } from '@/lib/shopify';

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

    const webhooks = [
      {
        topic: 'app/uninstalled',
        address: `${process.env.HOST}/api/webhooks/app-uninstalled`,
        format: 'json'
      },
      {
        topic: 'orders/create',
        address: `${process.env.HOST}/api/webhooks/orders-create`,
        format: 'json'
      },
      {
        topic: 'customers/create',
        address: `${process.env.HOST}/api/webhooks/customers-create`,
        format: 'json'
      }
    ];

    const results = [];
    for (const webhook of webhooks) {
      const result = await makeShopifyRequest(
        shop,
        shopRecord.accessToken,
        'webhooks.json',
        'POST',
        { webhook }
      );
      results.push(result);
    }

    res.status(200).json({ success: true, webhooks: results });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register webhooks' });
  }
}

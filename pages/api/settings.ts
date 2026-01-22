import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop } = req.query;

  if (!shop || typeof shop !== 'string') {
    return res.status(400).json({ error: 'Shop parameter required' });
  }

  if (req.method === 'GET') {
    const shopRecord = await prisma.shop.findUnique({
      where: { shopifyShopId: shop },
      include: { settings: true }
    });

    if (!shopRecord) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    return res.status(200).json({
      embeddedIframeUrl: shopRecord.settings?.embeddedIframeUrl || 'https://shopifyapp.xmasforest.com',
      embedHeight: shopRecord.settings?.embedHeight || 600,
      thankYouModalConfig: shopRecord.settings?.thankYouModalConfig || null,
      enableAutoRegister: shopRecord.settings?.enableAutoRegister ?? true,
      enableSso: shopRecord.settings?.enableSso ?? true,
      feedogoApiKey: shopRecord.settings?.feedogoApiKey || '',
      feedogoWebhookUrl: shopRecord.settings?.feedogoWebhookUrl || '',
      feedogoSsoSecret: shopRecord.settings?.feedogoSsoSecret || ''
    });
  }

  if (req.method === 'POST') {
    const { 
      embeddedIframeUrl, 
      embedHeight,
      thankYouModalConfig, 
      enableAutoRegister,
      enableSso,
      feedogoApiKey,
      feedogoWebhookUrl,
      feedogoSsoSecret
    } = req.body;

    const shopRecord = await prisma.shop.findUnique({
      where: { shopifyShopId: shop }
    });

    if (!shopRecord) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const updated = await prisma.appSetting.upsert({
      where: { shopId: shopRecord.id },
      create: {
        shopId: shopRecord.id,
        embeddedIframeUrl: embeddedIframeUrl || 'https://shopifyapp.xmasforest.com',
        embedHeight: embedHeight || 600,
        thankYouModalConfig: thankYouModalConfig || null,
        enableAutoRegister: enableAutoRegister ?? true,
        enableSso: enableSso ?? true,
        feedogoApiKey: feedogoApiKey || null,
        feedogoWebhookUrl: feedogoWebhookUrl || null,
        feedogoSsoSecret: feedogoSsoSecret || null
      },
      update: {
        embeddedIframeUrl,
        embedHeight,
        thankYouModalConfig,
        enableAutoRegister,
        enableSso,
        feedogoApiKey,
        feedogoWebhookUrl,
        feedogoSsoSecret
      }
    });

    return res.status(200).json(updated);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { shop } = req.query;

  if (!shop || typeof shop !== 'string') {
    return res.status(400).json({ error: 'Missing shop parameter' });
  }

  try {
    const shopData = await prisma.shop.findUnique({
      where: { shopDomain: shop },
      include: {
        appSettings: true
      }
    });

    if (!shopData) {
      return res.status(200).json({
        found: false,
        shop,
        message: 'Shop not found in database',
        defaultSettings: {
          embeddedIframeUrl: 'https://feedogocloud.com/',
          feedogoWebhookUrl: 'https://shop.feedogocloud.com'
        }
      });
    }

    const settings = shopData.appSettings || {};

    return res.status(200).json({
      found: true,
      shop,
      shopId: shopData.id,
      settings: {
        embeddedIframeUrl: settings.embeddedIframeUrl,
        feedogoWebhookUrl: settings.feedogoWebhookUrl,
        feedogoApiKey: settings.feedogoApiKey ? '***configured***' : null,
        feedogoSsoSecret: settings.feedogoSsoSecret ? '***configured***' : null,
        enableAutoRegister: settings.enableAutoRegister,
        enableSso: settings.enableSso,
        embedHeight: settings.embedHeight
      },
      rawSettings: settings
    });
  } catch (error) {
    console.error('Debug settings error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

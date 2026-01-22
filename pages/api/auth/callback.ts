import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop, host, code } = req.query;

  if (!shop || !code) {
    return res.status(400).send('Missing shop or code parameter');
  }

  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  const scopes = process.env.SCOPES || 'read_products,write_products,read_customers,write_customers,read_orders,write_orders';

  try {
    const accessTokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: apiKey,
          client_secret: apiSecret,
          code
        })
      }
    );

    const accessTokenData = await accessTokenResponse.json();
    const { access_token } = accessTokenData;

    const { prisma } = await import('@/lib/prisma');
    
    await prisma.shop.upsert({
      where: { shopifyShopId: shop as string },
      create: {
        shopifyShopId: shop as string,
        shopName: shop as string,
        accessToken: access_token,
        apiVersion: '2024-01'
      },
      update: {
        accessToken: access_token,
        apiVersion: '2024-01'
      }
    });

    const redirectUrl = `https://${shop}/admin/apps/${apiKey}`;
    res.redirect(redirectUrl);
  } catch (error) {
    res.status(500).send('OAuth callback failed');
  }
}

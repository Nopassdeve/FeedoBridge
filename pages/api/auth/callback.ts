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
    console.log(`[OAuth] Processing callback for shop: ${shop}`);
    console.log(`[OAuth] Using API Key: ${apiKey?.substring(0, 10)}...`);
    
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
    console.log(`[OAuth] Response status: ${accessTokenResponse.status}`);
    console.log(`[OAuth] Response data:`, accessTokenData);

    if (!accessTokenResponse.ok) {
      console.error(`[OAuth] Failed to get access token:`, accessTokenData);
      return res.status(400).send(`OAuth failed: ${JSON.stringify(accessTokenData)}`);
    }

    const { access_token } = accessTokenData;

    if (!access_token) {
      console.error(`[OAuth] No access_token in response`);
      return res.status(400).send('No access token received');
    }

    console.log(`[OAuth] Got access token: ${access_token.substring(0, 10)}... (length: ${access_token.length})`);

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

    console.log(`[OAuth] Token saved to database successfully`);

    // 使用正确的应用路径格式
    const appHandle = 'feedobridge';
    const redirectUrl = `https://${shop}/admin/apps/${appHandle}`;
    console.log(`[OAuth] Redirecting to: ${redirectUrl}`);
    
    return res.redirect(redirectUrl);
  } catch (error: any) {
    console.error(`[OAuth] Error:`, error);
    console.error(`[OAuth] Error stack:`, error.stack);
    return res.status(500).send(`OAuth callback failed: ${error.message}`);
  }
}

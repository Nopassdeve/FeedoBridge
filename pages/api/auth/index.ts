import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop } = req.query;

  if (!shop || typeof shop !== 'string') {
    return res.status(400).send('Missing shop parameter');
  }

  const apiKey = process.env.SHOPIFY_API_KEY;
  const scopes = process.env.SCOPES || 'read_products,write_products,read_customers,write_customers,read_orders,write_orders';
  const redirectUri = `${process.env.HOST}/api/auth/callback`;
  const nonce = Math.random().toString(36).substring(7);

  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}&state=${nonce}`;

  res.redirect(installUrl);
}

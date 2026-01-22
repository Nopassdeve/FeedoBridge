import { NextApiRequest, NextApiResponse } from 'next';
import { generateSSOSignature } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerId, customerEmail, shopId } = req.body;

  if (!customerId || !customerEmail || !shopId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const data = {
    action: 'LOGIN',
    timestamp,
    shopifyStoreId: shopId,
    customerId,
    customerEmail
  };

  const hmac = generateSSOSignature(data, process.env.SHOPIFY_API_SECRET || '');

  return res.status(200).json({
    data,
    hmac
  });
}

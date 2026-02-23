import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyShopifyWebhook } from '@/lib/shopify';
import { Readable } from 'stream';

// 禁用 Next.js 自动解析 body，我们需要原始的 buffer 来验证签名
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 读取原始 body
  const rawBody = await getRawBody(req);
  
  const hmac = req.headers['x-shopify-hmac-sha256'] as string;

  if (!verifyShopifyWebhook(rawBody, hmac)) {
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

// 辅助函数：读取原始 body
async function getRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  const readable = req as unknown as Readable;
  
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  
  return Buffer.concat(chunks).toString('utf8');
}


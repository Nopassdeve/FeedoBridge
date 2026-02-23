// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyShopifyWebhook } from '@/lib/shopify';
import axios from 'axios';
import { Readable } from 'stream';

interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
  tags: string;
}

// 禁用 Next.js 自动解析 body，我们需要原始的 buffer 来验证签名
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Shopify 客户创建 Webhook 处理器
 * 当用户在 Shopify 网站注册时，自动将邮箱发送给 FeedoGo API 进行注册
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 读取原始 body
  const rawBody = await getRawBody(req);
  
  // 验证 Shopify Webhook 签名
  const hmac = req.headers['x-shopify-hmac-sha256'] as string;
  
  if (!verifyShopifyWebhook(rawBody, hmac)) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 解析 JSON
  const customer: ShopifyCustomer = JSON.parse(rawBody);
  const shopDomain = req.headers['x-shopify-shop-domain'] as string;

  if (!customer.email || !shopDomain) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 获取店铺记录
    const shop = await prisma.shop.findUnique({
      where: { shopifyShopId: shopDomain },
      include: { settings: true },
    });

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // 检查是否启用自动注册
    if (!shop.settings?.enableAutoRegister) {
      return res.status(200).json({ 
        success: true, 
        message: 'Auto-register disabled' 
      });
    }

    const webhookUrl = shop.settings?.feedogoWebhookUrl;
    
    if (!webhookUrl) {
      return res.status(200).json({ 
        success: true, 
        message: 'FeedoGo Webhook URL not configured' 
      });
    }

    const feedogoBaseUrl = webhookUrl;

    // 1. 检查用户是否在 FeedoGo 注册（emailLogin会自动注册新用户）
    let userExists = false;
    try {
      const checkResponse = await axios.post(
        `${feedogoBaseUrl}/api/user/emailLogin`,
        { email: customer.email },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );

      // 如果登录成功，说明用户已存在
      if (checkResponse.data?.code === 1 && checkResponse.data?.data?.userinfo?.token) {
        userExists = true;
        console.log(`✅ 用户已存在于 FeedoGo: ${customer.email}`);
      }
    } catch (error: any) {
      // User check failed, continue with registration
    }

    // 2. 记录用户映射关系（FeedoGo通过emailLogin自动识别用户）
    // 注意：FeedoGo 不需要预先注册，用户通过邮箱登录即可
    await prisma.userMapping.upsert({
      where: {
        shopifyCustomerId_shopId: {
          shopifyCustomerId: customer.id.toString(),
          shopId: shop.id,
        },
      },
      create: {
        shopId: shop.id,
        shopifyCustomerId: customer.id.toString(),
        feedogoEmail: customer.email,
        syncStatus: userExists ? 'synced' : 'pending',
        lastSyncAt: userExists ? new Date() : null,
      },
      update: {
        feedogoEmail: customer.email,
        syncStatus: userExists ? 'synced' : 'pending',
        lastSyncAt: userExists ? new Date() : null,
      },
    });

    return res.status(200).json({
      success: true,
      message: userExists 
        ? 'User already exists in FeedoGo' 
        : 'Customer info saved, will sync when they place an order',
      email: customer.email,
      userExists: userExists,
    });
  } catch (error: any) {
    console.error('处理客户创建事件失败:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
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


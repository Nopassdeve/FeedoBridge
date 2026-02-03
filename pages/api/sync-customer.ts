import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

/**
 * 手动同步现有客户到 FeedoGo
 * 用于批量同步或补充同步
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { shop, customerEmail } = req.body;

  if (!shop) {
    return res.status(400).json({ error: 'Shop parameter required' });
  }

  try {
    const shopRecord = await prisma.shop.findUnique({
      where: { shopifyShopId: shop },
      include: { settings: true },
    });

    if (!shopRecord) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const webhookUrl = shopRecord.settings?.feedogoWebhookUrl;
    
    if (!webhookUrl) {
      return res.status(400).json({ 
        error: 'FeedoGo Webhook URL not configured' 
      });
    }

    const feedogoBaseUrl = webhookUrl.replace('/webhooks/shopify', '');

    // 如果指定了邮箱，只同步该客户
    if (customerEmail) {
      return await syncSingleCustomer(
        customerEmail, 
        feedogoBaseUrl, 
        shop, 
        shopRecord.id,
        res
      );
    }

    // 否则，从 Shopify 获取所有客户并同步
    // 这里需要 Shopify API 调用权限
    return res.status(200).json({
      message: 'Batch sync not implemented yet. Please provide customerEmail for single sync.',
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

async function syncSingleCustomer(
  email: string,
  feedogoBaseUrl: string,
  shopDomain: string,
  shopId: string,
  res: NextApiResponse
) {
  try {
    // 1. 检查用户是否已在 FeedoGo 注册
    let userExists = false;
    let existingUserId = null;

    try {
      const checkResponse = await axios.post(
        `${feedogoBaseUrl}/api/user/emailLogin`,
        { email },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );

      if (checkResponse.data?.code === 1 && checkResponse.data?.data?.userinfo?.token) {
        userExists = true;
        existingUserId = checkResponse.data.data.userinfo.user_id;
        console.log(`✅ 用户已存在: ${email}, ID: ${existingUserId}`);
      }
    } catch (error: any) {
      console.log(`用户检查: ${email} 不存在或检查失败`);
    }

    // 2. 如果不存在，注册到 FeedoGo
    if (!userExists) {
      const registerResponse = await axios.post(
        `${feedogoBaseUrl}/api/user/register`,
        {
          email,
          username: email.split('@')[0],
          nickname: email.split('@')[0],
          source: 'shopify',
          shopify_store: shopDomain,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      if (registerResponse.data?.code === 1) {
        return res.status(200).json({
          success: true,
          message: 'Customer registered successfully',
          email,
          userId: registerResponse.data.data?.user_id,
          action: 'registered',
        });
      } else {
        return res.status(200).json({
          success: false,
          message: registerResponse.data?.msg || 'Registration failed',
          email,
        });
      }
    } else {
      return res.status(200).json({
        success: true,
        message: 'Customer already exists in FeedoGo',
        email,
        userId: existingUserId,
        action: 'already_exists',
      });
    }
  } catch (error: any) {
    console.error('Sync single customer error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      email,
    });
  }
}

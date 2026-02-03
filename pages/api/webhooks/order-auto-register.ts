import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

interface OrderAutoRegisterPayload {
  shopDomain: string;
  orderId: string;
  orderEmail: string;
  orderName: string;
  orderData: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    shopDomain,
    orderId,
    orderEmail,
    orderName,
    orderData,
  }: OrderAutoRegisterPayload = req.body;

  if (!shopDomain || !orderId || !orderEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 获取店铺记录
    const shop = await prisma.shop.findUnique({
      where: { shopifyShopId: shopDomain },
      include: { settings: true },
    });

    if (!shop) {
      console.warn(`Shop not found: ${shopDomain}`);
      return res.status(404).json({ error: 'Shop not found' });
    }

    // 检查是否启用自动注册
    if (!shop.settings?.enableAutoRegister) {
      return res.status(200).json({ success: true, message: 'Auto-register disabled' });
    }

    const webhookUrl = shop.settings?.feedogoWebhookUrl;

    if (!webhookUrl) {
      console.warn(`FeedoGo Webhook URL not configured for shop: ${shopDomain}`);
      return res.status(200).json({ success: true, message: 'FeedoGo Webhook URL not configured' });
    }

    // 1. 检查用户是否已存在
    try {
      const checkUserResponse = await axios.get(
        `${webhookUrl.replace('/webhooks/shopify', '')}/api/v1/users/check`,
        {
          params: { email: orderEmail },
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 5000,
        }
      );

      // 如果用户已存在，跳过注册，直接推送订单
      if (checkUserResponse.data?.exists) {
        console.log(`User already exists: ${orderEmail}`);
        await pushOrderToFeedoGo(
          webhookUrl,
          apiKey,
          orderId,
          orderData,
          orderEmail,
          shopDomain
        );
        return res.status(200).json({ success: true, message: 'User exists, order pushed' });
      }
    } catch (error: any) {
      console.warn(`Failed to check user: ${error.message}`);
      // 继续进行注册流程
    }

    // 2. 自动注册用户
    try {
      const registerResponse = await axios.post(
        `${webhookUrl.replace('/webhooks/shopify', '')}/api/v1/users/register`,
        {
          email: orderEmail,
          firstName: orderName?.split(' ')[0] || '',
          lastName: orderName?.split(' ').slice(1).join(' ') || '',
          source: 'shopify',
          shopifyOrderId: orderId,
          shopifyStore: shopDomain,
          autoRegister: true,
        },
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 10000,
        }
      );

      console.log(`User registered: ${orderEmail}`, registerResponse.data);

      // 3. 发送密码重置/登录链接
      try {
        await axios.post(
          `${webhookUrl.replace('/webhooks/shopify', '')}/api/v1/password-reset`,
          {
            email: orderEmail,
            redirectUrl: `https://${shopDomain}/admin`,
            type: 'welcome', // 欢迎邮件而非重置
          },
          {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 5000,
          }
        );
        console.log(`Welcome email sent: ${orderEmail}`);
      } catch (error: any) {
        console.warn(`Failed to send welcome email: ${error.message}`);
      }

      // 4. 推送订单到 FeedoGo
      await pushOrderToFeedoGo(
        webhookUrl,
        apiKey,
        orderId,
        orderData,
        orderEmail,
        shopDomain
      );

      // 5. 记录用户映射
      await prisma.userMapping.upsert({
        where: {
          shopifyCustomerId_shopId: {
            shopifyCustomerId: orderData.customer?.id || orderId,
            shopId: shop.id,
          },
        },
        create: {
          shopId: shop.id,
          shopifyCustomerId: orderData.customer?.id || orderId,
          feedogoEmail: orderEmail,
          syncStatus: 'synced',
          lastSyncAt: new Date(),
        },
        update: {
          feedogoEmail: orderEmail,
          syncStatus: 'synced',
          lastSyncAt: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        message: 'User registered and order pushed',
      });
    } catch (error: any) {
      console.error(`Auto-register failed: ${error.message}`);

      // 记录失败
      await prisma.orderPushLog.create({
        data: {
          shopId: shop.id,
          shopifyOrderId: orderId,
          status: 'failed',
          errorMessage: `Auto-register failed: ${error.message}`,
        },
      });

      return res.status(200).json({
        success: false,
        message: 'Auto-register failed',
        error: error.message,
      });
    }
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

async function pushOrderToFeedoGo(
  webhookUrl: string,
  apiKey: string,
  orderId: string,
  orderData: any,
  orderEmail: string,
  shopDomain: string
) {
  try {
    const response = await axios.post(
      webhookUrl,
      {
        type: 'order.created',
        shopifyOrderId: orderId,
        orderId: orderId,
        customerEmail: orderEmail,
        customerName: orderData.customer?.first_name || '',
        orderTotal: orderData.total_price,
        orderData: orderData,
        timestamp: new Date().toISOString(),
        source: 'shopify_thank_you_modal',
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log(`Order pushed successfully: ${orderId}`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to push order: ${error.message}`);
    throw error;
  }
}

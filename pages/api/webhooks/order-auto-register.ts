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
      return res.status(404).json({ error: 'Shop not found' });
    }

    // 检查是否启用自动注册
    if (!shop.settings?.enableAutoRegister) {
      return res.status(200).json({ success: true, message: 'Auto-register disabled' });
    }

    const webhookUrl = shop.settings?.feedogoWebhookUrl;
    const apiKey = shop.settings?.feedogoApiKey;

    if (!webhookUrl) {
      return res.status(200).json({ success: true, message: 'FeedoGo Webhook URL not configured' });
    }

    // 直接调用爱心币兑换接口
    try {
      const orderTotal = parseFloat(orderData.total_price || '0');
      console.log('Order Details:');
      console.log('- Order ID:', orderId);
      console.log('- Customer Email:', orderEmail);
      console.log('- Order Total:', orderTotal, orderData.currency || 'USD');
      
      // 调用 FeedoGo 的爱心币兑换接口
      const exchangeResponse = await axios.post(
        `${webhookUrl}/api/user/exchangeLoveCoin`,
        {
          email: orderEmail,
          money: orderTotal
        },
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (exchangeResponse.data?.code === 1) {
        await prisma.orderPushLog.create({
          data: {
            shopId: shop.id,
            shopifyOrderId: orderId,
            status: 'success',
            responseData: exchangeResponse.data,
          },
        });

        // 记录用户映射
        await prisma.userMapping.upsert({
          where: {
            shopifyCustomerId_shopId: {
              shopifyCustomerId: orderData.customer?.id?.toString() || orderId,
              shopId: shop.id,
            },
          },
          create: {
            shopId: shop.id,
            shopifyCustomerId: orderData.customer?.id?.toString() || orderId,
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
          message: 'Love coins exchanged successfully',
          orderTotal: orderTotal,
          loveCoins: orderTotal
        });
      } else {
        console.error('❌ Exchange failed:', exchangeResponse.data?.msg);
        throw new Error(`Exchange failed: ${exchangeResponse.data?.msg || 'Unknown error'}`);
      }
    } catch (error: any) {
      
      // 记录失败
      await prisma.orderPushLog.create({
        data: {
          shopId: shop.id,
          shopifyOrderId: orderId,
          status: 'failed',
          errorMessage: `Exchange failed: ${error.message}`,
          responseData: error.response?.data,
        },
      });

      return res.status(200).json({
        success: false,
        message: 'Exchange love coins failed',
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

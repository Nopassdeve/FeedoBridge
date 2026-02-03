import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyShopifyWebhook } from '@/lib/shopify';
import axios from 'axios';

interface ShopifyOrder {
  id: number;
  email: string;
  customer?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  financial_status: string;
  order_number: number;
  created_at: string;
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
  }>;
}

/**
 * Shopify 订单创建 Webhook 处理器
 * 功能：
 * 1. 用户下单后自动将订单金额发送给 FeedoGo（兑换爱心币）
 * 2. 如果用户未在 FeedoGo 注册，先检查并提示
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 验证 Shopify Webhook 签名
  const hmac = req.headers['x-shopify-hmac-sha256'] as string;
  const rawBody = JSON.stringify(req.body);
  
  if (!verifyShopifyWebhook(rawBody, hmac)) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const order: ShopifyOrder = req.body;
  const shopDomain = req.headers['x-shopify-shop-domain'] as string;

  console.log(`📦 收到订单创建事件: 订单#${order.order_number}, 金额: ${order.total_price} ${order.currency}, 客户: ${order.email}`);

  if (!order.email || !shopDomain) {
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

    const webhookUrl = shop.settings?.feedogoWebhookUrl;
    
    if (!webhookUrl) {
      console.warn(`FeedoGo Webhook URL not configured for shop: ${shopDomain}`);
      return res.status(200).json({ 
        success: true, 
        message: 'FeedoGo Webhook URL not configured' 
      });
    }

    const feedogoBaseUrl = webhookUrl;
    
    // 提取订单金额（转换为数字）
    const orderAmount = parseFloat(order.total_price);
    
    if (isNaN(orderAmount) || orderAmount <= 0) {
      console.warn(`Invalid order amount: ${order.total_price}`);
      return res.status(200).json({
        success: false,
        message: 'Invalid order amount'
      });
    }

    // 1. 先检查用户是否在 FeedoGo 注册
    let userExists = false;
    try {
      const checkResponse = await axios.post(
        `${feedogoBaseUrl}/api/user/emailLogin`,
        { email: order.email },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );

      if (checkResponse.data?.code === 1 && checkResponse.data?.data?.userinfo?.token) {
        userExists = true;
        console.log(`✅ 用户已在 FeedoGo 注册: ${order.email}`);
      }
    } catch (error: any) {
      console.log(`⚠️ 用户未在 FeedoGo 注册: ${order.email}`);
    }

    // 2. 调用爱心币兑换接口，同步订单金额
    try {
      console.log(`💰 同步订单金额到 FeedoGo: ${order.email} - ${orderAmount} ${order.currency}`);
      
      const exchangeResponse = await axios.post(
        `${feedogoBaseUrl}/api/user/exchangeLoveCoin`,
        {
          email: order.email,
          money: orderAmount
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      console.log('FeedoGo 爱心币兑换响应:', exchangeResponse.data);

      // 记录订单推送日志
      await prisma.orderPushLog.create({
        data: {
          shopId: shop.id,
          shopifyOrderId: order.id.toString(),
          feedogoOrderId: order.order_number.toString(),
          status: exchangeResponse.data?.code === 1 ? 'success' : 'failed',
          errorMessage: exchangeResponse.data?.code !== 1 ? exchangeResponse.data?.msg : null,
          retryCount: 0,
        },
      });

      if (exchangeResponse.data?.code === 1) {
        console.log(`✅ 订单金额同步成功: 订单#${order.order_number}`);
        
        return res.status(200).json({
          success: true,
          message: '订单金额已同步到 FeedoGo',
          order_id: order.id,
          order_number: order.order_number,
          amount: orderAmount,
          email: order.email,
          userExists: userExists,
        });
      } else {
        console.warn(`❌ 订单金额同步失败: ${exchangeResponse.data?.msg || '未知错误'}`);
        
        return res.status(200).json({
          success: false,
          message: exchangeResponse.data?.msg || 'Exchange failed',
          order_id: order.id,
          order_number: order.order_number,
        });
      }
    } catch (error: any) {
      console.error('调用爱心币兑换接口失败:', error.message);
      
      // 记录失败日志
      await prisma.orderPushLog.create({
        data: {
          shopId: shop.id,
          shopifyOrderId: order.id.toString(),
          status: 'failed',
          errorMessage: error.message,
          retryCount: 0,
        },
      });

      return res.status(200).json({
        success: false,
        message: `Exchange error: ${error.message}`,
        order_id: order.id,
      });
    }

  } catch (error: any) {
    console.error('处理订单创建事件失败:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

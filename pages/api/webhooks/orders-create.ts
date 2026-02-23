// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyShopifyWebhook } from '@/lib/shopify';
import axios from 'axios';
import { Readable } from 'stream';

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

// 禁用 Next.js 自动解析 body，我们需要原始的 buffer 来验证签名
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Shopify 订单创建 Webhook 处理器
 * 功能：
 * 1. 用户下单后自动将订单金额发送给 FeedoGo（兑换爱心币）
 * 2. 如果用户未在 FeedoGo 注册，先检查并提示
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('===== [Webhook] 收到订单创建请求 =====');
  
  if (req.method !== 'POST') {
    console.log('[Webhook] 错误：非 POST 请求');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 读取原始 body
    const rawBody = await getRawBody(req);
    console.log('[Webhook] 接收到 Body 长度:', rawBody.length);
    
    // 验证 Shopify Webhook 签名
    const hmac = req.headers['x-shopify-hmac-sha256'] as string;
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;
    
    console.log('[Webhook] Shop Domain:', shopDomain);
    console.log('[Webhook] HMAC Header:', hmac ? '存在' : '缺失');
    
    if (!hmac) {
      console.error('[Webhook] 错误：缺少 HMAC 签名');
      return res.status(401).json({ error: 'Missing HMAC signature' });
    }
    
    const isValid = verifyShopifyWebhook(rawBody, hmac);
    console.log('[Webhook] 签名验证结果:', isValid);
    
    if (!isValid) {
      console.error('[Webhook] 错误：签名验证失败');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 解析 JSON
    const order: ShopifyOrder = JSON.parse(rawBody);
    console.log('[Webhook] 订单 ID:', order.id);
    console.log('[Webhook] 订单金额:', order.total_price);
    console.log('[Webhook] 客户邮箱:', order.email);

    if (!order.email || !shopDomain) {
      console.log('[Webhook] 错误：缺少必需字段');
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // === 主要业务逻辑 ===
    
    // 获取店铺记录
    console.log('[Webhook] 查询店铺记录:', shopDomain);
    const shop = await prisma.shop.findUnique({
      where: { shopifyShopId: shopDomain },
      include: { settings: true },
    });

    if (!shop) {
      console.log('[Webhook] 错误：店铺未找到');
      return res.status(404).json({ error: 'Shop not found' });
    }

    console.log('[Webhook] 店铺 ID:', shop.id);
    const webhookUrl = shop.settings?.feedogoWebhookUrl;
    console.log('[Webhook] FeedoGo URL:', webhookUrl);
    
    if (!webhookUrl) {
      console.log('[Webhook] Webhook URL 未配置，跳过处理');
      return res.status(200).json({ 
        success: true, 
        message: 'FeedoGo Webhook URL not configured' 
      });
    }

    const feedogoBaseUrl = webhookUrl;
    
    // 提取订单金额（转换为数字）
    const orderAmount = parseFloat(order.total_price);
    console.log('[Webhook] 解析后的订单金额:', orderAmount);
    
    if (isNaN(orderAmount) || orderAmount <= 0) {
      console.log('[Webhook] 无效的订单金额');
      return res.status(200).json({
        success: false,
        message: 'Invalid order amount'
      });
    }

    // 1. 先检查用户是否在 FeedoGo 注册
    console.log('[Webhook] 检查用户是否注册:', order.email);
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
        console.log('[Webhook] 用户已注册');
      } else {
        console.log('[Webhook] 用户未注册');
      }
    } catch (error: any) {
      console.log('[Webhook] 用户注册检查失败:', error.message);
    }

    // 2. 调用爱心币兑换接口，同步订单金额
    console.log('[Webhook] 调用爱心币兑换 API...');
    try {
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

      console.log('[Webhook] 兑换 API 响应码:', exchangeResponse.data?.code);
      console.log('[Webhook] 兑换 API 消息:', exchangeResponse.data?.msg);

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
      
      console.log('[Webhook] 订单日志已记录');

      if (exchangeResponse.data?.code === 1) {
        console.log('[Webhook] ✅ 订单处理成功');
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
        console.log('[Webhook] ❌ 兑换失败:', exchangeResponse.data?.msg);
        return res.status(200).json({
          success: false,
          message: exchangeResponse.data?.msg || 'Exchange failed',
          order_id: order.id,
          order_number: order.order_number,
        });
      }
    } catch (error: any) {
      console.error('[Webhook] ❌ 兑换 API 调用失败:', error.message);
      
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
    console.error('[Webhook] ❌ 处理订单创建事件失败:', error);
    console.error('[Webhook] 错误堆栈:', error.stack);
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


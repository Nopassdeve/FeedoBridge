import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

/**
 * 测试订单金额兑换爱心币功能
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { shop, email, money } = req.body;

  if (!shop || !email || !money) {
    return res.status(400).json({ 
      error: 'Missing required parameters',
      required: ['shop', 'email', 'money']
    });
  }

  const amount = parseFloat(money);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
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

    const feedogoBaseUrl = webhookUrl;

    // 1. 先检查用户是否存在
    let userExists = false;
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
      }
    } catch (error) {
      console.log('用户检查:', email, '不存在或检查失败');
    }

    // 2. 调用爱心币兑换接口
    console.log(`测试兑换爱心币: ${email} - ${amount}`);
    
    const exchangeResponse = await axios.post(
      `${feedogoBaseUrl}/api/user/exchangeLoveCoin`,
      {
        email: email,
        money: amount
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    console.log('FeedoGo 响应:', exchangeResponse.data);

    if (exchangeResponse.data?.code === 1) {
      return res.status(200).json({
        success: true,
        message: '爱心币兑换成功',
        email: email,
        amount: amount,
        userExists: userExists,
        feedogoResponse: exchangeResponse.data
      });
    } else {
      return res.status(200).json({
        success: false,
        message: exchangeResponse.data?.msg || '兑换失败',
        email: email,
        amount: amount,
        userExists: userExists,
        feedogoResponse: exchangeResponse.data
      });
    }

  } catch (error: any) {
    console.error('测试兑换爱心币失败:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      response: error.response?.data
    });
  }
}

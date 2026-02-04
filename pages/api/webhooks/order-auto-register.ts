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

  console.log('========================================');
  console.log('📦 Order Auto-Register Webhook Received');
  console.log('========================================');
  console.log('Shop Domain:', shopDomain);
  console.log('Order ID:', orderId);
  console.log('Order Name:', orderName);
  console.log('Customer Email:', orderEmail);
  console.log('Order Total:', orderData?.total_price);
  console.log('----------------------------------------');

  try {
    // 获取店铺记录
    const shop = await prisma.shop.findUnique({
      where: { shopifyShopId: shopDomain },
      include: { settings: true },
    });

    if (!shop) {
      console.error(`❌ Shop not found: ${shopDomain}`);
      return res.status(404).json({ error: 'Shop not found' });
    }

    console.log('✅ Shop found:', shop.shopifyShopId);

    // 检查是否启用自动注册
    if (!shop.settings?.enableAutoRegister) {
      console.warn('⚠️ Auto-register is disabled for this shop');
      return res.status(200).json({ success: true, message: 'Auto-register disabled' });
    }

    console.log('✅ Auto-register is enabled');

    const webhookUrl = shop.settings?.feedogoWebhookUrl;
    const apiKey = shop.settings?.feedogoApiKey;

    if (!webhookUrl) {
      console.error('❌ FeedoGo Webhook URL not configured for shop:', shopDomain);
      return res.status(200).json({ success: true, message: 'FeedoGo Webhook URL not configured' });
    }

    console.log('✅ FeedoGo Webhook URL:', webhookUrl);
    console.log('✅ API Key configured:', apiKey ? 'Yes (hidden)' : 'No');

    console.log('✅ FeedoGo Webhook URL:', webhookUrl);
    console.log('✅ API Key configured:', apiKey ? 'Yes (hidden)' : 'No');

    // 使用 emailLogin 方式进行订单推送
    console.log('');
    console.log('🔐 Step 1: Email Login to get token');
    console.log('----------------------------------------');
    
    try {
      const emailLoginResponse = await axios.post(
        `${webhookUrl}/api/user/emailLogin`,
        { email: orderEmail },
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      console.log('Email Login Response Code:', emailLoginResponse.data?.code);
      
      if (emailLoginResponse.data?.code === 1 && emailLoginResponse.data?.data?.userinfo) {
        const userInfo = emailLoginResponse.data.data.userinfo;
        console.log('✅ Email login successful');
        console.log('User ID:', userInfo.user_id);
        console.log('Nickname:', userInfo.nickname);
        console.log('Current Score:', userInfo.score);
        console.log('Token:', userInfo.token ? userInfo.token.substring(0, 20) + '...' : 'N/A');
        
        // 推送订单到 FeedoGo
        console.log('');
        console.log('💰 Step 2: Push order to FeedoGo (convert to love coins)');
        console.log('----------------------------------------');
        
        await pushOrderToFeedoGo(
          webhookUrl,
          userInfo.token,
          orderId,
          orderData,
          orderEmail,
          shopDomain,
          userInfo.user_id
        );

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
            feedogoUserId: userInfo.user_id.toString(),
            syncStatus: 'synced',
            lastSyncAt: new Date(),
          },
          update: {
            feedogoEmail: orderEmail,
            feedogoUserId: userInfo.user_id.toString(),
            syncStatus: 'synced',
            lastSyncAt: new Date(),
          },
        });

        console.log('');
        console.log('========================================');
        console.log('✅ Order processed successfully!');
        console.log('========================================');

        return res.status(200).json({
          success: true,
          message: 'Order pushed successfully',
          userId: userInfo.user_id,
          currentScore: userInfo.score
        });
      } else {
        console.error('❌ Email login failed:', emailLoginResponse.data?.msg);
        throw new Error(`Email login failed: ${emailLoginResponse.data?.msg || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('❌ Email login error:', error.message);
      console.error('Error details:', error.response?.data || error.message);
      
      // 记录失败
      await prisma.orderPushLog.create({
        data: {
          shopId: shop.id,
          shopifyOrderId: orderId,
          status: 'failed',
          errorMessage: `Email login failed: ${error.message}`,
        },
      });

      return res.status(200).json({
        success: false,
        message: 'Order push failed',
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
  token: string,
  orderId: string,
  orderData: any,
  orderEmail: string,
  shopDomain: string,
  userId: number
) {
  try {
    // 计算应该获得的爱心币（根据订单金额）
    const orderTotal = parseFloat(orderData.total_price || '0');
    const expectedCoins = Math.floor(orderTotal); // 1元 = 1爱心币，可以根据规则调整
    
    console.log('Order Details:');
    console.log('- Order ID:', orderId);
    console.log('- Order Total:', orderTotal, orderData.currency || 'USD');
    console.log('- Expected Love Coins:', expectedCoins);
    console.log('- Customer Email:', orderEmail);
    console.log('- Customer Name:', orderData.customer?.first_name, orderData.customer?.last_name);
    
    // 调用 FeedoGo API 添加爱心币
    // 注意：这里需要确认 FeedoGo 是否有专门的"添加积分"接口
    // 如果没有，可能需要 FeedoGo 团队提供
    const response = await axios.post(
      `${webhookUrl}/api/user/addScore`, // 假设的接口，需要确认
      {
        user_id: userId,
        score: expectedCoins,
        reason: `Shopify Order ${orderId}`,
        order_id: orderId,
        order_total: orderTotal,
        currency: orderData.currency || 'USD',
        shop: shopDomain,
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'token': token // 使用 emailLogin 返回的 token
        },
        timeout: 10000,
      }
    );

    console.log('✅ Order pushed to FeedoGo successfully');
    console.log('Response:', response.data);
    
    // 记录成功日志
    await prisma.orderPushLog.create({
      data: {
        shopId: (await prisma.shop.findUnique({ where: { shopifyShopId: shopDomain }}))!.id,
        shopifyOrderId: orderId,
        status: 'success',
        responseData: response.data,
      },
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to push order to FeedoGo');
    console.error('Error:', error.message);
    console.error('Response:', error.response?.data);
    
    // 记录失败日志
    await prisma.orderPushLog.create({
      data: {
        shopId: (await prisma.shop.findUnique({ where: { shopifyShopId: shopDomain }}))!.id,
        shopifyOrderId: orderId,
        status: 'failed',
        errorMessage: `Failed to push order: ${error.message}`,
        responseData: error.response?.data,
      },
    });
    
    throw error;
  }
}

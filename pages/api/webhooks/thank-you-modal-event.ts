import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

interface ThankYouModalEvent {
  event: string;
  data: {
    orderId: string;
    shop: string;
    buttonLink?: string;
  };
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { event, data, timestamp }: ThankYouModalEvent = req.body;

  if (!event || !data || !data.shop || !data.orderId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 获取店铺
    const shop = await prisma.shop.findUnique({
      where: { shopifyShopId: data.shop },
    });

    if (!shop) {
      console.warn(`Shop not found: ${data.shop}`);
      return res.status(404).json({ error: 'Shop not found' });
    }

    // 记录事件到数据库（如果需要）
    // 这里可以添加一个新的表来记录感谢页面弹窗事件
    console.log(`Thank you modal event: ${event}`, {
      orderId: data.orderId,
      shop: data.shop,
      timestamp,
    });

    // 根据事件类型处理
    switch (event) {
      case 'thank_you_modal_shown':
        // 记录弹窗显示
        console.log(`Modal shown for order: ${data.orderId}`);
        break;

      case 'thank_you_modal_clicked':
        // 记录按钮点击
        console.log(`Modal button clicked for order: ${data.orderId}`, {
          buttonLink: data.buttonLink,
        });
        break;

      case 'thank_you_modal_closed':
        // 记录弹窗关闭
        console.log(`Modal closed for order: ${data.orderId}`);
        break;

      default:
        console.warn(`Unknown event: ${event}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Event logged',
    });
  } catch (error: any) {
    console.error('Event logging error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

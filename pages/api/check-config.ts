// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const appUrl = process.env.APP_URL || process.env.HOST || 'https://plugin.ifeedog.com';
  
  const config = {
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY?.substring(0, 10) + '...',
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ? 'SET (hidden)' : 'NOT SET',
    HOST: process.env.HOST,
    APP_URL: process.env.APP_URL,
    SCOPES: process.env.SCOPES,
    
    expectedConfig: {
      applicationUrl: appUrl,
      redirectUrls: [
        `${appUrl}/api/auth/callback`
      ],
      scopes: 'read_products,write_products,read_customers,write_customers,read_orders,write_orders'
    },
    
    installUrl: `${appUrl}/api/auth?shop=YOUR_SHOP.myshopify.com`,
    
    instructions: [
      '1. 登录 Shopify Partners: https://partners.shopify.com',
      '2. 进入 Apps → FeedoBridge → Configuration',
      '3. 确保以下配置匹配：',
      `   - App URL: ${appUrl}`,
      `   - Allowed redirection URL(s): ${appUrl}/api/auth/callback`,
      '4. 保存配置',
      `5. 使用安装 URL: ${appUrl}/api/auth?shop=feedogostore.myshopify.com`
    ]
  };

  res.status(200).json(config);
}

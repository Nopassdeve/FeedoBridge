import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, feedogoWebhookUrl } = req.body;

  if (!email || !feedogoWebhookUrl) {
    return res.status(400).json({
      success: false,
      message: '邮箱和 FeedoGo 地址为必填项'
    });
  }

  try {
    // 调用 FeedoGo 邮箱登录接口
    const response = await axios.post(
      `${feedogoWebhookUrl.replace('/webhooks/shopify', '')}/api/user/emailLogin`,
      { email },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data?.code === 1 && response.data?.data?.userinfo?.token) {
      // 登录成功
      const userInfo = response.data.data.userinfo;
      
      return res.status(200).json({
        success: true,
        message: 'Email login successful',
        data: {
          id: userInfo.id,
          userId: userInfo.user_id,
          username: userInfo.username || '',
          nickname: userInfo.nickname,
          mobile: userInfo.mobile || '',
          avatar: userInfo.avatar,
          score: userInfo.score || 0,
          token: userInfo.token,
          createtime: userInfo.createtime,
          expiretime: userInfo.expiretime,
          expiresIn: userInfo.expires_in
        }
      });
    } else {
      return res.status(200).json({
        success: false,
        message: response.data?.msg || 'Email login failed'
      });
    }
  } catch (error: any) {
    console.error('Email login error:', error);

    if (error.response?.status === 404) {
      return res.status(200).json({
        success: false,
        message: '该邮箱未注册或 FeedoGo 地址有误'
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(200).json({
        success: false,
        message: '无法连接到 FeedoGo 服务，请检查配置'
      });
    }

    if (error.code === 'ETIMEDOUT') {
      return res.status(200).json({
        success: false,
        message: 'FeedoGo 服务响应超时'
      });
    }

    return res.status(200).json({
      success: false,
      message: `登录失败: ${error.message || '未知错误'}`
    });
  }
}

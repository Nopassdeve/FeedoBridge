import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey, webhookUrl } = req.body;

  if (!apiKey || !webhookUrl) {
    return res.status(400).json({ 
      success: false, 
      message: '请提供 API Key 和 Webhook URL' 
    });
  }

  try {
    // 尝试调用 FeedoGo 的健康检查接口
    const response = await axios.post(
      `${webhookUrl}/health`,
      { test: true },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10秒超时
      }
    );

    if (response.status === 200) {
      return res.status(200).json({
        success: true,
        message: 'FeedoGo API 连接成功！'
      });
    } else {
      return res.status(200).json({
        success: false,
        message: `连接返回状态码: ${response.status}`
      });
    }
  } catch (error: any) {
    // 如果是 404，可能健康检查接口不存在，尝试简单的 GET 请求
    if (error.response?.status === 404) {
      try {
        const pingResponse = await axios.get(webhookUrl, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          timeout: 10000
        });
        
        return res.status(200).json({
          success: true,
          message: 'Webhook URL 可访问（健康检查接口未找到，但服务器响应正常）'
        });
      } catch {
        // 继续到下面的错误处理
      }
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(200).json({
        success: false,
        message: '无法连接到服务器，请检查 Webhook URL 是否正确'
      });
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return res.status(200).json({
        success: false,
        message: '连接超时，请检查网络或服务器状态'
      });
    }

    if (error.response?.status === 401) {
      return res.status(200).json({
        success: false,
        message: 'API Key 验证失败，请检查密钥是否正确'
      });
    }

    if (error.response?.status === 403) {
      return res.status(200).json({
        success: false,
        message: '访问被拒绝，请检查 API 权限配置'
      });
    }

    return res.status(200).json({
      success: false,
      message: `连接测试失败: ${error.message || '未知错误'}`
    });
  }
}

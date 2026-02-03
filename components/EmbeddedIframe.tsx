'use client';

import { useEffect, useRef, useState } from 'react';
import { Frame } from '@shopify/polaris';

interface EmbeddedIframeProps {
  url: string;
  customerId?: string;
  customerEmail?: string;
  shopId: string;
  feedogoWebhookUrl?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface TokenData {
  id: number;
  userId: number;
  username: string;
  nickname: string;
  mobile: string;
  avatar: string;
  score: number;
  token: string;
  createtime: number;
  expiretime: number;
  expiresIn: number;
}

export default function EmbeddedIframe({ 
  url, 
  customerId, 
  customerEmail, 
  shopId,
  feedogoWebhookUrl,
  onLoad,
  onError 
}: EmbeddedIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [ssoUrl, setSsoUrl] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);

  useEffect(() => {
    async function initLogin() {
      if (!customerEmail) {
        setSsoUrl(url);
        return;
      }

      // 优先尝试邮箱登录（如果配置了 FeedoGo Webhook URL）
      if (feedogoWebhookUrl) {
        try {
          const response = await fetch('/api/email-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: customerEmail,
              feedogoWebhookUrl 
            })
          });

          const result = await response.json();
          
          if (result.success && result.data?.token) {
            // 邮箱登录成功
            setTokenData(result.data);
            
            // 构建 token 登录 URL
            const tokenUrl = new URL(url);
            tokenUrl.searchParams.append('token', result.data.token);
            tokenUrl.searchParams.append('user_id', result.data.userId.toString());
            tokenUrl.searchParams.append('shop', shopId);
            tokenUrl.searchParams.append('method', 'email-login');
            
            setSsoUrl(tokenUrl.toString());
            return;
          }
        } catch (error) {
          console.warn('Email login failed, falling back to SSO:', error);
        }
      }

      // 降级到 SSO 登录方式
      try {
        if (!customerId) {
          setSsoUrl(url);
          return;
        }

        const response = await fetch('/api/sso/generate-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId, customerEmail, shopId })
        });

        const { data, hmac } = await response.json();
        
        const ssoParams = new URLSearchParams({
          sso_data: JSON.stringify({ ...data, hmac })
        });

        setSsoUrl(`${url}?${ssoParams.toString()}`);
      } catch (error) {
        onError?.(error as Error);
        setSsoUrl(url);
      }
    }

    initLogin();
  }, [customerId, customerEmail, shopId, url, feedogoWebhookUrl, onError]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(url).origin) return;

      if (event.data.type === 'SSO_SUCCESS') {
        console.log('SSO login successful');
      }

      if (event.data.type === 'EMAIL_LOGIN_SUCCESS') {
        console.log('Email login successful', event.data);
      }

      if (event.data.type === 'RESIZE') {
        if (iframeRef.current) {
          iframeRef.current.style.height = `${event.data.height}px`;
        }
      }

      // iframe 请求刷新 token
      if (event.data.type === 'REFRESH_TOKEN') {
        if (tokenData) {
          iframeRef.current?.contentWindow?.postMessage(
            {
              type: 'TOKEN_DATA',
              id: tokenData.id,
              userId: tokenData.userId,
              username: tokenData.username,
              nickname: tokenData.nickname,
              mobile: tokenData.mobile,
              avatar: tokenData.avatar,
              score: tokenData.score,
              token: tokenData.token,
              createtime: tokenData.createtime,
              expiretime: tokenData.expiretime,
              expiresIn: tokenData.expiresIn
            },
            new URL(url).origin
          );
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [url, tokenData]);

  const handleIframeLoad = () => {
    setLoading(false);
    onLoad?.();

    // 如果有 token（邮箱登录成功），发送 token 数据
    if (iframeRef.current && tokenData) {
      iframeRef.current.contentWindow?.postMessage(
        {
          type: 'TOKEN_DATA',
          id: tokenData.id,
          userId: tokenData.userId,
          username: tokenData.username,
          nickname: tokenData.nickname,
          mobile: tokenData.mobile,
          avatar: tokenData.avatar,
          score: tokenData.score,
          token: tokenData.token,
          createtime: tokenData.createtime,
          expiretime: tokenData.expiretime,
          expiresIn: tokenData.expiresIn
        },
        new URL(url).origin
      );
    }
    // 否则发送客户信息用于 SSO
    else if (iframeRef.current && customerId) {
      iframeRef.current.contentWindow?.postMessage(
        {
          type: 'SHOPIFY_CUSTOMER_DATA',
          customerId,
          customerEmail
        },
        new URL(url).origin
      );
    }
  };

  if (!ssoUrl) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <Frame>
      {loading && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>加载中...</p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={ssoUrl}
        style={{
          width: '100%',
          height: '600px',
          border: 'none',
          display: loading ? 'none' : 'block'
        }}
        onLoad={handleIframeLoad}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        title="FeedoGo Embedded"
      />
    </Frame>
  );
}

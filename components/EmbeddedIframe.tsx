// @ts-nocheck
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
              feedogoBaseUrl: feedogoWebhookUrl 
            })
          });

          const result = await response.json();
          
          if (result.success && result.data?.token) {
            // 邮箱登录成功
            setTokenData(result.data);
            
            // 方法1: 尝试通过 hash 传递 token（很多前端框架会读取 hash）
            const tokenUrl = new URL(url);
            
            // 查询参数方式
            tokenUrl.searchParams.append('token', result.data.token);
            tokenUrl.searchParams.append('user_id', result.data.userId.toString());
            tokenUrl.searchParams.append('username', result.data.username || '');
            tokenUrl.searchParams.append('nickname', result.data.nickname || '');
            tokenUrl.searchParams.append('shop', shopId);
            tokenUrl.searchParams.append('method', 'email-login');
            tokenUrl.searchParams.append('auto_login', '1');
            
            // Hash 方式（备选方案，很多 SPA 会读取 hash）
            const hashData = {
              token: result.data.token,
              userId: result.data.userId,
              username: result.data.username,
              nickname: result.data.nickname,
              autoLogin: true
            };
            tokenUrl.hash = `auth=${encodeURIComponent(JSON.stringify(hashData))}`;
            
            setSsoUrl(tokenUrl.toString());
            return;
          }
        } catch (error) {
          // ignore and fallback to SSO
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
      if (event.data?.type === 'FEEDOGO_TOP_REDIRECT' && event.data?.url) {
        const requestedUrl = String(event.data.url);

        const normalizeLoginRedirect = (value: string) => {
          let parsed: URL;
          try {
            parsed = new URL(value);
          } catch (error) {
            return value;
          }

          let storefrontOrigin: string | null = null;
          let returnPath = '/';
          try {
            if (document.referrer) {
              const referrer = new URL(document.referrer);
              storefrontOrigin = referrer.origin;
              returnPath = `${referrer.pathname || '/'}${referrer.search || ''}${referrer.hash || ''}`;
            }
          } catch (error) {
            // ignore
          }

          const returnUrl = storefrontOrigin ? `${storefrontOrigin}${returnPath}` : returnPath;

          const isShopifyPlatformHost = parsed.hostname === 'shopify.com' || parsed.hostname.endsWith('.shopify.com');
          const isAccountPath = parsed.pathname.startsWith('/account');
          const isShopifyAuthenticationLogin = parsed.pathname.includes('/authentication/') && parsed.pathname.endsWith('/login');

          if ((isAccountPath || isShopifyAuthenticationLogin) && (isShopifyPlatformHost || (storefrontOrigin && parsed.origin !== storefrontOrigin))) {
            if (!storefrontOrigin) {
              return parsed.toString();
            }

            const storefrontLoginUrl = new URL('/account/login', storefrontOrigin);
            storefrontLoginUrl.searchParams.set('return_url', returnUrl);
            return storefrontLoginUrl.toString();
          }

          if (!parsed.pathname.startsWith('/account/login')) {
            return parsed.toString();
          }

          parsed.searchParams.set('return_url', returnUrl);
          return parsed.toString();
        };

        const redirectUrl = normalizeLoginRedirect(requestedUrl);

        let parsedUrl: URL | null = null;
        try {
          parsedUrl = new URL(redirectUrl);
        } catch (error) {
          return;
        }

        const host = parsedUrl.hostname;
        const isShopifyHost =
          host === 'shopify.com' ||
          host.endsWith('.shopify.com') ||
          host.endsWith('.myshopify.com') ||
          host === 'admin.shopify.com';
        let isStorefrontAccountUrl = false;
        try {
          if (document.referrer) {
            const referrerHost = new URL(document.referrer).hostname;
            isStorefrontAccountUrl = host === referrerHost && parsedUrl.pathname.startsWith('/account');
          }
        } catch (error) {
          // ignore
        }

        if (!isShopifyHost && !isStorefrontAccountUrl) {
          return;
        }

        try {
          window.top!.location.href = redirectUrl;
          return;
        } catch (error) {
          // fallback to relay
        }

        try {
          window.parent.postMessage(
            {
              type: 'FEEDOGO_TOP_REDIRECT',
              url: redirectUrl
            },
            '*'
          );
        } catch (error) {
          // ignore
        }

        return;
      }

      if (event.data?.type === 'FEEDOGO_CUSTOMER_LOGOUT' || event.data?.type === 'FEEDOGO_LOGOUT') {
        if (event.origin !== new URL(url).origin) return;

        try {
          window.top!.location.href = '/account/logout';
          return;
        } catch (error) {
          // fallback to relay
        }

        try {
          window.parent.postMessage(
            {
              type: 'FEEDOGO_CUSTOMER_LOGOUT',
              source: 'feedogo-iframe'
            },
            '*'
          );
        } catch (error) {
          // ignore
        }

        return;
      }

      // Relay SHOPIFY_CUSTOMER_LOGOUT / SHOPIFY_AUTH_STATE from parent page → inner FeedoGo iframe
      if (
        event.data?.type === 'SHOPIFY_CUSTOMER_LOGOUT' ||
        event.data?.type === 'SHOPIFY_AUTH_STATE'
      ) {
        if (event.source === window.parent && iframeRef.current?.contentWindow) {
          try {
            iframeRef.current.contentWindow.postMessage(event.data, new URL(url).origin);
          } catch (error) {
            // ignore
          }
        }
        return;
      }

      // Relay FEEDOGO_LOGOUT_ACK from inner FeedoGo iframe → parent page
      if (event.data?.type === 'FEEDOGO_LOGOUT_ACK') {
        if (event.origin === new URL(url).origin) {
          try {
            window.parent.postMessage(event.data, '*');
          } catch (error) {
            // ignore
          }
        }
        return;
      }

      if (event.origin !== new URL(url).origin) return;

      if (event.data.type === 'SSO_SUCCESS') {
      }

      if (event.data.type === 'EMAIL_LOGIN_SUCCESS') {
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
      const tokenMessage = {
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
      };
      
      iframeRef.current.contentWindow?.postMessage(tokenMessage, new URL(url).origin);
      
      // 延迟 500ms 后再发送一次，确保 iframe 内容已完全加载
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(tokenMessage, new URL(url).origin);
      }, 500);
      
      // 再延迟 2 秒发送一次
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(tokenMessage, new URL(url).origin);
      }, 2000);
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
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Frame>
      {loading && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Loading...</p>
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
        title="FeedoGo Embedded"
      />
    </Frame>
  );
}

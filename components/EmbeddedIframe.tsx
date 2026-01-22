'use client';

import { useEffect, useRef, useState } from 'react';
import { Frame, Loading } from '@shopify/polaris';

interface EmbeddedIframeProps {
  url: string;
  customerId?: string;
  customerEmail?: string;
  shopId: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export default function EmbeddedIframe({ 
  url, 
  customerId, 
  customerEmail, 
  shopId,
  onLoad,
  onError 
}: EmbeddedIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [ssoUrl, setSsoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function initSSO() {
      if (!customerId || !customerEmail) {
        setSsoUrl(url);
        return;
      }

      try {
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

    initSSO();
  }, [customerId, customerEmail, shopId, url, onError]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(url).origin) return;

      if (event.data.type === 'SSO_SUCCESS') {
        console.log('SSO login successful');
      }

      if (event.data.type === 'RESIZE') {
        if (iframeRef.current) {
          iframeRef.current.style.height = `${event.data.height}px`;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [url]);

  const handleIframeLoad = () => {
    setLoading(false);
    onLoad?.();

    if (iframeRef.current && customerId) {
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
    return <Loading />;
  }

  return (
    <Frame>
      {loading && <Loading />}
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

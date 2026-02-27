// @ts-nocheck
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import EmbeddedIframe from '@/components/EmbeddedIframe';
import { Frame } from '@shopify/polaris';

interface Settings {
  embeddedIframeUrl: string;
  feedogoWebhookUrl?: string;
}

export default function EmbedPage() {
  const router = useRouter();
  const { shop, customerId, customerEmail } = router.query;
  const [feedogoFrontendUrl, setFeedogoFrontendUrl] = useState<string | null>(null);
  const [feedogoWebhookUrl, setFeedogoWebhookUrl] = useState<string>('');

  useEffect(() => {
    async function fetchSettings() {
      if (!shop) return;
      
      try {
        const response = await fetch(`/api/settings?shop=${shop}`);
        
        if (response.ok) {
          const data: Settings = await response.json();
          
          const apiBaseUrl = data.feedogoWebhookUrl || 'https://shop.feedogocloud.com';
          setFeedogoWebhookUrl(apiBaseUrl);
          
          // 从 API base URL 推断前端 URL
          // 例如: https://shop.feedogocloud.com -> https://feedogocloud.com
          const frontendUrl = apiBaseUrl.replace('/api', '').replace('shop.', '');
          setFeedogoFrontendUrl(frontendUrl);
        } else {
          // 如果商店未找到，使用默认值
          setFeedogoWebhookUrl('https://shop.feedogocloud.com');
          setFeedogoFrontendUrl('https://feedogocloud.com');
        }
      } catch (error) {
        // 出错时使用默认值
        setFeedogoWebhookUrl('https://shop.feedogocloud.com');
        setFeedogoFrontendUrl('https://feedogocloud.com');
      }
    }

    fetchSettings();
  }, [shop]);

  if (!feedogoFrontendUrl || !shop) {
    return <Frame>Loading...</Frame>;
  }

  return (
    <EmbeddedIframe
      url={feedogoFrontendUrl}
      customerId={customerId as string}
      customerEmail={customerEmail as string}
      shopId={shop as string}
      feedogoWebhookUrl={feedogoWebhookUrl}
    />
  );
}

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
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [feedogoWebhookUrl, setFeedogoWebhookUrl] = useState<string>('');

  useEffect(() => {
    async function fetchSettings() {
      if (!shop) return;
      
      console.log('FeedoBridge Embed: Fetching settings for shop:', shop);
      
      try {
        const response = await fetch(`/api/settings?shop=${shop}`);
        
        if (response.ok) {
          const data: Settings = await response.json();
          console.log('FeedoBridge Embed: Settings loaded:', data);
          setIframeUrl(data.embeddedIframeUrl);
          setFeedogoWebhookUrl(data.feedogoWebhookUrl || '');
        } else {
          // 如果商店未找到，使用默认值
          console.warn('FeedoBridge Embed: Shop not found in database, using defaults');
          setIframeUrl('https://feedogocloud.com/');
          setFeedogoWebhookUrl('https://shop.feedogocloud.com');
        }
      } catch (error) {
        console.error('FeedoBridge Embed: Failed to fetch settings:', error);
        // 出错时使用默认值
        setIframeUrl('https://feedogocloud.com/');
        setFeedogoWebhookUrl('https://shop.feedogocloud.com');
      }
    }

    fetchSettings();
  }, [shop]);

  if (!iframeUrl || !shop) {
    return <Frame>Loading...</Frame>;
  }

  return (
    <EmbeddedIframe
      url={iframeUrl}
      customerId={customerId as string}
      customerEmail={customerEmail as string}
      shopId={shop as string}
      feedogoWebhookUrl={feedogoWebhookUrl}
    />
  );
}

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
      
      const response = await fetch(`/api/settings?shop=${shop}`);
      const data: Settings = await response.json();
      setIframeUrl(data.embeddedIframeUrl);
      setFeedogoWebhookUrl(data.feedogoWebhookUrl || '');
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

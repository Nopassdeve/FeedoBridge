'use client';

import { useState } from 'react';
import { Card, Text, BlockStack, Button, InlineStack, TextField, Select, RangeSlider } from '@shopify/polaris';

interface EmbedPreviewProps {
  url: string;
  embedHeight: number;
  feedogoWebhookUrl?: string;
  onChange: (url: string, embedHeight: number) => void;
}

export default function EmbedPreview({ 
  url, 
  embedHeight, 
  feedogoWebhookUrl,
  onChange 
}: EmbedPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': return '100%';
    }
  };

  const deviceOptions = [
    { label: '桌面端', value: 'desktop' },
    { label: '平板', value: 'tablet' },
    { label: '移动端', value: 'mobile' },
  ];

  return (
    <Card>
      <div style={{ padding: '20px' }}>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text as="h3" variant="headingMd">嵌入预览</Text>
            <Button 
              onClick={() => setShowPreview(!showPreview)}
              variant={showPreview ? 'primary' : 'secondary'}
            >
              {showPreview ? '隐藏预览' : '显示预览'}
            </Button>
          </InlineStack>

          <InlineStack gap="400" align="start">
            <div style={{ width: '200px' }}>
              <Select
                label="预览设备"
                options={deviceOptions}
                value={previewMode}
                onChange={(val) => setPreviewMode(val as 'desktop' | 'tablet' | 'mobile')}
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <RangeSlider
                label={`高度: ${embedHeight}px`}
                value={embedHeight}
                min={300}
                max={1200}
                step={50}
                onChange={(val) => onChange(url, val as number)}
                output
              />
            </div>
          </InlineStack>

          {feedogoWebhookUrl && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#e3f1df', 
              borderRadius: '6px',
              border: '1px solid #a3d977'
            }}>
              <Text as="p" variant="bodySm" tone="subdued">
                ✅ 已配置 FeedoGo Webhook URL，支持邮箱自动登录
              </Text>
            </div>
          )}

          {showPreview && (
            <div 
              style={{ 
                border: '2px dashed #ddd', 
                borderRadius: '8px', 
                padding: '16px',
                backgroundColor: '#fafafa',
                overflow: 'hidden'
              }}
            >
              <div 
                style={{ 
                  width: getPreviewWidth(),
                  maxWidth: '100%',
                  margin: '0 auto',
                  transition: 'width 0.3s ease'
                }}
              >
                <div style={{ 
                  backgroundColor: '#e0e0e0', 
                  padding: '8px 12px', 
                  borderRadius: '8px 8px 0 0',
                  display: 'flex',
                  gap: '6px'
                }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f56' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#27ca3f' }} />
                  <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
                    {previewMode === 'desktop' ? '1920px' : previewMode === 'tablet' ? '768px' : '375px'}
                  </div>
                </div>
                
                <iframe
                  src={url || 'about:blank'}
                  style={{
                    width: '100%',
                    height: `${embedHeight}px`,
                    border: 'none',
                    borderRadius: '0 0 8px 8px',
                    backgroundColor: '#fff'
                  }}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  title="嵌入预览"
                />
              </div>
            </div>
          )}

          <div style={{ backgroundColor: '#f4f6f8', padding: '12px', borderRadius: '6px' }}>
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" tone="subdued">
                嵌入代码（Liquid）:
              </Text>
              <pre style={{ 
                backgroundColor: '#1a1a1a', 
                color: '#4ade80', 
                padding: '12px', 
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto'
              }}>
{`<div id="feedobridge-embed">
  <iframe
    src="${url || 'https://feedogocloud.com'}"
    style="width: 100%; height: ${embedHeight}px; border: none;"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
  ></iframe>
</div>`}
              </pre>
            </BlockStack>
          </div>
        </BlockStack>
      </div>
    </Card>
  );
}

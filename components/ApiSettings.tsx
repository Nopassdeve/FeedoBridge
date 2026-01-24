'use client';

import { useState } from 'react';
import { Card, Text, BlockStack, TextField, Button, InlineStack, Badge } from '@shopify/polaris';

interface ApiConfig {
  feedogoApiKey: string;
  feedogoWebhookUrl: string;
  feedogoSsoSecret: string;
}

interface ApiSettingsProps {
  config: ApiConfig;
  onChange: (config: ApiConfig) => void;
  onTest: () => Promise<{ success: boolean; message: string }>;
}

export default function ApiSettings({ config, onChange, onTest }: ApiSettingsProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSsoSecret, setShowSsoSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = (field: keyof ApiConfig, value: string) => {
    onChange({ ...config, [field]: value });
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: '连接测试失败' });
    } finally {
      setTesting(false);
    }
  };

  const maskValue = (value: string) => {
    if (!value) return '';
    if (value.length <= 8) return '••••••••';
    return value.slice(0, 4) + '••••••••' + value.slice(-4);
  };

  return (
    <Card>
      <div style={{ padding: '20px' }}>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text as="h3" variant="headingMd">FeedoGo API 配置</Text>
            <Badge tone="info">需要与 FeedoGo 团队获取</Badge>
          </InlineStack>

          {testResult && (
            <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: testResult.success ? '#dbedf5' : '#fed7d7', borderLeft: `4px solid ${testResult.success ? '#0082c3' : '#c81e1e'}` }}>
              <Text as="p" variant="bodySm" fontWeight="semibold">
                {testResult.success ? '✅ 连接成功' : '❌ 连接失败'}
              </Text>
              <Text as="p" variant="bodySm">
                {testResult.message}
              </Text>
            </div>
          )}

          <div>
            <InlineStack align="space-between">
              <Text as="span" variant="bodySm">API 密钥</Text>
              <Button
                variant="plain"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? '隐藏' : '显示'}
              </Button>
            </InlineStack>
            <div style={{ marginTop: '4px' }}>
              <TextField
                label=""
                labelHidden
                value={showApiKey ? config.feedogoApiKey : maskValue(config.feedogoApiKey)}
                onChange={(val) => handleChange('feedogoApiKey', val)}
                autoComplete="off"
                placeholder="输入 FeedoGo API Key"
                type={showApiKey ? 'text' : 'password'}
              />
            </div>
          </div>

          <TextField
            label="Webhook URL"
            value={config.feedogoWebhookUrl}
            onChange={(val) => handleChange('feedogoWebhookUrl', val)}
            autoComplete="off"
            placeholder="https://feedogocloud.com/api/v1/webhooks/shopify"
            helpText="FeedoGo 接收 Shopify 数据的 Webhook 地址"
          />

          <div>
            <InlineStack align="space-between">
              <Text as="span" variant="bodySm">SSO 密钥</Text>
              <Button
                variant="plain"
                onClick={() => setShowSsoSecret(!showSsoSecret)}
              >
                {showSsoSecret ? '隐藏' : '显示'}
              </Button>
            </InlineStack>
            <div style={{ marginTop: '4px' }}>
              <TextField
                label=""
                labelHidden
                value={showSsoSecret ? config.feedogoSsoSecret : maskValue(config.feedogoSsoSecret)}
                onChange={(val) => handleChange('feedogoSsoSecret', val)}
                autoComplete="off"
                placeholder="输入 SSO 签名密钥"
                type={showSsoSecret ? 'text' : 'password'}
                helpText="用于生成 SSO 登录签名"
              />
            </div>
          </div>

          <div style={{ paddingTop: '12px', borderTop: '1px solid #e1e3e5' }}>
            <InlineStack gap="300">
              <Button
                onClick={handleTest}
                loading={testing}
                disabled={!config.feedogoApiKey || !config.feedogoWebhookUrl}
              >
                测试连接
              </Button>
              <Text as="span" variant="bodySm" tone="subdued">
                测试 API 连接是否正常
              </Text>
            </InlineStack>
          </div>

          <div style={{ backgroundColor: '#f4f6f8', padding: '12px', borderRadius: '6px' }}>
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" fontWeight="semibold">配置说明：</Text>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#6d7175' }}>
                <li>API 密钥：用于向 FeedoGo 发送订单和用户数据</li>
                <li>Webhook URL：FeedoGo 接收推送数据的端点地址</li>
                <li>SSO 密钥：用于生成安全的单点登录签名</li>
              </ul>
            </BlockStack>
          </div>
        </BlockStack>
      </div>
    </Card>
  );
}

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
            <Badge tone="info">仅需填写基础URL</Badge>
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

          <TextField
            label="FeedoGo API Base URL"
            value={config.feedogoWebhookUrl}
            onChange={(val) => handleChange('feedogoWebhookUrl', val)}
            autoComplete="off"
            placeholder="https://shop.feedogocloud.com"
            helpText="FeedoGo API 的基础地址（用于调用 emailLogin 等接口，必填）"
          />

          <div>
            <InlineStack align="space-between">
              <Text as="span" variant="bodySm">API 密钥（可选）</Text>
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
                placeholder="留空即可（FeedoGo API不需要密钥）"
                type={showApiKey ? 'text' : 'password'}
              />
            </div>
          </div>

          <div>
            <InlineStack align="space-between">
              <Text as="span" variant="bodySm">SSO 密钥（可选）</Text>
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
                placeholder="留空即可（使用邮箱自动登录）"
                type={showSsoSecret ? 'text' : 'password'}
                helpText="仅在使用SSO降级方案时需要"
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
                <li><strong>API Base URL</strong>：FeedoGo API 的基础地址（如：https://shop.feedogocloud.com）</li>
                <li><strong>API 密钥</strong>：可选，FeedoGo API 不需要密钥验证</li>
                <li><strong>SSO 密钥</strong>：可选，仅在邮箱登录失败时使用 SSO 降级方案</li>
              </ul>
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #dfe3e8' }}>
                <Text as="p" variant="bodySm" tone="subdued">
                  💡 提示：嵌入网站的页面地址（如 feedogocloud.com）在"嵌入设置"标签配置
                </Text>
              </div>
            </BlockStack>
          </div>
        </BlockStack>
      </div>
    </Card>
  );
}

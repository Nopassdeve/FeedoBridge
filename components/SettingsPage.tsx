'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Page, 
  Card, 
  FormLayout, 
  TextField, 
  Checkbox, 
  Button, 
  Banner,
  Tabs,
  BlockStack,
  Text,
  InlineStack,
  Spinner
} from '@shopify/polaris';
import DashboardStats from './DashboardStats';
import EmbedPreview from './EmbedPreview';
import ThankYouModalSettings from './ThankYouModalSettings';
import ApiSettings from './ApiSettings';

interface ThankYouModalConfig {
  enabled: boolean;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  showDelay: number;
}

interface ApiConfig {
  feedogoApiKey: string;
  feedogoWebhookUrl: string;
  feedogoSsoSecret: string;
}

interface SettingsPageProps {
  shopId: string;
}

export default function SettingsPage({ shopId }: SettingsPageProps) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 基础设置
  const [url, setUrl] = useState('https://feedogocloud.com');
  const [embedHeight, setEmbedHeight] = useState(600);
  const [autoRegister, setAutoRegister] = useState(true);
  const [enableSso, setEnableSso] = useState(true);

  // 感谢页面弹窗配置
  const [thankYouModalConfig, setThankYouModalConfig] = useState<ThankYouModalConfig>({
    enabled: false,
    title: '',
    description: '',
    buttonText: '',
    buttonLink: '',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    buttonColor: '#000000',
    showDelay: 1000
  });

  // API 配置
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    feedogoApiKey: '',
    feedogoWebhookUrl: '',
    feedogoSsoSecret: ''
  });

  const tabs = [
    { id: 'dashboard', content: '仪表盘', accessibilityLabel: '仪表盘' },
    { id: 'embed', content: '嵌入设置', accessibilityLabel: '嵌入设置' },
    { id: 'thankyou', content: '感谢页面', accessibilityLabel: '感谢页面弹窗' },
    { id: 'api', content: 'API 配置', accessibilityLabel: 'API 配置' },
  ];

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch(`/api/settings?shop=${shopId}`);
        const data = await response.json();
        
        setUrl(data.embeddedIframeUrl || 'https://feedogocloud.com');
        setEmbedHeight(data.embedHeight || 600);
        setAutoRegister(data.enableAutoRegister ?? true);
        setEnableSso(data.enableSso ?? true);
        
        if (data.thankYouModalConfig) {
          setThankYouModalConfig({
            enabled: data.thankYouModalConfig.enabled ?? false,
            title: data.thankYouModalConfig.title || '',
            description: data.thankYouModalConfig.description || '',
            buttonText: data.thankYouModalConfig.buttonText || '',
            buttonLink: data.thankYouModalConfig.buttonLink || '',
            backgroundColor: data.thankYouModalConfig.backgroundColor || '#ffffff',
            textColor: data.thankYouModalConfig.textColor || '#000000',
            buttonColor: data.thankYouModalConfig.buttonColor || '#000000',
            showDelay: data.thankYouModalConfig.showDelay || 1000
          });
        }

        if (data.feedogoApiKey || data.feedogoWebhookUrl || data.feedogoSsoSecret) {
          setApiConfig({
            feedogoApiKey: data.feedogoApiKey || '',
            feedogoWebhookUrl: data.feedogoWebhookUrl || '',
            feedogoSsoSecret: data.feedogoSsoSecret || ''
          });
        }
      } catch (err) {
        setError('加载设置失败');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [shopId]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      await fetch(`/api/settings?shop=${shopId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeddedIframeUrl: url,
          embedHeight,
          enableAutoRegister: autoRegister,
          enableSso,
          thankYouModalConfig,
          feedogoApiKey: apiConfig.feedogoApiKey,
          feedogoWebhookUrl: apiConfig.feedogoWebhookUrl,
          feedogoSsoSecret: apiConfig.feedogoSsoSecret
        })
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('保存设置失败');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`/api/test-connection?shop=${shopId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiConfig.feedogoApiKey,
          webhookUrl: apiConfig.feedogoWebhookUrl
        })
      });
      const data = await response.json();
      return { success: data.success, message: data.message };
    } catch {
      return { success: false, message: '连接测试请求失败' };
    }
  };

  const handleTabChange = useCallback((selectedTabIndex: number) => {
    setSelectedTab(selectedTabIndex);
  }, []);

  if (loading) {
    return (
      <Page title="FeedoBridge 设置">
        <Card>
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Spinner size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text as="p" tone="subdued">加载中...</Text>
            </div>
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <Page 
      title="FeedoBridge 设置"
      subtitle="管理您的 FeedoGo 集成设置"
      primaryAction={{
        content: '保存设置',
        onAction: handleSave,
        loading: saving
      }}
    >
      <BlockStack gap="400">
        {saved && (
          <Banner tone="success" onDismiss={() => setSaved(false)}>
            设置已成功保存
          </Banner>
        )}

        {error && (
          <Banner tone="critical" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        )}

        <Card padding="0">
          <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
            <div style={{ padding: '20px' }}>
              {/* 仪表盘 */}
              {selectedTab === 0 && (
                <DashboardStats shopId={shopId} />
              )}

              {/* 嵌入设置 */}
              {selectedTab === 1 && (
                <BlockStack gap="400">
                  <Card>
                    <div style={{ padding: '20px' }}>
                      <BlockStack gap="400">
                        <Text as="h3" variant="headingMd">基础设置</Text>
                        
                        <TextField
                          label="嵌入网站 URL"
                          value={url}
                          onChange={setUrl}
                          autoComplete="off"
                          helpText="将要嵌入的网站地址（例如：https://feedogocloud.com）"
                        />

                        <InlineStack gap="400">
                          <Checkbox
                            label="启用自动账户注册"
                            checked={autoRegister}
                            onChange={setAutoRegister}
                            helpText="订单完成后自动在 FeedoGo 创建用户账户"
                          />

                          <Checkbox
                            label="启用单点登录 (SSO)"
                            checked={enableSso}
                            onChange={setEnableSso}
                            helpText="允许 Shopify 客户自动登录 FeedoGo"
                          />
                        </InlineStack>
                      </BlockStack>
                    </div>
                  </Card>

                  <EmbedPreview 
                    url={url} 
                    height={embedHeight}
                    onHeightChange={setEmbedHeight}
                  />
                </BlockStack>
              )}

              {/* 感谢页面弹窗 */}
              {selectedTab === 2 && (
                <ThankYouModalSettings
                  config={thankYouModalConfig}
                  onChange={setThankYouModalConfig}
                />
              )}

              {/* API 配置 */}
              {selectedTab === 3 && (
                <ApiSettings
                  config={apiConfig}
                  onChange={setApiConfig}
                  onTest={handleTestConnection}
                />
              )}
            </div>
          </Tabs>
        </Card>
      </BlockStack>
    </Page>
  );
}

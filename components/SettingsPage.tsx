// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Page, 
  Card, 
  FormLayout, 
  TextField, 
  Checkbox, 
  Button, 
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
  couponCode: string;
  buttonText: string;
  buttonLink: string;
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
  const [url, setUrl] = useState('https://shopifyapp.xmasforest.com');
  const [embedHeight, setEmbedHeight] = useState(600);
  const [autoRegister, setAutoRegister] = useState(true);
  const [enableSso, setEnableSso] = useState(true);

  // 感谢页面弹窗配置
  const [thankYouModalConfig, setThankYouModalConfig] = useState<ThankYouModalConfig>({
    enabled: false,
    title: '',
    description: '',
    couponCode: '',
    buttonText: '',
    buttonLink: ''
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
        
        console.log('Loaded settings:', data);
        
        setUrl(data.embeddedIframeUrl || 'https://feedogocloud.com/');
        setEmbedHeight(data.embedHeight || 600);
        setAutoRegister(data.enableAutoRegister ?? true);
        setEnableSso(data.enableSso ?? true);

        if (data.thankYouModalConfig) {
          setThankYouModalConfig({
            enabled: data.thankYouModalConfig.enabled ?? false,
            title: data.thankYouModalConfig.title || '',
            description: data.thankYouModalConfig.description || '',
            couponCode: data.thankYouModalConfig.couponCode || '',
            buttonText: data.thankYouModalConfig.buttonText || '',
            buttonLink: data.thankYouModalConfig.buttonLink || ''
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
        console.error('Failed to load settings:', err);
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

    const saveData = {
      embeddedIframeUrl: url,
      embedHeight,
      enableAutoRegister: autoRegister,
      enableSso,
      thankYouModalConfig,
      feedogoApiKey: apiConfig.feedogoApiKey,
      feedogoWebhookUrl: apiConfig.feedogoWebhookUrl,
      feedogoSsoSecret: apiConfig.feedogoSsoSecret
    };

    console.log('Saving data:', saveData);

    try {
      const response = await fetch(`/api/settings?shop=${shopId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      });

      const result = await response.json();
      console.log('Save result:', result);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
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
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#e3f1df', 
            borderRadius: '6px',
            border: '1px solid #a3d977',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text as="p" variant="bodySm">✅ 设置已成功保存</Text>
            <button onClick={() => setSaved(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {error && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#fde1e1', 
            borderRadius: '6px',
            border: '1px solid #ff8080',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text as="p" variant="bodySm">{error}</Text>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
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

                        <TextField
                          label="嵌入高度 (像素)"
                          value={embedHeight.toString()}
                          onChange={(val) => setEmbedHeight(parseInt(val) || 600)}
                          type="number"
                          min="300"
                          max="2000"
                          autoComplete="off"
                        />

                        <Checkbox
                          label="启用自动注册"
                          checked={autoRegister}
                          onChange={setAutoRegister}
                          helpText="订单生成时自动在 FeedoGo 注册客户账户"
                        />

                        <Checkbox
                          label="启用邮箱登录（推荐）"
                          checked={enableSso}
                          onChange={setEnableSso}
                          helpText="用户可直接通过邮箱在 FeedoGo 平台自动登录"
                        />
                      </BlockStack>
                    </div>
                  </Card>

                  {/* 预览 */}
                  <EmbedPreview 
                    url={url} 
                    embedHeight={embedHeight}
                    feedogoWebhookUrl={apiConfig.feedogoWebhookUrl}
                    onChange={(newUrl, newHeight) => {
                      setUrl(newUrl);
                      setEmbedHeight(newHeight);
                    }}
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

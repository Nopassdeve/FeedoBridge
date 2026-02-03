'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  Page, 
  Card, 
  TextField, 
  Button, 
  BlockStack,
  Text,
  InlineStack
} from '@shopify/polaris';

export default function TestCustomerSync() {
  const router = useRouter();
  const { shop } = router.query;
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    if (!email || !shop) {
      setError('请输入邮箱地址');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/sync-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop,
          customerEmail: email
        })
      });

      const data = await response.json();
      setResult(data);

      if (!data.success) {
        setError(data.message || data.error || '同步失败');
      }
    } catch (err: any) {
      setError(err.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page
      title="测试客户同步到 FeedoGo"
      subtitle="手动测试客户注册和同步功能"
      backAction={{ content: '返回', url: `/?shop=${shop}` }}
    >
      <BlockStack gap="400">
        {error && (
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd" tone="critical">
                ❌ 错误
              </Text>
              <Text as="p">{error}</Text>
            </BlockStack>
          </Card>
        )}

        {result && result.success && (
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd" tone="success">
                ✅ 成功
              </Text>
              <Text as="p">{result.message}</Text>
              {result.email && <Text as="p">邮箱: {result.email}</Text>}
              {result.userId && <Text as="p">FeedoGo User ID: {result.userId}</Text>}
              {result.action && <Text as="p">操作: {result.action}</Text>}
            </BlockStack>
          </Card>
        )}

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              同步客户到 FeedoGo
            </Text>

            <BlockStack gap="400">
              <TextField
                label="客户邮箱"
                value={email}
                onChange={setEmail}
                placeholder="customer@example.com"
                autoComplete="email"
                helpText="输入要同步到 FeedoGo 的客户邮箱"
              />

              <InlineStack align="start">
                <Button
                  variant="primary"
                  onClick={handleSync}
                  loading={loading}
                  disabled={!email}
                >
                  {loading ? '同步中...' : '开始同步'}
                </Button>
              </InlineStack>
            </BlockStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              功能说明
            </Text>

            <BlockStack gap="200">
              <Text as="p">
                <strong>自动同步流程：</strong>
              </Text>
              <Text as="p">
                1. 当用户在 Shopify 网站注册时，会触发 customers/create webhook
              </Text>
              <Text as="p">
                2. 系统自动检查用户是否已在 FeedoGo 注册
              </Text>
              <Text as="p">
                3. 如果未注册，自动调用 FeedoGo 注册 API 创建账户
              </Text>
              <Text as="p">
                4. 用户访问嵌入页面时，使用邮箱自动登录
              </Text>
            </BlockStack>

            <BlockStack gap="200">
              <Text as="p">
                <strong>手动同步：</strong>
              </Text>
              <Text as="p">
                使用此页面可以手动同步单个客户到 FeedoGo
              </Text>
            </BlockStack>
          </BlockStack>
        </Card>

        {result && (
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                响应数据
              </Text>
              <pre style={{
                background: '#f4f4f4',
                padding: '12px',
                borderRadius: '4px',
                overflow: 'auto'
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}

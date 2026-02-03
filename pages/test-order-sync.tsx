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

export default function TestOrderSync() {
  const router = useRouter();
  const { shop } = router.query;
  
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    if (!email || !amount || !shop) {
      setError('请输入邮箱和金额');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('请输入有效的金额');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // 调用测试API
      const response = await fetch('/api/test-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop,
          email,
          money: amountNum
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
      title="测试订单金额同步"
      subtitle="手动测试订单金额同步到 FeedoGo（兑换爱心币）"
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
              {result.amount && <Text as="p">金额: {result.amount}</Text>}
              {result.userExists !== undefined && (
                <Text as="p">
                  用户状态: {result.userExists ? '已在FeedoGo注册' : '未在FeedoGo注册'}
                </Text>
              )}
            </BlockStack>
          </Card>
        )}

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              同步订单金额到 FeedoGo
            </Text>

            <BlockStack gap="400">
              <TextField
                label="客户邮箱"
                value={email}
                onChange={setEmail}
                placeholder="customer@example.com"
                autoComplete="email"
                helpText="输入客户邮箱地址"
              />

              <TextField
                label="订单金额"
                value={amount}
                onChange={setAmount}
                placeholder="99.99"
                type="number"
                autoComplete="off"
                helpText="输入订单金额（将兑换为爱心币）"
              />

              <InlineStack align="start">
                <Button
                  variant="primary"
                  onClick={handleSync}
                  loading={loading}
                  disabled={!email || !amount}
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
                1. 用户在 Shopify 网站下单
              </Text>
              <Text as="p">
                2. 触发 orders/create webhook
              </Text>
              <Text as="p">
                3. 系统提取订单邮箱和金额
              </Text>
              <Text as="p">
                4. 调用 FeedoGo exchangeLoveCoin API
              </Text>
              <Text as="p">
                5. 订单金额转换为爱心币
              </Text>
            </BlockStack>

            <BlockStack gap="200">
              <Text as="p">
                <strong>API 接口：</strong>
              </Text>
              <Text as="p">
                POST /api/user/exchangeLoveCoin
              </Text>
              <Text as="p">
                参数: email（邮箱）, money（金额）
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
                overflow: 'auto',
                fontSize: '12px'
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

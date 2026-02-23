'use client';

// @ts-nocheck
import { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  Page, 
  Card, 
  TextField, 
  Button, 
  BlockStack,
  Text,
  InlineStack,
  Badge,
  Divider
} from '@shopify/polaris';

export default function TestAPIs() {
  const router = useRouter();
  const { shop } = router.query;
  
  // 测试1：邮箱登录API
  const [email1, setEmail1] = useState('');
  const [loading1, setLoading1] = useState(false);
  const [result1, setResult1] = useState<any>(null);

  // 测试2：订单金额兑换API
  const [email2, setEmail2] = useState('');
  const [amount, setAmount] = useState('');
  const [loading2, setLoading2] = useState(false);
  const [result2, setResult2] = useState<any>(null);

  // 综合测试
  const [testEmail, setTestEmail] = useState('');
  const [testAmount, setTestAmount] = useState('');
  const [loadingAll, setLoadingAll] = useState(false);
  const [allResults, setAllResults] = useState<any[]>([]);

  // 测试邮箱登录API
  const testEmailLogin = async () => {
    if (!email1 || !shop) {
      alert('请输入邮箱');
      return;
    }

    setLoading1(true);
    setResult1(null);

    try {
      const response = await fetch('/api/sync-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop, customerEmail: email1 })
      });

      const data = await response.json();
      setResult1(data);
    } catch (err: any) {
      setResult1({ success: false, error: err.message });
    } finally {
      setLoading1(false);
    }
  };

  // 测试订单金额兑换API
  const testExchange = async () => {
    if (!email2 || !amount || !shop) {
      alert('请输入邮箱和金额');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('请输入有效金额');
      return;
    }

    setLoading2(true);
    setResult2(null);

    try {
      const response = await fetch('/api/test-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop, email: email2, money: amountNum })
      });

      const data = await response.json();
      setResult2(data);
    } catch (err: any) {
      setResult2({ success: false, error: err.message });
    } finally {
      setLoading2(false);
    }
  };

  // 综合测试：模拟完整流程
  const testFullFlow = async () => {
    if (!testEmail || !testAmount || !shop) {
      alert('请输入邮箱和订单金额');
      return;
    }

    const amountNum = parseFloat(testAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('请输入有效金额');
      return;
    }

    setLoadingAll(true);
    setAllResults([]);

    const results: any[] = [];

    try {
      // 步骤1：测试邮箱登录（检查/注册用户）
      results.push({ step: 1, name: '邮箱登录API', status: 'testing' });
      setAllResults([...results]);

      const loginResponse = await fetch('/api/sync-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop, customerEmail: testEmail })
      });

      const loginData = await loginResponse.json();
      results[0] = {
        step: 1,
        name: '邮箱登录API (emailLogin)',
        status: loginData.success ? 'success' : 'failed',
        data: loginData,
        url: 'POST /api/user/emailLogin',
        description: loginData.success 
          ? `✅ 用户${loginData.action === 'registered' ? '注册' : '登录'}成功` 
          : `❌ ${loginData.message || loginData.error}`
      };
      setAllResults([...results]);

      // 等待1秒
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 步骤2：测试订单金额兑换
      results.push({ step: 2, name: '订单金额兑换API', status: 'testing' });
      setAllResults([...results]);

      const exchangeResponse = await fetch('/api/test-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop, email: testEmail, money: amountNum })
      });

      const exchangeData = await exchangeResponse.json();
      results[1] = {
        step: 2,
        name: '订单金额兑换API (exchangeLoveCoin)',
        status: exchangeData.success ? 'success' : 'failed',
        data: exchangeData,
        url: 'POST /api/user/exchangeLoveCoin',
        description: exchangeData.success 
          ? `✅ 成功兑换 ${amountNum} 元为爱心币` 
          : `❌ ${exchangeData.message || exchangeData.error}`
      };
      setAllResults([...results]);

    } catch (err: any) {
      results.push({
        step: results.length + 1,
        name: '系统错误',
        status: 'failed',
        description: `❌ ${err.message}`
      });
      setAllResults([...results]);
    } finally {
      setLoadingAll(false);
    }
  };

  return (
    <Page
      title="FeedoGo API 综合测试"
      subtitle="测试邮箱登录和订单金额同步功能"
      backAction={{ content: '返回', url: `/?shop=${shop}` }}
    >
      <BlockStack gap="500">
        {/* 综合测试 */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text as="h2" variant="headingLg">
                🚀 综合测试（推荐）
              </Text>
              <Badge tone="info">模拟完整流程</Badge>
            </InlineStack>

            <Text as="p" tone="subdued">
              模拟用户注册并下单的完整流程，依次测试两个API
            </Text>

            <Divider />

            <TextField
              label="测试邮箱"
              value={testEmail}
              onChange={setTestEmail}
              placeholder="test@example.com"
              autoComplete="email"
              helpText="输入一个测试邮箱地址"
            />

            <TextField
              label="测试订单金额"
              value={testAmount}
              onChange={setTestAmount}
              placeholder="99.99"
              type="number"
              autoComplete="off"
              helpText="输入订单金额（将兑换为爱心币）"
            />

            <InlineStack align="start">
              <Button
                variant="primary"
                onClick={testFullFlow}
                loading={loadingAll}
                disabled={!testEmail || !testAmount}
                size="large"
              >
                {loadingAll ? '测试中...' : '开始完整测试'}
              </Button>
            </InlineStack>

            {allResults.length > 0 && (
              <BlockStack gap="300">
                <Divider />
                <Text as="h3" variant="headingMd">测试结果</Text>
                {allResults.map((result, index) => (
                  <Card key={index}>
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text as="p" fontWeight="semibold">
                          步骤 {result.step}: {result.name}
                        </Text>
                        {result.status === 'testing' && <Badge>测试中...</Badge>}
                        {result.status === 'success' && <Badge tone="success">成功</Badge>}
                        {result.status === 'failed' && <Badge tone="critical">失败</Badge>}
                      </InlineStack>
                      
                      {result.url && (
                        <Text as="p" tone="subdued" variant="bodySm">
                          {result.url}
                        </Text>
                      )}
                      
                      {result.description && (
                        <Text as="p">{result.description}</Text>
                      )}

                      {result.data && result.data.feedogoResponse && (
                        <div style={{ 
                          backgroundColor: '#f6f6f7', 
                          padding: '12px', 
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontFamily: 'monospace'
                        }}>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(result.data.feedogoResponse, null, 2)}
                          </pre>
                        </div>
                      )}
                    </BlockStack>
                  </Card>
                ))}
              </BlockStack>
            )}
          </BlockStack>
        </Card>

        {/* 单独测试1：邮箱登录 */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              📧 测试1：邮箱登录API
            </Text>

            <Text as="p" tone="subdued">
              测试 <code>/api/user/emailLogin</code> - 用户登录（自动注册新用户）
            </Text>

            <TextField
              label="邮箱"
              value={email1}
              onChange={setEmail1}
              placeholder="test@example.com"
              autoComplete="email"
            />

            <InlineStack align="start">
              <Button
                onClick={testEmailLogin}
                loading={loading1}
                disabled={!email1}
              >
                测试邮箱登录
              </Button>
            </InlineStack>

            {result1 && (
              <Card background={result1.success ? "bg-fill-success-secondary" : "bg-fill-critical-secondary"}>
                <BlockStack gap="200">
                  <Text as="p" fontWeight="semibold">
                    {result1.success ? '✅ 成功' : '❌ 失败'}
                  </Text>
                  <Text as="p">{result1.message || result1.error}</Text>
                  {result1.email && <Text as="p">邮箱: {result1.email}</Text>}
                  {result1.userId && <Text as="p">User ID: {result1.userId}</Text>}
                  {result1.action && <Text as="p">操作: {result1.action}</Text>}
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Card>

        {/* 单独测试2：订单金额兑换 */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              💰 测试2：订单金额兑换API
            </Text>

            <Text as="p" tone="subdued">
              测试 <code>/api/user/exchangeLoveCoin</code> - 订单金额兑换爱心币
            </Text>

            <TextField
              label="邮箱"
              value={email2}
              onChange={setEmail2}
              placeholder="test@example.com"
              autoComplete="email"
            />

            <TextField
              label="订单金额"
              value={amount}
              onChange={setAmount}
              placeholder="99.99"
              type="number"
              autoComplete="off"
            />

            <InlineStack align="start">
              <Button
                onClick={testExchange}
                loading={loading2}
                disabled={!email2 || !amount}
              >
                测试金额兑换
              </Button>
            </InlineStack>

            {result2 && (
              <Card background={result2.success ? "bg-fill-success-secondary" : "bg-fill-critical-secondary"}>
                <BlockStack gap="200">
                  <Text as="p" fontWeight="semibold">
                    {result2.success ? '✅ 成功' : '❌ 失败'}
                  </Text>
                  <Text as="p">{result2.message || result2.error}</Text>
                  {result2.email && <Text as="p">邮箱: {result2.email}</Text>}
                  {result2.amount && <Text as="p">金额: {result2.amount}</Text>}
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Card>

        {/* 说明文档 */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              📖 测试说明
            </Text>

            <BlockStack gap="300">
              <div>
                <Text as="p" fontWeight="semibold">API 1: 邮箱登录 (emailLogin)</Text>
                <Text as="p" tone="subdued">
                  • URL: https://shop.feedogocloud.com/api/user/emailLogin<br/>
                  • 功能: 用户邮箱登录，如果不存在会自动注册<br/>
                  • 返回: 包含token、userId等11个字段的用户信息
                </Text>
              </div>

              <div>
                <Text as="p" fontWeight="semibold">API 2: 订单金额兑换 (exchangeLoveCoin)</Text>
                <Text as="p" tone="subdued">
                  • URL: https://shop.feedogocloud.com/api/user/exchangeLoveCoin<br/>
                  • 功能: 将订单金额兑换为FeedoGo爱心币<br/>
                  • 参数: email（邮箱）、money（金额）
                </Text>
              </div>

              <div>
                <Text as="p" fontWeight="semibold">完整流程测试</Text>
                <Text as="p" tone="subdued">
                  1. 调用邮箱登录API，检查/注册用户<br/>
                  2. 调用订单金额兑换API，为用户增加爱心币<br/>
                  3. 模拟用户从注册到下单的完整过程
                </Text>
              </div>
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}

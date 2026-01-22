'use client';

import { useState, useEffect } from 'react';
import { Card, Text, InlineStack, BlockStack, ProgressBar, Badge, Spinner } from '@shopify/polaris';

interface Stats {
  totalOrders: number;
  syncedOrders: number;
  pendingOrders: number;
  failedOrders: number;
  totalUsers: number;
  syncedUsers: number;
  lastSyncAt: string | null;
}

interface DashboardStatsProps {
  shopId: string;
}

export default function DashboardStats({ shopId }: DashboardStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`/api/stats?shop=${shopId}`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [shopId]);

  if (loading) {
    return (
      <Card>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Spinner size="large" />
        </div>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <div style={{ padding: '20px' }}>
          <Text as="p" tone="subdued">暂无统计数据</Text>
        </div>
      </Card>
    );
  }

  const orderSyncRate = stats.totalOrders > 0 
    ? Math.round((stats.syncedOrders / stats.totalOrders) * 100) 
    : 0;

  const userSyncRate = stats.totalUsers > 0 
    ? Math.round((stats.syncedUsers / stats.totalUsers) * 100) 
    : 0;

  return (
    <BlockStack gap="400">
      {/* 订单同步统计 */}
      <Card>
        <div style={{ padding: '20px' }}>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">订单同步状态</Text>
            
            <InlineStack gap="400" wrap={false}>
              <div style={{ flex: 1, padding: '16px', backgroundColor: '#f6f6f7', borderRadius: '8px' }}>
                <BlockStack gap="200">
                  <Text as="p" tone="subdued">总订单</Text>
                  <Text as="p" variant="headingLg">{stats.totalOrders}</Text>
                </BlockStack>
              </div>
              
              <div style={{ flex: 1, padding: '16px', backgroundColor: '#e3f1df', borderRadius: '8px' }}>
                <BlockStack gap="200">
                  <Text as="p" tone="subdued">已同步</Text>
                  <Text as="p" variant="headingLg">{stats.syncedOrders}</Text>
                </BlockStack>
              </div>
              
              <div style={{ flex: 1, padding: '16px', backgroundColor: '#fff5ba', borderRadius: '8px' }}>
                <BlockStack gap="200">
                  <Text as="p" tone="subdued">待处理</Text>
                  <Text as="p" variant="headingLg">{stats.pendingOrders}</Text>
                </BlockStack>
              </div>
              
              <div style={{ flex: 1, padding: '16px', backgroundColor: '#ffd2d2', borderRadius: '8px' }}>
                <BlockStack gap="200">
                  <Text as="p" tone="subdued">失败</Text>
                  <Text as="p" variant="headingLg">{stats.failedOrders}</Text>
                </BlockStack>
              </div>
            </InlineStack>

            <div>
              <InlineStack align="space-between">
                <Text as="p" tone="subdued">同步进度</Text>
                <Text as="p">{orderSyncRate}%</Text>
              </InlineStack>
              <div style={{ marginTop: '8px' }}>
                <ProgressBar progress={orderSyncRate} size="small" tone="primary" />
              </div>
            </div>
          </BlockStack>
        </div>
      </Card>

      {/* 用户映射统计 */}
      <Card>
        <div style={{ padding: '20px' }}>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">用户映射状态</Text>
            
            <InlineStack gap="400" wrap={false}>
              <div style={{ flex: 1, padding: '16px', backgroundColor: '#f6f6f7', borderRadius: '8px' }}>
                <BlockStack gap="200">
                  <Text as="p" tone="subdued">总用户</Text>
                  <Text as="p" variant="headingLg">{stats.totalUsers}</Text>
                </BlockStack>
              </div>
              
              <div style={{ flex: 1, padding: '16px', backgroundColor: '#e3f1df', borderRadius: '8px' }}>
                <BlockStack gap="200">
                  <Text as="p" tone="subdued">已同步</Text>
                  <Text as="p" variant="headingLg">{stats.syncedUsers}</Text>
                </BlockStack>
              </div>
            </InlineStack>

            <div>
              <InlineStack align="space-between">
                <Text as="p" tone="subdued">用户同步率</Text>
                <Text as="p">{userSyncRate}%</Text>
              </InlineStack>
              <div style={{ marginTop: '8px' }}>
                <ProgressBar progress={userSyncRate} size="small" tone="success" />
              </div>
            </div>
          </BlockStack>
        </div>
      </Card>

      {/* 最后同步时间 */}
      <Card>
        <div style={{ padding: '20px' }}>
          <InlineStack align="space-between">
            <BlockStack gap="100">
              <Text as="p" tone="subdued">最后同步时间</Text>
              <Text as="p" variant="bodyMd">
                {stats.lastSyncAt 
                  ? new Date(stats.lastSyncAt).toLocaleString('zh-CN')
                  : '暂无同步记录'
                }
              </Text>
            </BlockStack>
            <Badge tone={stats.failedOrders > 0 ? 'warning' : 'success'}>
              {stats.failedOrders > 0 ? '有失败任务' : '正常运行'}
            </Badge>
          </InlineStack>
        </div>
      </Card>
    </BlockStack>
  );
}

'use client';

import { Card, Text, BlockStack, TextField, Checkbox, Button } from '@shopify/polaris';
import { useState, useCallback } from 'react';

interface ThankYouModalConfig {
  enabled: boolean;
  title: string;
  description: string;
  couponCode: string;
  buttonText: string;
  buttonLink: string;
}

interface ThankYouModalSettingsProps {
  config: ThankYouModalConfig;
  onChange: (config: ThankYouModalConfig) => void;
}

export default function ThankYouModalSettings({ config, onChange }: ThankYouModalSettingsProps) {
  const handleChange = (field: keyof ThankYouModalConfig, value: string | boolean) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">感谢页面弹窗设置</Text>
          
          <Checkbox
            label="启用弹窗"
            checked={config.enabled}
            onChange={(value) => handleChange('enabled', value)}
          />

          <TextField
            label="弹窗标题"
            value={config.title}
            onChange={(value) => handleChange('title', value)}
            placeholder="恭喜！您的订单已确认"
            autoComplete="off"
          />

          <TextField
            label="弹窗描述"
            value={config.description}
            onChange={(value) => handleChange('description', value)}
            placeholder="感谢您的购买！作为尊贵的客户，我们为您准备了一份专属礼品。"
            multiline={3}
            autoComplete="off"
          />

          <TextField
            label="优惠码"
            value={config.couponCode}
            onChange={(value) => handleChange('couponCode', value)}
            placeholder="WELCOME2026"
            autoComplete="off"
          />

          <TextField
            label="按钮文字"
            value={config.buttonText}
            onChange={(value) => handleChange('buttonText', value)}
            placeholder="继续购物"
            autoComplete="off"
          />

          <TextField
            label="按钮链接"
            value={config.buttonLink}
            onChange={(value) => handleChange('buttonLink', value)}
            placeholder="https://yourstore.myshopify.com"
            autoComplete="off"
          />
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">预览效果</Text>
          <div style={{
            border: '1px solid #e1e3e5',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <Text as="h2" variant="headingLg">
                {config.title || '🎁 恭喜！您的订单已确认'}
              </Text>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text as="p">
                {config.description || '感谢您的购买！作为尊贵的客户，我们为您准备了一份专属礼品。'}
              </Text>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text as="p" variant="bodyLg" fontWeight="bold">
                专属优惠码：{config.couponCode || 'WELCOME2026'}
              </Text>
            </div>
            <Button>{config.buttonText || '继续购物'}</Button>
          </div>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}

'use client';

import { Card, Text, BlockStack, TextField, Checkbox, InlineStack, ColorPicker, Popover, Button, RangeSlider } from '@shopify/polaris';
import { useState, useCallback } from 'react';

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

interface ThankYouModalSettingsProps {
  config: ThankYouModalConfig;
  onChange: (config: ThankYouModalConfig) => void;
}

export default function ThankYouModalSettings({ config, onChange }: ThankYouModalSettingsProps) {
  const [bgColorPopoverActive, setBgColorPopoverActive] = useState(false);
  const [textColorPopoverActive, setTextColorPopoverActive] = useState(false);
  const [buttonColorPopoverActive, setButtonColorPopoverActive] = useState(false);

  const handleChange = (field: keyof ThankYouModalConfig, value: unknown) => {
    onChange({ ...config, [field]: value });
  };

  const hexToHsb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    
    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return { hue: h * 360, saturation: s, brightness: v };
  };

  const hsbToHex = (h: number, s: number, b: number) => {
    const hi = Math.floor(h / 60) % 6;
    const f = h / 60 - Math.floor(h / 60);
    const p = b * (1 - s);
    const q = b * (1 - f * s);
    const t = b * (1 - (1 - f) * s);
    
    let r = 0, g = 0, bl = 0;
    switch (hi) {
      case 0: r = b; g = t; bl = p; break;
      case 1: r = q; g = b; bl = p; break;
      case 2: r = p; g = b; bl = t; break;
      case 3: r = p; g = q; bl = b; break;
      case 4: r = t; g = p; bl = b; break;
      case 5: r = b; g = p; bl = q; break;
    }
    
    const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
  };

  return (
    <Card>
      <div style={{ padding: '20px' }}>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text as="h3" variant="headingMd">感谢页面弹窗设置</Text>
            <Checkbox
              label="启用弹窗"
              checked={config.enabled}
              onChange={(val) => handleChange('enabled', val)}
            />
          </InlineStack>

          {config.enabled && (
            <>
              <TextField
                label="弹窗标题"
                value={config.title}
                onChange={(val) => handleChange('title', val)}
                autoComplete="off"
                placeholder="感谢您的购买！"
              />

              <TextField
                label="弹窗描述"
                value={config.description}
                onChange={(val) => handleChange('description', val)}
                multiline={3}
                autoComplete="off"
                placeholder="我们已为您创建了 FeedoGo 账户，快来探索更多功能吧！"
              />

              <InlineStack gap="400">
                <div style={{ flex: 1 }}>
                  <TextField
                    label="按钮文字"
                    value={config.buttonText}
                    onChange={(val) => handleChange('buttonText', val)}
                    autoComplete="off"
                    placeholder="立即探索"
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <TextField
                    label="按钮链接"
                    value={config.buttonLink}
                    onChange={(val) => handleChange('buttonLink', val)}
                    autoComplete="off"
                    placeholder="https://feedogocloud.com/dashboard"
                  />
                </div>
              </InlineStack>

              <div>
                <RangeSlider
                  label={`显示延迟: ${config.showDelay}ms`}
                  value={config.showDelay}
                  min={0}
                  max={5000}
                  step={100}
                  onChange={(val) => handleChange('showDelay', val)}
                  output
                />
              </div>

              <InlineStack gap="400">
                <div>
                  <Text as="p" variant="bodySm">背景颜色</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Popover
                      active={bgColorPopoverActive}
                      activator={
                        <Button onClick={() => setBgColorPopoverActive(!bgColorPopoverActive)}>
                          <div style={{ 
                            width: 20, 
                            height: 20, 
                            backgroundColor: config.backgroundColor,
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                          }} />
                        </Button>
                      }
                      onClose={() => setBgColorPopoverActive(false)}
                    >
                      <div style={{ padding: '16px' }}>
                        <ColorPicker
                          color={hexToHsb(config.backgroundColor || '#ffffff')}
                          onChange={(color) => handleChange('backgroundColor', hsbToHex(color.hue, color.saturation, color.brightness))}
                        />
                      </div>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Text as="p" variant="bodySm">文字颜色</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Popover
                      active={textColorPopoverActive}
                      activator={
                        <Button onClick={() => setTextColorPopoverActive(!textColorPopoverActive)}>
                          <div style={{ 
                            width: 20, 
                            height: 20, 
                            backgroundColor: config.textColor,
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                          }} />
                        </Button>
                      }
                      onClose={() => setTextColorPopoverActive(false)}
                    >
                      <div style={{ padding: '16px' }}>
                        <ColorPicker
                          color={hexToHsb(config.textColor || '#000000')}
                          onChange={(color) => handleChange('textColor', hsbToHex(color.hue, color.saturation, color.brightness))}
                        />
                      </div>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Text as="p" variant="bodySm">按钮颜色</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Popover
                      active={buttonColorPopoverActive}
                      activator={
                        <Button onClick={() => setButtonColorPopoverActive(!buttonColorPopoverActive)}>
                          <div style={{ 
                            width: 20, 
                            height: 20, 
                            backgroundColor: config.buttonColor,
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                          }} />
                        </Button>
                      }
                      onClose={() => setButtonColorPopoverActive(false)}
                    >
                      <div style={{ padding: '16px' }}>
                        <ColorPicker
                          color={hexToHsb(config.buttonColor || '#000000')}
                          onChange={(color) => handleChange('buttonColor', hsbToHex(color.hue, color.saturation, color.brightness))}
                        />
                      </div>
                    </Popover>
                  </div>
                </div>
              </InlineStack>

              {/* 预览 */}
              <div style={{ marginTop: '16px' }}>
                <Text as="p" variant="bodySm" tone="subdued">弹窗预览：</Text>
                <div style={{ 
                  marginTop: '12px',
                  padding: '24px',
                  backgroundColor: config.backgroundColor || '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  maxWidth: '400px'
                }}>
                  <h4 style={{ 
                    margin: 0, 
                    color: config.textColor || '#000000',
                    fontSize: '18px',
                    fontWeight: 600
                  }}>
                    {config.title || '弹窗标题'}
                  </h4>
                  <p style={{ 
                    margin: '12px 0 16px', 
                    color: config.textColor || '#000000',
                    opacity: 0.8,
                    fontSize: '14px'
                  }}>
                    {config.description || '弹窗描述内容'}
                  </p>
                  <button style={{
                    padding: '10px 24px',
                    backgroundColor: config.buttonColor || '#000000',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}>
                    {config.buttonText || '按钮'}
                  </button>
                </div>
              </div>
            </>
          )}
        </BlockStack>
      </div>
    </Card>
  );
}

import {
  BlockStack,
  Text,
  Button,
  Heading,
  useExtensionApi,
  useSettings,
} from '@shopify/checkout-ui-extensions-react';
import { useEffect, useState } from 'react';

export default function ThankYouModal() {
  const { target } = useExtensionApi();
  const settings = useSettings();
  const [showModal, setShowModal] = useState(false);

  // 配置项
  const modalTitle = settings?.modal_title || '感谢您的购买！';
  const modalDescription = settings?.modal_description || '我们已为您创建了 FeedoGo 账户，快来探索更多功能吧！';
  const buttonText = settings?.button_text || '立即探索';
  const buttonLink = settings?.button_link || 'https://feedogocloud.com/dashboard';
  const backgroundColor = settings?.background_color || '#ffffff';
  const textColor = settings?.text_color || '#000000';
  const buttonColor = settings?.button_color || '#000000';
  const showDelay = parseInt(settings?.show_delay || '1000');

  // 根据延迟显示弹窗
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowModal(true);
    }, showDelay);

    return () => clearTimeout(timer);
  }, [showDelay]);

  // 处理按钮点击
  const handleButtonClick = () => {
    // 跳转到目标页面
    if (buttonLink) {
      window.open(buttonLink, '_blank');
    }
  };

  // 关闭弹窗
  const handleClose = () => {
    setShowModal(false);
  };

  if (!showModal || target.name !== 'purchase.thank-you.block') {
    return null;
  }

  return (
    <BlockStack spacing="tight">
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}
        onClick={handleClose}
      >
        <div
          style={{
            backgroundColor: backgroundColor,
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            color: textColor,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Heading level={2} style={{ margin: 0, marginBottom: '16px', color: textColor }}>
            {modalTitle}
          </Heading>

          <Text
            size="base"
            style={{
              margin: 0,
              marginBottom: '24px',
              color: textColor,
              opacity: 0.85,
            }}
          >
            {modalDescription}
          </Text>

          <BlockStack spacing="tight">
            <Button
              kind="primary"
              onPress={handleButtonClick}
              style={{
                backgroundColor: buttonColor,
                color: '#ffffff',
                padding: '12px 32px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
              }}
            >
              {buttonText}
            </Button>

            <Button
              kind="secondary"
              onPress={handleClose}
              style={{
                padding: '12px 32px',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              关闭
            </Button>
          </BlockStack>
        </div>
      </div>
    </BlockStack>
  );
}

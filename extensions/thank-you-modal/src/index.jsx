import React from 'react';
import {
  reactExtension,
  BlockStack,
  View,
  Heading,
  Text,
  Button,
  InlineStack
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'purchase.thank-you.block.render',
  () => <Extension />
);

function Extension() {
  return (
    <View 
      border="base" 
      cornerRadius="base" 
      padding="base"
    >
      <BlockStack spacing="base">
        <Heading level={2}>🎁 恭喜！您的订单已确认</Heading>
        <Text size="base">
          感谢您的购买！作为尊贵的客户，我们为您准备了一份专属礼品。
        </Text>
        <Text size="large" emphasis="bold">
          专属优惠码：WELCOME2026
        </Text>
        <Text size="small" appearance="subdued">
          请在下次购物时使用此优惠码，可享受额外折扣。
        </Text>
        <InlineStack spacing="base">
          <Button 
            kind="primary"
            to="https://feedogostore.myshopify.com"
          >
            继续购物
          </Button>
        </InlineStack>
      </BlockStack>
    </View>
  );
}

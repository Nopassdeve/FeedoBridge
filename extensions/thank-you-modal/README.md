# Thank You Modal Extension

Shopify Checkout UI Extension for displaying a customizable thank you modal on the order confirmation page.

## Features

- **Customizable Modal** - Configure title, description, button text, and link
- **Color Customization** - Set background, text, and button colors
- **Delayed Display** - Show modal after a configurable delay (0-5000ms)
- **Auto User Registration** - Automatically register customers in FeedoGo
- **Order Push** - Automatically push orders to FeedoGo API
- **Event Tracking** - Track modal interactions (shown, clicked, closed)

## Configuration

The modal settings can be configured in the Shopify App admin panel under "Thank You Page" tab.

### Available Settings

- **Modal Title** - Text displayed as the modal heading
- **Modal Description** - Text displayed as the modal body
- **Button Text** - Text on the primary button
- **Button Link** - URL to redirect when button is clicked
- **Background Color** - Modal background color (hex format)
- **Text Color** - Text color inside the modal (hex format)
- **Button Color** - Button background color (hex format)
- **Show Delay** - Milliseconds to wait before showing the modal (0-5000)

## How It Works

### User Flow

1. Customer completes checkout
2. Order confirmation page loads
3. Extension waits for configured delay
4. Thank you modal is displayed
5. Automatically registers user in FeedoGo (if enabled)
6. Automatically pushes order data to FeedoGo
7. Customer can click the button to visit FeedoGo or close the modal

### Backend Flow

1. **User Registration**
   - Check if user email already exists in FeedoGo
   - If not, automatically create account
   - Send welcome email with login link

2. **Order Push**
   - Extract order data from checkout
   - Add shop and customer information
   - Push to FeedoGo webhook URL
   - Log success/failure status

3. **Event Tracking**
   - Record when modal is shown
   - Record button clicks with destination
   - Record modal closures
   - Store in database for analytics

## Database

### ThankYouModalEvent Table

```sql
CREATE TABLE thank_you_modal_events (
  id UUID PRIMARY KEY,
  shop_id UUID REFERENCES shops(id),
  order_id VARCHAR(255),
  event_type VARCHAR(50), -- 'shown', 'clicked', 'closed'
  button_link VARCHAR(255),
  user_agent TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP
);
```

## API Endpoints

### Auto Register & Order Push

**POST** `/api/webhooks/order-auto-register`

```json
{
  "shopDomain": "mystore.myshopify.com",
  "orderId": "gid://shopify/Order/123",
  "orderEmail": "customer@example.com",
  "orderName": "John Doe",
  "orderData": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered and order pushed"
}
```

### Event Logging

**POST** `/api/webhooks/thank-you-modal-event`

```json
{
  "event": "thank_you_modal_shown|thank_you_modal_clicked|thank_you_modal_closed",
  "data": {
    "orderId": "gid://shopify/Order/123",
    "shop": "mystore.myshopify.com",
    "buttonLink": "https://feedogocloud.com/dashboard"
  },
  "timestamp": "2026-01-23T10:30:00Z"
}
```

## Requirements

### Shopify API Scopes

- `read_orders` - Read order data
- `write_customers` - Create/update customer data
- `read_customers` - Read customer data

### FeedoGo API Configuration

The following must be configured in the app settings:

1. **API Key** - Authentication token for FeedoGo API
2. **Webhook URL** - Endpoint to receive order data
3. **SSO Secret** - For single sign-on functionality (optional)

### Environment Variables

```env
FEEDOGO_API_KEY=your_api_key
FEEDOGO_WEBHOOK_URL=https://your-feedogo-domain/api/v1/webhooks/shopify
SSO_SECRET=your_sso_secret
```

## Development

### Local Testing

```bash
# Start the extension in development mode
npm run shopify:dev

# Test in a development store by navigating to checkout page
# Order confirmation will show the modal

# Check the browser console for debug logs
```

### Customization

Edit `extensions/thank-you-modal/src/Checkout.jsx` to customize:

- Modal styling
- Event tracking
- API calls
- Validation logic

## Troubleshooting

### Modal Not Appearing

1. Check that extension is installed in the store
2. Verify `thankYouModalConfig` is set in app settings
3. Check browser console for errors
4. Ensure the delay setting is not too long

### Auto-Register Not Working

1. Verify FeedoGo API credentials are correct
2. Check that `enableAutoRegister` is true
3. Review server logs for API errors
4. Ensure FeedoGo webhook URL is accessible

### Orders Not Being Pushed

1. Check FeedoGo API Key and Webhook URL
2. Verify network connectivity to FeedoGo
3. Check for rate limiting on FeedoGo side
4. Review error messages in `OrderPushLog` table

## File Structure

```
extensions/thank-you-modal/
├── shopify.extension.toml    # Extension configuration
├── package.json              # Dependencies
└── src/
    └── Checkout.jsx          # Modal component

pages/api/webhooks/
├── order-auto-register.ts    # User registration & order push
└── thank-you-modal-event.ts  # Event logging
```

## Related Files

- `components/ThankYouModalSettings.tsx` - Admin UI for configuration
- `prisma/schema.prisma` - Database schema
- `pages/api/settings.ts` - Settings API

## Support

For issues or questions, contact NopassDev support.

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-23

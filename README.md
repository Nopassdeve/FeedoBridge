# FeedoBridge

Shopify App for integrating FeedoGo loyalty program with Shopify stores.

## Quick Start

### Production Deployment

```bash
# Run automated deployment script
./production-deploy.sh
```

### Manual Deployment

See [PRODUCTION_DEPLOY.md](PRODUCTION_DEPLOY.md) for detailed instructions.

## Features

- 🔐 OAuth Integration with Shopify
- 💰 Automatic Love Coin Exchange (Orders → FeedoGo)
- 📧 Email Auto-Login
- 👥 Customer Auto-Registration
- 📦 Webhook Processing (Orders, Customers)
- 🎨 Theme App Extension
- 🎁 Thank You Page Modal

## Tech Stack

- **Framework**: Next.js 14 + TypeScript
- **Database**: PostgreSQL + Prisma
- **Cache**: Redis
- **Deployment**: Docker Compose
- **Platform**: Shopify App

## Environment Variables

```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
FEEDOGO_BASE_URL=https://shop.feedogocloud.com
```

## Production URLs

- **App**: https://shopifyapp.xmasforest.com
- **Admin**: https://admin.shopify.com/store/YOUR_STORE/apps/feedobridge

## Support

- VPS: 76.13.98.3
- Docs: See PRODUCTION_DEPLOY.md
 by NopassDev

Shopify App for seamless integration with FeedoGo Cloud.

## Features

- Embedded iframe integration with FeedoGo Cloud
- Single Sign-On (SSO) support
- Automatic customer registration
- Order synchronization
- Thank you page modal customization

## Setup

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables:
```bash
cp .env.example .env
```

3. Initialize database:
```bash
npm run db:generate
npm run db:migrate
```

4. Start development server:
```bash
npm run dev
```

5. Start Shopify CLI:
```bash
npm run shopify:dev
```

## Configuration

Configure your app settings in the Shopify admin panel after installation.

## Developer

NopassDev

## License

MIT


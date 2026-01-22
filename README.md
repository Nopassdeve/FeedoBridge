# FeedoBridge by NopassDev

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

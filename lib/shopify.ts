import crypto from 'crypto';

export function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
  const secret = process.env.SHOPIFY_API_SECRET || '';
  const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader));
}

export function verifyShopifyRequest(query: any): boolean {
  const { hmac, ...params } = query;
  
  const message = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const secret = process.env.SHOPIFY_API_SECRET || '';
  const hash = crypto.createHmac('sha256', secret).update(message).digest('hex');
  
  return hash === hmac;
}

export async function makeShopifyRequest(
  shop: string,
  accessToken: string,
  endpoint: string,
  method: string = 'GET',
  data?: any
) {
  const url = `https://${shop}/admin/api/2024-01/${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    }
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  return await response.json();
}

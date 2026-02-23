import crypto from 'crypto';

export function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
  try {
    if (!hmacHeader) {
      console.error('[HMAC] Header is missing');
      return false;
    }
    
    const secret = process.env.SHOPIFY_API_SECRET || '';
    if (!secret) {
      console.error('[HMAC] SHOPIFY_API_SECRET is not configured');
      return false;
    }
    
    const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
    console.log('[HMAC] Computed hash:', hash.substring(0, 20) + '...');
    console.log('[HMAC] Received hash:', hmacHeader.substring(0, 20) + '...');
    
    // Check if lengths match before timingSafeEqual
    if (Buffer.from(hash).length !== Buffer.from(hmacHeader).length) {
      console.error('[HMAC] Hash lengths do not match');
      return false;
    }
    
    const isValid = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader));
    console.log('[HMAC] Verification result:', isValid);
    return isValid;
  } catch (error: any) {
    console.error('[HMAC] Verification error:', error.message);
    return false;
  }
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

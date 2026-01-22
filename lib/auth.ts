import crypto from 'crypto';

export function generateSSOSignature(data: object, secret: string): string {
  const message = JSON.stringify(data);
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

export function verifySSOSignature(data: object, signature: string, secret: string): boolean {
  const calculatedSignature = generateSSOSignature(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}

export function generateSSOToken(payload: object): string {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifySSOToken(token: string): any {
  const jwt = require('jsonwebtoken');
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

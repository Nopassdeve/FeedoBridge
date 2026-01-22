import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

let isConnected = false;

export async function getRedisClient() {
  if (!isConnected) {
    await redisClient.connect();
    isConnected = true;
  }
  return redisClient;
}

export async function setCache(key: string, value: string, ttl: number = 3600) {
  const client = await getRedisClient();
  await client.setEx(key, ttl, value);
}

export async function getCache(key: string): Promise<string | null> {
  const client = await getRedisClient();
  return await client.get(key);
}

export async function deleteCache(key: string) {
  const client = await getRedisClient();
  await client.del(key);
}

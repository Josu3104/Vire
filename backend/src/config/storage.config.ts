import { registerAs } from '@nestjs/config';

export const storageConfig = registerAs('storage', () => ({
  endpoint: process.env.SEAWEED_S3_ENDPOINT || 'http://localhost:8333',
  bucket: process.env.SEAWEED_S3_BUCKET || 'vire-storage',
  region: process.env.SEAWEED_S3_REGION || 'us-east-1',
  accessKey: process.env.SEAWEED_ACCESS_KEY || 'admin',
  secretKey: process.env.SEAWEED_SECRET_KEY || 'admin',
}));

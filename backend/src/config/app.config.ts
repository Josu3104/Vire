import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'super_secret',
  jwtExpiration: process.env.JWT_EXPIRATION || '7d',
  brevoApiKey: process.env.BREVO_API_KEY || '',
}));

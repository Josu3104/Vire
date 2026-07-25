import { registerAs } from '@nestjs/config';

export const clamavConfig = registerAs('clamav', () => ({
  host: process.env.CLAMAV_HOST || 'localhost',
  port: parseInt(process.env.CLAMAV_PORT || '3310', 10),
}));

export interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  CORS_ORIGINS: string;
  REDIS_URL: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
  R2_BUCKET: R2Bucket;
  WEBSOCKET_DO: DurableObjectNamespace;
  NODE_ENV: string;
}

export function getConfig(env: Env) {
  return {
    jwt: {
      secret: env.JWT_SECRET || 'fallback-secret',
      refreshSecret: env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
      expiresIn: '15m',
      refreshExpiresIn: '7d',
    },
    bcrypt: { saltRounds: 12 },
    corsOrigins: (env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    redis: { url: env.REDIS_URL || '' },
    smtp: {
      host: env.SMTP_HOST || '',
      port: parseInt(env.SMTP_PORT || '587'),
      user: env.SMTP_USER || '',
      pass: env.SMTP_PASS || '',
      from: env.SMTP_FROM || 'noreply@vanzhub.com',
    },
    upload: { maxFileSize: 10485760 },
    features: {
      emailVerification: true,
      twoFactorAuth: false,
      groups: true,
    },
  };
}

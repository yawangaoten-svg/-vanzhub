import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: parseInt(process.env.PORT || process.env.BACKEND_PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@vanzhub.com',
  },

  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  cloudinary: {
    enabled: process.env.CLOUDINARY_ENABLED === 'true',
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  features: {
    emailVerification: process.env.ENABLE_EMAIL_VERIFICATION !== 'false',
    twoFactorAuth: process.env.ENABLE_TWO_FACTOR_AUTH === 'true',
    videoUploads: process.env.ENABLE_VIDEO_UPLOADS !== 'false',
    polls: process.env.ENABLE_POLLS !== 'false',
    gifs: process.env.ENABLE_GIFS !== 'false',
    scheduledPosts: process.env.ENABLE_SCHEDULED_POSTS !== 'false',
    drafts: process.env.ENABLE_DRAFTS !== 'false',
    groups: process.env.ENABLE_GROUPS !== 'false',
  },
};

export default config;

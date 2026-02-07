const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const envConfig = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:5000',
  API_VERSION: process.env.API_VERSION || 'v1',
  APP_NAME: process.env.APP_NAME || 'Zewed Jobs',
  APP_DESCRIPTION: process.env.APP_DESCRIPTION || "Ethiopia's Premier Job Portal",
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/zewed_jobs',
  MONGODB_URI_PROD: process.env.MONGODB_URI_PROD,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_COOKIE_EXPIRE: parseInt(process.env.JWT_COOKIE_EXPIRE, 10) || 7,
  
  // Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM || 'support@zewedjobs.com',
  
  // Payment Gateways
  CHAPA_SECRET_KEY: process.env.CHAPA_SECRET_KEY,
  TELEBIRR_API_KEY: process.env.TELEBIRR_API_KEY,
  TELEBIRR_API_SECRET: process.env.TELEBIRR_API_SECRET,
  CBE_MERCHANT_ID: process.env.CBE_MERCHANT_ID,
  CBE_MERCHANT_KEY: process.env.CBE_MERCHANT_KEY,
  
  // AI Services
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  AI_CHAT_MODEL: process.env.AI_CHAT_MODEL || 'gpt-3.5-turbo',
  AI_JOBS_MODEL: process.env.AI_JOBS_MODEL || 'gpt-4',
  
  // Social Media
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
  
  // File Upload
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760,
  
  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT, 10) || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Analytics
  GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID,
  FACEBOOK_PIXEL_ID: process.env.FACEBOOK_PIXEL_ID,
  
  // Ads
  AD_REFRESH_INTERVAL: parseInt(process.env.AD_REFRESH_INTERVAL, 10) || 30000,
  AD_MAX_IMPRESSIONS: parseInt(process.env.AD_MAX_IMPRESSIONS, 10) || 100000,
  AD_CPC_RATE: parseFloat(process.env.AD_CPC_RATE) || 0.5,
  AD_CPM_RATE: parseFloat(process.env.AD_CPM_RATE) || 5,
  
  // Security
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 1000,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'combined.log',
  ERROR_LOG_FILE: process.env.ERROR_LOG_FILE || 'error.log',
  
  // Feature Flags
  ENABLED_FEATURES: process.env.ENABLED_FEATURES 
    ? process.env.ENABLED_FEATURES.split(',') 
    : [],
};

// Validate required environment variables
const validateEnv = () => {
  const required = [
    'JWT_SECRET',
    'MONGODB_URI',
  ];
  
  if (envConfig.NODE_ENV === 'production') {
    required.push(
      'MONGODB_URI_PROD',
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASSWORD'
    );
  }
  
  const missing = required.filter(field => !envConfig[field] && !process.env[field]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
};

// Get environment-specific configuration
const getEnvConfig = () => {
  const config = { ...envConfig };
  
  // Override for production
  if (config.NODE_ENV === 'production') {
    config.MONGODB_URI = config.MONGODB_URI_PROD;
    config.CLIENT_URL = 'https://zewedjobs.com';
    config.SERVER_URL = 'https://api.zewedjobs.com';
  }
  
  // Override for testing
  if (config.NODE_ENV === 'test') {
    config.MONGODB_URI = 'mongodb://localhost:27017/zewed_jobs_test';
    config.JWT_SECRET = 'test_jwt_secret';
  }
  
  return config;
};

// Check if feature is enabled
const isFeatureEnabled = (feature) => {
  return envConfig.ENABLED_FEATURES.includes(feature);
};

// Export validated configuration
validateEnv();

module.exports = {
  ...getEnvConfig(),
  isFeatureEnabled,
  validateEnv,
};

require('dotenv').config();

const env = {
    // App
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5000,
    APP_NAME: process.env.APP_NAME || 'ZewedJobs',
    APP_URL: process.env.APP_URL || 'http://localhost:5000',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

    // Database
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/zewedjobs',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    JWT_COOKIE_EXPIRE: parseInt(process.env.JWT_COOKIE_EXPIRE) || 7,

    // Email
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: parseInt(process.env.EMAIL_PORT) || 587,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@zewedjobs.com',

    // File Upload
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',

    // Cloudinary (if using)
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

    // Admin
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@zewedjobs.com',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,

    // External APIs
    GOOGLE_TRANSLATE_API_KEY: process.env.GOOGLE_TRANSLATE_API_KEY,
    GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID,

    // Security
    RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15,
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

    // Payment Gateways
    TELEBIRR_ENABLED: process.env.TELEBIRR_ENABLED === 'true',
    TELEBIRR_API_KEY: process.env.TELEBIRR_API_KEY,
    TELEBIRR_SHORT_CODE: process.env.TELEBIRR_SHORT_CODE,
    TELEBIRR_PUBLIC_KEY: process.env.TELEBIRR_PUBLIC_KEY,
    TELEBIRR_PRIVATE_KEY: process.env.TELEBIRR_PRIVATE_KEY,
    TELEBIRR_CALLBACK_URL: process.env.TELEBIRR_CALLBACK_URL,

    CBE_BIRR_ENABLED: process.env.CBE_BIRR_ENABLED === 'true',
    CBE_BIRR_API_KEY: process.env.CBE_BIRR_API_KEY,
    CBE_BIRR_MERCHANT_ID: process.env.CBE_BIRR_MERCHANT_ID,
    CBE_BIRR_CALLBACK_URL: process.env.CBE_BIRR_CALLBACK_URL,

    PAYPAL_ENABLED: process.env.PAYPAL_ENABLED === 'true',
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
    PAYPAL_MODE: process.env.PAYPAL_MODE || 'sandbox',

    STRIPE_ENABLED: process.env.STRIPE_ENABLED === 'true',
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

    CHAPA_ENABLED: process.env.CHAPA_ENABLED === 'true',
    CHAPA_API_KEY: process.env.CHAPA_API_KEY,
    CHAPA_CALLBACK_URL: process.env.CHAPA_CALLBACK_URL,

    // SMS Gateway (Ethiopian)
    ETHIO_TELECOM_SMS_API_KEY: process.env.ETHIO_TELECOM_SMS_API_KEY,
    ETHIO_TELECOM_SMS_SENDER_ID: process.env.ETHIO_TELECOM_SMS_SENDER_ID,

    // Analytics
    MIXPANEL_TOKEN: process.env.MIXPANEL_TOKEN,
    HOTJAR_ID: process.env.HOTJAR_ID,

    // Feature Flags
    ENABLE_AI_CHAT: process.env.ENABLE_AI_CHAT === 'true',
    ENABLE_LIVE_STREAMING: process.env.ENABLE_LIVE_STREAMING === 'true',
    ENABLE_PUSH_NOTIFICATIONS: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
};

// Validate required environment variables
const requiredEnvVars = [
    'JWT_SECRET',
    'MONGODB_URI',
    'EMAIL_HOST',
    'EMAIL_USER',
    'EMAIL_PASS',
];

if (env.NODE_ENV === 'production') {
    requiredEnvVars.forEach((varName) => {
        if (!process.env[varName]) {
            console.error(`❌ Missing required environment variable: ${varName}`);
            process.exit(1);
        }
    });
}

// Export the environment configuration
module.exports = env;

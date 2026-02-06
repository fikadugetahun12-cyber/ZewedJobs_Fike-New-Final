module.exports = {
    ethiopian: {
        telebirr: {
            enabled: process.env.TELEBIRR_ENABLED === 'true',
            shortCode: process.env.TELEBIRR_SHORT_CODE || '',
            username: process.env.TELEBIRR_USERNAME,
            password: process.env.TELEBIRR_PASSWORD,
            baseUrl: process.env.TELEBIRR_BASE_URL || 'https://api.telebirr.com',
            callbackUrl: process.env.API_URL + '/api/payments/telebirr/callback'
        },
        cbeBirr: {
            enabled: process.env.CBE_BIRR_ENABLED === 'true',
            merchantId: process.env.CBE_BIRR_MERCHANT_ID,
            apiKey: process.env.CBE_BIRR_API_KEY,
            baseUrl: process.env.CBE_BIRR_BASE_URL || 'https://api.cbe.com.et',
            callbackUrl: process.env.API_URL + '/api/payments/cbe-birr/callback'
        },
        chapa: {
            enabled: process.env.CHAPA_ENABLED === 'true',
            secretKey: process.env.CHAPA_SECRET_KEY,
            publicKey: process.env.CHAPA_PUBLIC_KEY,
            baseUrl: process.env.CHAPA_BASE_URL || 'https://api.chapa.co',
            callbackUrl: process.env.API_URL + '/api/payments/chapa/callback'
        }
    },
    global: {
        stripe: {
            enabled: process.env.STRIPE_ENABLED === 'true',
            secretKey: process.env.STRIPE_SECRET_KEY,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            successUrl: process.env.FRONTEND_URL + '/payment/success',
            cancelUrl: process.env.FRONTEND_URL + '/payment/cancel'
        },
        paypal: {
            enabled: process.env.PAYPAL_ENABLED === 'true',
            clientId: process.env.PAYPAL_CLIENT_ID,
            clientSecret: process.env.PAYPAL_CLIENT_SECRET,
            mode: process.env.PAYPAL_MODE || 'sandbox',
            successUrl: process.env.FRONTEND_URL + '/payment/success',
            cancelUrl: process.env.FRONTEND_URL + '/payment/cancel'
        }
    },
    currencies: {
        primary: 'ETB',
        supported: ['ETB', 'USD', 'EUR']
    },
    defaultCurrency: 'ETB',
    exchangeRates: {
        USD_TO_ETB: 55,
        EUR_TO_ETB: 60
    }
};

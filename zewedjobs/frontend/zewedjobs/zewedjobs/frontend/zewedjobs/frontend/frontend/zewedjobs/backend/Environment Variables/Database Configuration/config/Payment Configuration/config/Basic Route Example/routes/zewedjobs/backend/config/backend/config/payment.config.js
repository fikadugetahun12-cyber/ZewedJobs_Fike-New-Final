/**
 * Ethiopian and Global Payment Gateway Configuration
 * Supports: Telebirr, CBE Birr, PayPal, Stripe, Chapa, etc.
 */

const env = require('./env');

module.exports = {
    // Environment
    env: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',

    // Base URLs
    appUrl: env.APP_URL,
    frontendUrl: env.FRONTEND_URL,

    // Ethiopian Payment Gateways
    ethiopian: {
        telebirr: {
            enabled: env.TELEBIRR_ENABLED,
            apiKey: env.TELEBIRR_API_KEY,
            shortCode: env.TELEBIRR_SHORT_CODE,
            publicKey: env.TELEBIRR_PUBLIC_KEY,
            privateKey: env.TELEBIRR_PRIVATE_KEY,
            callbackUrl: env.TELEBIRR_CALLBACK_URL,
            apiBaseUrl: env.isProduction 
                ? 'https://telebirr.ethiotelecom.et' 
                : 'https://test.telebirr.ethiotelecom.et',
            endpoints: {
                initiate: '/api/v2/payment/initiate',
                verify: '/api/v2/payment/verify',
                refund: '/api/v2/payment/refund'
            },
            currencies: ['ETB'],
            minAmount: 1,
            maxAmount: 100000,
            fees: {
                percentage: 0.015, // 1.5%
                fixed: 2
            }
        },

        cbeBirr: {
            enabled: env.CBE_BIRR_ENABLED,
            apiKey: env.CBE_BIRR_API_KEY,
            merchantId: env.CBE_BIRR_MERCHANT_ID,
            callbackUrl: env.CBE_BIRR_CALLBACK_URL,
            apiBaseUrl: env.isProduction 
                ? 'https://cbe-birr.com' 
                : 'https://test.cbe-birr.com',
            endpoints: {
                initiate: '/api/payment/request',
                verify: '/api/payment/status',
                callback: '/api/payment/callback'
            },
            currencies: ['ETB'],
            minAmount: 1,
            maxAmount: 50000,
            fees: {
                percentage: 0.02, // 2%
                fixed: 0
            }
        }
    },

    // Global Payment Gateways
    global: {
        paypal: {
            enabled: env.PAYPAL_ENABLED,
            clientId: env.PAYPAL_CLIENT_ID,
            clientSecret: env.PAYPAL_CLIENT_SECRET,
            mode: env.PAYPAL_MODE,
            apiBaseUrl: env.PAYPAL_MODE === 'live' 
                ? 'https://api-m.paypal.com' 
                : 'https://api-m.sandbox.paypal.com',
            endpoints: {
                createOrder: '/v2/checkout/orders',
                captureOrder: '/v2/checkout/orders/{id}/capture',
                getOrder: '/v2/checkout/orders/{id}'
            },
            currencies: ['USD', 'EUR', 'GBP'],
            conversionRate: {
                ETB: 55, // 1 USD = 55 ETB (approximate)
                updatedAt: new Date().toISOString()
            }
        },

        stripe: {
            enabled: env.STRIPE_ENABLED,
            publishableKey: env.STRIPE_PUBLISHABLE_KEY,
            secretKey: env.STRIPE_SECRET_KEY,
            webhookSecret: env.STRIPE_WEBHOOK_SECRET,
            apiBaseUrl: 'https://api.stripe.com/v1',
            endpoints: {
                createPaymentIntent: '/payment_intents',
                createCustomer: '/customers',
                webhook: '/webhook'
            },
            currencies: ['usd', 'eur', 'gbp', 'etb'],
            supportedCountries: ['US', 'GB', 'ET', 'CA', 'AU', 'EU'],
            fees: {
                percentage: 0.029, // 2.9%
                fixed: 0.30 // $0.30
            }
        },

        chapa: {
            enabled: env.CHAPA_ENABLED,
            apiKey: env.CHAPA_API_KEY,
            callbackUrl: env.CHAPA_CALLBACK_URL,
            apiBaseUrl: 'https://api.chapa.co/v1',
            endpoints: {
                initialize: '/transaction/initialize',
                verify: '/transaction/verify/{id}',
                banks: '/banks'
            },
            currencies: ['ETB', 'USD'],
            supportedBanks: [
                'CBE',
                'Awash Bank',
                'Dashen Bank',
                'Abyssinia Bank',
                'Nib Bank',
                'United Bank',
                'Berhan Bank',
                'Wegagen Bank',
                'Bunna Bank'
            ]
        }
    },

    // Payment methods metadata
    paymentMethods: {
        telebirr: {
            name: 'Telebirr',
            icon: '/assets/images/payments/telebirr.png',
            description: 'Mobile money payment via Ethio Telecom',
            supportedCountries: ['ET'],
            processingTime: 'Instant',
            popularInEthiopia: true
        },
        cbeBirr: {
            name: 'CBE Birr',
            icon: '/assets/images/payments/cbe-birr.png',
            description: 'Mobile banking via Commercial Bank of Ethiopia',
            supportedCountries: ['ET'],
            processingTime: 'Instant',
            popularInEthiopia: true
        },
        chapa: {
            name: 'Chapa',
            icon: '/assets/images/payments/chapa.png',
            description: 'Ethiopian payment gateway supporting all banks',
            supportedCountries: ['ET'],
            processingTime: '1-2 minutes',
            popularInEthiopia: true
        },
        paypal: {
            name: 'PayPal',
            icon: '/assets/images/payments/paypal.png',
            description: 'International payment for diaspora',
            supportedCountries: ['US', 'GB', 'CA', 'AU', 'EU'],
            processingTime: 'Instant',
            popularInEthiopia: false
        },
        stripe: {
            name: 'Stripe',
            icon: '/assets/images/payments/stripe.png',
            description: 'Global payment processing',
            supportedCountries: ['US', 'GB', 'EU', 'ET'],
            processingTime: 'Instant',
            popularInEthiopia: false
        }
    },

    // Transaction settings
    transaction: {
        defaultCurrency: 'ETB',
        timeout: 30 * 60 * 1000, // 30 minutes
        retryAttempts: 3,
        retryDelay: 5000, // 5 seconds
        webhookRetry: 3,
        
        // Security
        require3DSecure: true,
        requireCVV: true,
        minPasswordLength: 6,
        
        // Limits
        dailyLimit: 100000,
        weeklyLimit: 500000,
        monthlyLimit: 2000000
    },

    // Webhook configuration
    webhooks: {
        enabled: true,
        secret: env.JWT_SECRET,
        events: [
            'payment.succeeded',
            'payment.failed',
            'payment.refunded',
            'payment.disputed'
        ]
    },

    // Currency conversion
    currencyConversion: {
        enabled: true,
        baseCurrency: 'USD',
        rates: {
            USD: 1,
            ETB: 55,
            EUR: 0.92,
            GBP: 0.79
        },
        autoUpdate: true,
        updateInterval: 24 * 60 * 60 * 1000 // 24 hours
    },

    // Refund policy
    refundPolicy: {
        allowed: true,
        timeframe: 7 * 24 * 60 * 60 * 1000, // 7 days
        feePercentage: 0.1, // 10%
        processingTime: '3-5 business days'
    },

    // Compliance
    compliance: {
        pciDSS: true,
        gdpr: true,
        ethiopianFinancialLaws: true,
        requiresTaxId: true,
        taxRate: 0.15 // 15% VAT
    },

    // Logging
    logging: {
        enabled: true,
        level: env.isProduction ? 'error' : 'debug',
        file: './logs/payments.log',
        maxSize: '10m',
        maxFiles: '30d'
    },

    // Methods to get payment configuration
    getConfig: function(gateway) {
        return this[gateway];
    },

    isGatewayEnabled: function(gateway) {
        const gateways = {
            'telebirr': this.ethiopian.telebirr.enabled,
            'cbe-birr': this.ethiopian.cbeBirr.enabled,
            'paypal': this.global.paypal.enabled,
            'stripe': this.global.stripe.enabled,
            'chapa': this.global.chapa.enabled
        };
        return gateways[gateway] || false;
    },

    getSupportedCurrencies: function(gateway) {
        const currencies = {
            'telebirr': this.ethiopian.telebirr.currencies,
            'cbe-birr': this.ethiopian.cbeBirr.currencies,
            'paypal': this.global.paypal.currencies,
            'stripe': this.global.stripe.currencies,
            'chapa': this.global.chapa.currencies
        };
        return currencies[gateway] || ['ETB'];
    },

    calculateFees: function(gateway, amount) {
        const gatewayConfig = this.getConfig(gateway.includes('ethiopian') ? 
            this.ethiopian[gateway.replace('ethiopian.', '')] : 
            this.global[gateway]);
        
        if (!gatewayConfig || !gatewayConfig.fees) return amount;
        
        const fees = gatewayConfig.fees;
        const feeAmount = (amount * fees.percentage) + fees.fixed;
        return {
            amount: amount,
            fee: feeAmount,
            total: amount + feeAmount,
            breakdown: {
                percentage: fees.percentage * 100,
                fixed: fees.fixed,
                amount: amount
            }
        };
    }
};

// Validate payment configuration
function validatePaymentConfig() {
    const config = module.exports;
    
    if (config.isProduction) {
        // Check if at least one payment gateway is enabled
        const enabledGateways = [
            config.ethiopian.telebirr.enabled,
            config.ethiopian.cbeBirr.enabled,
            config.global.paypal.enabled,
            config.global.stripe.enabled,
            config.global.chapa.enabled
        ].some(enabled => enabled);

        if (!enabledGateways) {
            console.warn('⚠️ No payment gateways are enabled in production!');
        }

        // Validate API keys for enabled gateways
        if (config.ethiopian.telebirr.enabled && !config.ethiopian.telebirr.apiKey) {
            throw new Error('Telebirr API key is required when enabled');
        }

        if (config.global.stripe.enabled && !config.global.stripe.secretKey) {
            throw new Error('Stripe secret key is required when enabled');
        }
    }
}

// Run validation
try {
    validatePaymentConfig();
    console.log('✅ Payment configuration validated successfully');
} catch (error) {
    console.error('❌ Payment configuration error:', error.message);
    if (module.exports.isProduction) {
        process.exit(1);
    }
}

module.exports.validatePaymentConfig = validatePaymentConfig;

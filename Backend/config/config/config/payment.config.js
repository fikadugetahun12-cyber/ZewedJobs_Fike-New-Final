const envConfig = require('./env');

/**
 * Ethiopian Payment Gateway Configuration
 * Supports: Chapa, Telebirr, CBE Birr
 */

const paymentConfig = {
  // Chapa (https://chapa.co/)
  chapa: {
    enabled: !!envConfig.CHAPA_SECRET_KEY,
    secretKey: envConfig.CHAPA_SECRET_KEY,
    baseUrl: 'https://api.chapa.co/v1',
    webhookUrl: `${envConfig.SERVER_URL}/api/v1/payments/chapa/webhook`,
    endpoints: {
      initialize: '/transaction/initialize',
      verify: '/transaction/verify',
      transfers: '/transfers',
      banks: '/banks',
    },
    currencies: ['ETB', 'USD'],
    fees: {
      percentage: 1.5, // 1.5% transaction fee
      minFee: 2, // Minimum 2 ETB
      maxFee: 100, // Maximum 100 ETB
    },
    timeout: 30000, // 30 seconds
  },
  
  // Telebirr (Ethio Telecom)
  telebirr: {
    enabled: !!envConfig.TELEBIRR_API_KEY && !!envConfig.TELEBIRR_API_SECRET,
    apiKey: envConfig.TELEBIRR_API_KEY,
    apiSecret: envConfig.TELEBIRR_API_SECRET,
    baseUrl: 'https://api.telebirr.com',
    endpoints: {
      payment: '/api/v2/payment',
      inquiry: '/api/v2/inquiry',
      refund: '/api/v2/refund',
    },
    currencies: ['ETB'],
    fees: {
      percentage: 0.5, // 0.5% transaction fee
      minFee: 1, // Minimum 1 ETB
    },
    timeout: 45000, // 45 seconds
  },
  
  // Commercial Bank of Ethiopia (CBE Birr)
  cbe: {
    enabled: !!envConfig.CBE_MERCHANT_ID && !!envConfig.CBE_MERCHANT_KEY,
    merchantId: envConfig.CBE_MERCHANT_ID,
    merchantKey: envConfig.CBE_MERCHANT_KEY,
    baseUrl: 'https://api.cbe.com.et',
    endpoints: {
      payment: '/v1/payments',
      verify: '/v1/payments/verify',
      refund: '/v1/payments/refund',
    },
    currencies: ['ETB'],
    fees: {
      flat: 5, // 5 ETB flat fee
    },
    timeout: 60000, // 60 seconds
  },
  
  // Payment methods configuration
  methods: {
    // Mobile banking
    mobile: {
      cbe_birr: { name: 'CBE Birr', code: 'CBE' },
      telebirr: { name: 'Telebirr', code: 'TEL' },
      amole: { name: 'Amole', code: 'AMO' },
      hello_cash: { name: 'HelloCash', code: 'HLC' },
    },
    
    // Bank transfers
    bank: {
      cbe: { name: 'Commercial Bank of Ethiopia', code: 'CBE' },
      dashen: { name: 'Dashen Bank', code: 'DASH' },
      awash: { name: 'Awash Bank', code: 'AWSH' },
      abyssinia: { name: 'Bank of Abyssinia', code: 'BOA' },
    },
    
    // Cards
    card: {
      visa: { name: 'Visa', code: 'VISA' },
      mastercard: { name: 'Mastercard', code: 'MC' },
    },
  },
  
  // Payment purposes
  purposes: {
    JOB_POSTING: 'job_posting',
    JOB_PROMOTION: 'job_promotion',
    PREMIUM_MEMBERSHIP: 'premium_membership',
    COURSE_ENROLLMENT: 'course_enrollment',
    EVENT_REGISTRATION: 'event_registration',
    CERTIFICATE_ISSUANCE: 'certificate_issuance',
    DONATION: 'donation',
    ADVERTISING: 'advertising',
  },
  
  // Payment status
  status: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    CANCELLED: 'cancelled',
  },
  
  // Configuration methods
  getActiveGateways: () => {
    const gateways = [];
    if (paymentConfig.chapa.enabled) gateways.push('chapa');
    if (paymentConfig.telebirr.enabled) gateways.push('telebirr');
    if (paymentConfig.cbe.enabled) gateways.push('cbe');
    return gateways;
  },
  
  getGatewayConfig: (gateway) => {
    switch (gateway) {
      case 'chapa':
        return paymentConfig.chapa;
      case 'telebirr':
        return paymentConfig.telebirr;
      case 'cbe':
        return paymentConfig.cbe;
      default:
        throw new Error(`Unknown payment gateway: ${gateway}`);
    }
  },
  
  calculateFee: (amount, gateway = 'chapa') => {
    const config = paymentConfig.getGatewayConfig(gateway);
    
    if (!config) {
      return { fee: 0, netAmount: amount };
    }
    
    let fee = 0;
    
    if (config.fees.percentage) {
      fee = amount * (config.fees.percentage / 100);
    }
    
    if (config.fees.flat) {
      fee += config.fees.flat;
    }
    
    if (config.fees.minFee && fee < config.fees.minFee) {
      fee = config.fees.minFee;
    }
    
    if (config.fees.maxFee && fee > config.fees.maxFee) {
      fee = config.fees.maxFee;
    }
    
    const netAmount = amount - fee;
    
    return {
      fee: Math.round(fee * 100) / 100, // Round to 2 decimal places
      netAmount: Math.round(netAmount * 100) / 100,
      currency: config.currencies[0] || 'ETB',
    };
  },
  
  validateAmount: (amount, gateway = 'chapa') => {
    const config = paymentConfig.getGatewayConfig(gateway);
    
    if (!config) {
      return { valid: false, error: 'Invalid gateway' };
    }
    
    if (amount <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }
    
    // Minimum amount check
    if (amount < 1) { // 1 ETB minimum
      return { valid: false, error: 'Minimum payment amount is 1 ETB' };
    }
    
    // Maximum amount check (1,000,000 ETB)
    if (amount > 1000000) {
      return { valid: false, error: 'Maximum payment amount is 1,000,000 ETB' };
    }
    
    return { valid: true };
  },
  
  // Get supported currencies by gateway
  getSupportedCurrencies: (gateway) => {
    const config = paymentConfig.getGatewayConfig(gateway);
    return config ? config.currencies : ['ETB'];
  },
  
  // Format payment reference
  generateReference: (prefix = 'ZEWED') => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}-${timestamp}-${random.toString().padStart(4, '0')}`;
  },
  
  // Payment timeout in milliseconds
  getTimeout: (gateway) => {
    const config = paymentConfig.getGatewayConfig(gateway);
    return config ? config.timeout : 30000;
  },
};

module.exports = paymentConfig;

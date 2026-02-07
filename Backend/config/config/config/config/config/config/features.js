const envConfig = require('./env');

/**
 * Feature Flags Configuration for Zewed Jobs
 * Manage feature toggles for gradual rollouts and A/B testing
 */

class Features {
  constructor() {
    this.features = new Map();
    this.loadFeatures();
  }
  
  loadFeatures() {
    // Core features (always enabled)
    this.features.set('user_registration', true);
    this.features.set('job_postings', true);
    this.features.set('job_search', true);
    this.features.set('basic_application', true);
    this.features.set('user_profiles', true);
    
    // Dynamic features from environment
    envConfig.ENABLED_FEATURES.forEach(feature => {
      this.features.set(feature, true);
    });
    
    // Default configuration for each feature
    this.featureConfig = {
      // AI Features
      ai_job_matching: {
        name: 'AI Job Matching',
        description: 'Intelligent job matching using AI algorithms',
        enabled: this.features.has('ai_job_matching'),
        rolloutPercentage: 100, // Percentage of users who get this feature
        minUserTier: 'free', // free, premium, enterprise
        regions: ['all'], // Specific regions for rollout
        dependencies: ['user_profiles', 'job_postings'],
        settings: {
          model: 'gpt-3.5-turbo',
          matchThreshold: 60,
          maxRecommendations: 10,
        },
      },
      
      ai_cv_analysis: {
        name: 'AI CV Analysis',
        description: 'Automated CV/resume analysis and feedback',
        enabled: this.features.has('ai_cv_analysis'),
        rolloutPercentage: 50,
        minUserTier: 'free',
        regions: ['all'],
        dependencies: ['user_profiles'],
        settings: {
          maxAnalysisPerDay: 3,
          detailedFeedback: true,
          atsOptimization: true,
        },
      },
      
      ai_interview_prep: {
        name: 'AI Interview Preparation',
        description: 'Personalized interview question generation and mock interviews',
        enabled: this.features.has('ai_interview_prep'),
        rolloutPercentage: 30,
        minUserTier: 'premium',
        regions: ['addis_ababa', 'dire_dawa', 'bahir_dar'],
        dependencies: ['ai_job_matching'],
        settings: {
          maxQuestions: 20,
          includeEthiopianContext: true,
          mockInterviewEnabled: true,
        },
      },
      
      // Real-time Features
      real_time_notifications: {
        name: 'Real-time Notifications',
        description: 'Instant notifications for applications, messages, and updates',
        enabled: this.features.has('real_time_notifications'),
        rolloutPercentage: 100,
        minUserTier: 'free',
        regions: ['all'],
        dependencies: [],
        settings: {
          pushNotifications: true,
          emailNotifications: true,
          smsNotifications: false,
          webSocketEnabled: true,
        },
      },
      
      chat_system: {
        name: 'Chat System',
        description: 'Real-time messaging between employers and job seekers',
        enabled: this.features.has('chat_system'),
        rolloutPercentage: 100,
        minUserTier: 'free',
        regions: ['all'],
        dependencies: ['real_time_notifications'],
        settings: {
          maxMessageLength: 1000,
          fileSharing: true,
          voiceMessages: false,
          videoCalls: false,
          encryption: true,
        },
      },
      
      // Payment Features
      payment_gateways: {
        name: 'Payment Gateways',
        description: 'Integrated payment processing with Ethiopian providers',
        enabled: this.features.has('payment_gateways'),
        rolloutPercentage: 100,
        minUserTier: 'free',
        regions: ['ethiopia'],
        dependencies: [],
        settings: {
          chapaEnabled: true,
          telebirrEnabled: true,
          cbeEnabled: true,
          currencies: ['ETB'],
          autoConversion: false,
        },
      },
      
      subscription_plans: {
        name: 'Subscription Plans',
        description: 'Tiered subscription plans for premium features',
        enabled: this.features.has('subscription_plans'),
        rolloutPercentage: 100,
        minUserTier: 'free',
        regions: ['all'],
        dependencies: ['payment_gateways'],
        settings: {
          plans: ['free', 'basic', 'premium', 'enterprise'],
          trialPeriod: 7, // days
          autoRenewal: true,
          proratedUpgrades: true,
        },
      },
      
      // Certificate Features
      certificate_verification: {
        name: 'Certificate Verification',
        description: 'Digital certificate issuance and verification system',
        enabled: this.features.has('certificate_verification'),
        rolloutPercentage: 100,
        minUserTier: 'free',
        regions: ['all'],
        dependencies: ['payment_gateways'],
        settings: {
          blockchainVerification: false,
          qrCodes: true,
          digitalSignatures: true,
          expirationPeriod: 365, // days
        },
      },
      
      // Advertising Features
      job_promotions: {
        name: 'Job Promotions',
        description: 'Paid promotion for job listings',
        enabled: this.features.has('job_promotions'),
        rolloutPercentage: 100,
        minUserTier: 'free',
        regions: ['all'],
        dependencies: ['payment_gateways'],
        settings: {
          promotionTiers: ['standard', 'featured', 'urgent'],
          durationOptions: [7, 14, 30], // days
          boostFactors: [1.5, 2, 3],
        },
      },
      
      banner_ads: {
        name: 'Banner Advertising',
        description: 'Display advertising on the platform',
        enabled: this.features.has('banner_ads'),
        rolloutPercentage: 100,
        minUserTier: 'enterprise',
        regions: ['all'],
        dependencies: ['payment_gateways'],
        settings: {
          adFormats: ['banner', 'sidebar', 'interstitial'],
          pricingModels: ['cpc', 'cpm', 'cpa'],
          targetingOptions: true,
          frequencyCapping: true,
        },
      },
      
      // Analytics Features
      advanced_analytics: {
        name: 'Advanced Analytics',
        description: 'Detailed analytics and insights dashboard',
        enabled: this.features.has('advanced_analytics'),
        rolloutPercentage: 50,
        minUserTier: 'premium',
        regions: ['all'],
        dependencies: [],
        settings: {
          realTimeData: true,
          predictiveAnalytics: false,
          exportOptions: true,
          apiAccess: true,
        },
      },
      
      // Social Features
      social_sharing: {
        name: 'Social Sharing',
        description: 'Share jobs and content on social media',
        enabled: this.features.has('social_sharing'),
        rolloutPercentage: 100,
        minUserTier: 'free',
        regions: ['all'],
        dependencies: [],
        settings: {
          platforms: ['facebook', 'twitter', 'linkedin', 'telegram', 'whatsapp'],
          autoGeneratePosts: true,
          trackingEnabled: true,
        },
      },
      
      referral_program: {
        name: 'Referral Program',
        description: 'User referral system with rewards',
        enabled: this.features.has('referral_program'),
        rolloutPercentage: 30,
        minUserTier: 'free',
        regions: ['addis_ababa'],
        dependencies: ['payment_gateways'],
        settings: {
          referralBonus: 100, // ETB
          minPayout: 500, // ETB
          expirationDays: 90,
          tieredRewards: true,
        },
      },
      
      // Mobile Features
      mobile_app: {
        name: 'Mobile Application',
        description: 'Native mobile applications for iOS and Android',
        enabled: this.features.has('mobile_app'),
        rolloutPercentage: 20,
        minUserTier: 'free',
        regions: ['all'],
        dependencies: ['real_time_notifications'],
        settings: {
          pushNotifications: true,
          offlineMode: true,
          biometricAuth: true,
          deepLinking: true,
        },
      },
      
      // Admin Features
      admin_dashboard: {
        name: 'Admin Dashboard',
        description: 'Comprehensive administration interface',
        enabled: this.features.has('admin_dashboard'),
        rolloutPercentage: 100,
        minUserTier: 'admin',
        regions: ['all'],
        dependencies: ['advanced_analytics'],
        settings: {
          userManagement: true,
          contentModeration: true,
          financialReports: true,
          systemMonitoring: true,
        },
      },
    };
  }
  
  // Check if a feature is enabled for a specific user
  isEnabled(featureKey, userContext = {}) {
    const feature = this.featureConfig[featureKey];
    
    if (!feature) {
      return false;
    }
    
    // Check basic enablement
    if (!feature.enabled) {
      return false;
    }
    
    // Check user tier
    if (userContext.tier) {
      const tierOrder = { free: 0, basic: 1, premium: 2, enterprise: 3, admin: 4 };
      const userTierLevel = tierOrder[userContext.tier] || 0;
      const minTierLevel = tierOrder[feature.minUserTier] || 0;
      
      if (userTierLevel < minTierLevel) {
        return false;
      }
    }
    
    // Check region
    if (feature.regions.length > 0 && !feature.regions.includes('all')) {
      if (userContext.region && !feature.regions.includes(userContext.region)) {
        return false;
      }
    }
    
    // Check rollout percentage
    if (feature.rolloutPercentage < 100) {
      const userIdHash = userContext.userId 
        ? this.hashString(userContext.userId) 
        : Math.random() * 100;
      
      if (userIdHash > feature.rolloutPercentage) {
        return false;
      }
    }
    
    // Check dependencies
    if (feature.dependencies && feature.dependencies.length > 0) {
      for (const dependency of feature.dependencies) {
        if (!this.isEnabled(dependency, userContext)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  // Get feature configuration
  getConfig(featureKey) {
    return this.featureConfig[featureKey] || null;
  }
  
  // Get all enabled features for a user
  getEnabledFeatures(userContext = {}) {
    const enabledFeatures = [];
    
    for (const [featureKey] of Object.entries(this.featureConfig)) {
      if (this.isEnabled(featureKey, userContext)) {
        enabledFeatures.push({
          key: featureKey,
          config: this.featureConfig[featureKey],
        });
      }
    }
    
    return enabledFeatures;
  }
  
  // Get feature status for debugging
  getFeatureStatus(featureKey, userContext = {}) {
    const feature = this.featureConfig[featureKey];
    
    if (!feature) {
      return {
        enabled: false,
        reason: 'Feature not configured',
      };
    }
    
    const status = {
      feature: featureKey,
      name: feature.name,
      globallyEnabled: feature.enabled,
      userEnabled: this.isEnabled(featureKey, userContext),
      checks: [],
    };
    
    // Run individual checks
    if (!feature.enabled) {
      status.checks.push({ check: 'global_enablement', passed: false });
    }
    
    // Tier check
    if (userContext.tier) {
      const tierOrder = { free: 0, basic: 1, premium: 2, enterprise: 3, admin: 4 };
      const userTierLevel = tierOrder[userContext.tier] || 0;
      const minTierLevel = tierOrder[feature.minUserTier] || 0;
      status.checks.push({ 
        check: 'user_tier', 
        passed: userTierLevel >= minTierLevel,
        details: `User tier: ${userContext.tier}, Required: ${feature.minUserTier}`,
      });
    }
    
    // Region check
    if (feature.regions.length > 0 && !feature.regions.includes('all')) {
      const regionPassed = userContext.region 
        ? feature.regions.includes(userContext.region)
        : false;
      status.checks.push({
        check: 'region',
        passed: regionPassed,
        details: `User region: ${userContext.region || 'unknown'}, Allowed: ${feature.regions.join(', ')}`,
      });
    }
    
    // Rollout check
    if (feature.rolloutPercentage < 100) {
      const userIdHash = userContext.userId 
        ? this.hashString(userContext.userId) 
        : Math.random() * 100;
      const rolloutPassed = userIdHash <= feature.rolloutPercentage;
      status.checks.push({
        check: 'rollout_percentage',
        passed: rolloutPassed,
        details: `Rollout: ${feature.rolloutPercentage}%, User hash: ${userIdHash.toFixed(2)}`,
      });
    }
    
    // Dependencies check
    if (feature.dependencies && feature.dependencies.length > 0) {
      const failedDeps = feature.dependencies.filter(dep => !this.isEnabled(dep, userContext));
      status.checks.push({
        check: 'dependencies',
        passed: failedDeps.length === 0,
        details: failedDeps.length > 0 ? `Missing dependencies: ${failedDeps.join(', ')}` : 'All dependencies satisfied',
      });
    }
    
    return status;
  }
  
  // Update feature configuration (admin only)
  updateFeature(featureKey, updates) {
    if (!this.featureConfig[featureKey]) {
      throw new Error(`Feature ${featureKey} not found`);
    }
    
    // Prevent updating certain fields
    const immutableFields = ['name', 'description', 'key'];
    immutableFields.forEach(field => {
      if (updates[field]) {
        throw new Error(`Field ${field} cannot be updated`);
      }
    });
    
    // Update feature
    this.featureConfig[featureKey] = {
      ...this.featureConfig[featureKey],
      ...updates,
    };
    
    // Update the features map
    if (updates.enabled !== undefined) {
      if (updates.enabled) {
        this.features.add(featureKey);
      } else {
        this.features.delete(featureKey);
      }
    }
    
    return this.featureConfig[featureKey];
  }
  
  // Enable/disable feature for A/B testing
  toggleFeature(featureKey, enabled) {
    return this.updateFeature(featureKey, { enabled });
  }
  
  // Set rollout percentage
  setRolloutPercentage(featureKey, percentage) {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }
    
    return this.updateFeature(featureKey, { rolloutPercentage: percentage });
  }
  
  // Add new feature
  addFeature(featureKey, config) {
    if (this.featureConfig[featureKey]) {
      throw new Error(`Feature ${featureKey} already exists`);
    }
    
    this.featureConfig[featureKey] = {
      name: config.name,
      description: config.description,
      enabled: config.enabled || false,
      rolloutPercentage: config.rolloutPercentage || 0,
      minUserTier: config.minUserTier || 'free',
      regions: config.regions || ['all'],
      dependencies: config.dependencies || [],
      settings: config.settings || {},
    };
    
    if (config.enabled) {
      this.features.add(featureKey);
    }
    
    return this.featureConfig[featureKey];
  }
  
  // Helper method to hash strings for consistent rollout
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash % 100);
  }
  
  // Export feature flags for frontend
  exportForFrontend(userContext = {}) {
    const flags = {};
    
    for (const [featureKey] of Object.entries(this.featureConfig)) {
      flags[featureKey] = this.isEnabled(featureKey, userContext);
    }
    
    return flags;
  }
  
  // Get feature usage statistics
  getUsageStats() {
    const stats = {
      totalFeatures: Object.keys(this.featureConfig).length,
      enabledFeatures: Array.from(this.features).length,
      byTier: {},
      byRegion: {},
    };
    
    // Count features by minimum tier
    for (const feature of Object.values(this.featureConfig)) {
      const tier = feature.minUserTier;
      stats.byTier[tier] = (stats.byTier[tier] || 0) + 1;
    }
    
    return stats;
  }
}

// Singleton instance
const features = new Features();

module.exports = features;

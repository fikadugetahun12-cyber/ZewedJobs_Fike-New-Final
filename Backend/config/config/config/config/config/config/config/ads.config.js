const envConfig = require('./env');

/**
 * Advertisement Configuration for Zewed Jobs
 * Manages ads, campaigns, targeting, and monetization
 */

const adsConfig = {
  // Ad types supported
  adTypes: {
    BANNER: {
      id: 'banner',
      name: 'Banner Ad',
      description: 'Display banner advertisements',
      dimensions: [
        { width: 728, height: 90, name: 'Leaderboard' },
        { width: 300, height: 250, name: 'Medium Rectangle' },
        { width: 300, height: 600, name: 'Half Page' },
        { width: 320, height: 50, name: 'Mobile Banner' },
        { width: 250, height: 250, name: 'Square' },
      ],
      formats: ['jpg', 'png', 'gif', 'webp'],
      maxSize: 200, // KB
      animationLimit: 15, // seconds
    },
    
    SIDEBAR: {
      id: 'sidebar',
      name: 'Sidebar Ad',
      description: 'Sidebar advertisement placements',
      dimensions: [
        { width: 300, height: 600, name: 'Tall Sidebar' },
        { width: 300, height: 250, name: 'Square Sidebar' },
      ],
      formats: ['jpg', 'png', 'webp'],
      maxSize: 150,
      animationLimit: 0, // No animation
    },
    
    INTERSTITIAL: {
      id: 'interstitial',
      name: 'Interstitial Ad',
      description: 'Full-screen ads between content',
      dimensions: [
        { width: 1200, height: 628, name: 'Desktop Interstitial' },
        { width: 720, height: 1280, name: 'Mobile Interstitial' },
      ],
      formats: ['jpg', 'png', 'gif', 'mp4'],
      maxSize: 500,
      animationLimit: 30,
      frequencyCap: 3, // Max per hour per user
    },
    
    NATIVE: {
      id: 'native',
      name: 'Native Ad',
      description: 'Ads that match platform content',
      dimensions: [
        { width: 1200, height: 627, name: 'Featured Image' },
        { width: 150, height: 150, name: 'Thumbnail' },
      ],
      formats: ['jpg', 'png'],
      maxSize: 100,
      animationLimit: 0,
    },
    
    VIDEO: {
      id: 'video',
      name: 'Video Ad',
      description: 'Video advertisements',
      dimensions: [
        { width: 1280, height: 720, name: 'HD Video' },
        { width: 854, height: 480, name: 'SD Video' },
        { width: 640, height: 360, name: 'Mobile Video' },
      ],
      formats: ['mp4', 'webm'],
      maxSize: 5000, // 5MB
      durationLimit: 30, // seconds
      skipableAfter: 5, // seconds
    },
  },
  
  // Ad positions on the platform
  positions: {
    HOME_TOP: {
      id: 'home_top',
      name: 'Homepage Top Banner',
      description: 'Top banner on homepage',
      adTypes: ['banner'],
      priceMultiplier: 1.5,
      priority: 10,
    },
    
    HOME_SIDEBAR: {
      id: 'home_sidebar',
      name: 'Homepage Sidebar',
      description: 'Sidebar on homepage',
      adTypes: ['sidebar', 'native'],
      priceMultiplier: 1.0,
      priority: 8,
    },
    
    JOB_LISTING_TOP: {
      id: 'job_listing_top',
      name: 'Job Listing Top',
      description: 'Top of job listing pages',
      adTypes: ['banner'],
      priceMultiplier: 1.2,
      priority: 9,
    },
    
    JOB_DETAIL_SIDEBAR: {
      id: 'job_detail_sidebar',
      name: 'Job Detail Sidebar',
      description: 'Sidebar on job detail pages',
      adTypes: ['sidebar', 'native'],
      priceMultiplier: 1.0,
      priority: 7,
    },
    
    SEARCH_RESULTS: {
      id: 'search_results',
      name: 'Search Results',
      description: 'Ads in search results',
      adTypes: ['native'],
      priceMultiplier: 1.3,
      priority: 8,
    },
    
    PROFILE_INTERSTITIAL: {
      id: 'profile_interstitial',
      name: 'Profile Interstitial',
      description: 'Full-screen ad on profile view',
      adTypes: ['interstitial'],
      priceMultiplier: 2.0,
      priority: 6,
      frequencyCap: 2,
    },
    
    MOBILE_APP: {
      id: 'mobile_app',
      name: 'Mobile App',
      description: 'Ads in mobile application',
      adTypes: ['banner', 'interstitial', 'video'],
      priceMultiplier: 1.4,
      priority: 9,
    },
    
    EMAIL_NEWSLETTER: {
      id: 'email_newsletter',
      name: 'Email Newsletter',
      description: 'Ads in email newsletters',
      adTypes: ['banner', 'native'],
      priceMultiplier: 1.1,
      priority: 5,
    },
  },
  
  // Pricing models
  pricingModels: {
    CPC: {
      id: 'cpc',
      name: 'Cost Per Click',
      description: 'Pay for each click on the ad',
      baseRate: envConfig.AD_CPC_RATE || 0.5, // ETB per click
      minBudget: 100, // ETB
      billingIncrement: 1,
      tracking: ['clicks', 'ctr'],
    },
    
    CPM: {
      id: 'cpm',
      name: 'Cost Per Mille',
      description: 'Pay per 1000 impressions',
      baseRate: envConfig.AD_CPM_RATE || 5, // ETB per 1000 impressions
      minBudget: 500, // ETB
      billingIncrement: 1000,
      tracking: ['impressions', 'viewability'],
    },
    
    CPA: {
      id: 'cpa',
      name: 'Cost Per Action',
      description: 'Pay for specific actions (signups, purchases)',
      baseRate: 50, // ETB per action
      minBudget: 1000, // ETB
      billingIncrement: 1,
      tracking: ['conversions', 'conversion_rate'],
    },
    
    FIXED: {
      id: 'fixed',
      name: 'Fixed Price',
      description: 'Fixed price for a time period',
      baseRate: 1000, // ETB per day
      minBudget: 1000, // ETB
      billingIncrement: 1,
      tracking: ['impressions', 'clicks', 'duration'],
    },
  },
  
  // Targeting options
  targeting: {
    demographics: {
      age: {
        ranges: ['18-24', '25-34', '35-44', '45-54', '55+'],
      },
      gender: {
        options: ['male', 'female', 'other'],
      },
      education: {
        levels: ['high_school', 'diploma', 'bachelors', 'masters', 'phd'],
      },
      income: {
        ranges: ['<5000', '5000-10000', '10000-20000', '20000-50000', '50000+'],
      },
    },
    
    geographic: {
      regions: [
        'addis_ababa',
        'oromia',
        'amhara',
        'tigray',
        'snnpr',
        'afar',
        'somali',
        'benishangul_gumuz',
        'gambella',
        'harari',
        'dire_dawa',
      ],
      cities: [
        'addis_ababa',
        'dire_dawa',
        'bahir_dar',
        'gondar',
        'mekele',
        'hawassa',
        'jimma',
        'bishoftu',
        'adama',
        'shashamane',
      ],
    },
    
    interests: {
      job_categories: [
        'technology',
        'finance',
        'healthcare',
        'education',
        'engineering',
        'marketing',
        'sales',
        'human_resources',
        'administration',
        'customer_service',
      ],
      skills: [
        'programming',
        'design',
        'management',
        'analytics',
        'communication',
        'leadership',
      ],
      industries: [
        'it_software',
        'banking_finance',
        'healthcare',
        'education',
        'manufacturing',
        'retail',
        'construction',
        'agriculture',
        'telecommunications',
        'hospitality',
      ],
    },
    
    behavioral: {
      job_search_frequency: ['daily', 'weekly', 'monthly', 'rarely'],
      application_rate: ['high', 'medium', 'low'],
      profile_completeness: ['complete', 'partial', 'basic'],
      membership_tier: ['free', 'basic', 'premium', 'enterprise'],
    },
    
    device: {
      types: ['desktop', 'mobile', 'tablet'],
      platforms: ['web', 'android', 'ios'],
      browsers: ['chrome', 'firefox', 'safari', 'edge'],
    },
  },
  
  // Campaign settings
  campaign: {
    // Duration options (in days)
    durationOptions: [1, 7, 14, 30, 60, 90],
    
    // Budget options (in ETB)
    budgetTiers: {
      small: { min: 100, max: 1000 },
      medium: { min: 1000, max: 10000 },
      large: { min: 10000, max: 100000 },
      enterprise: { min: 100000, max: 1000000 },
    },
    
    // Performance metrics
    metrics: {
      impressions: { target: 10000, weight: 0.3 },
      clicks: { target: 100, weight: 0.4 },
      ctr: { target: 1.0, weight: 0.2 }, // Percentage
      conversions: { target: 10, weight: 0.5 },
      viewability: { target: 70, weight: 0.2 }, // Percentage
      engagement: { target: 30, weight: 0.3 }, // Seconds
    },
    
    // Quality standards
    quality: {
      minCTR: 0.1, // Minimum click-through rate
      maxFrequency: 10, // Max impressions per user per day
      viewabilityThreshold: 50, // Minimum viewability percentage
      brandSafety: true, // Content moderation
      adQualityScore: 0.7, // Minimum quality score
    },
    
    // Automatic optimization
    optimization: {
      enabled: true,
      checkInterval: 3600, // Check every hour
      actions: ['adjust_bid', 'pause_poor_performing', 'increase_budget_top_performing'],
      thresholds: {
        poorPerformance: 0.3, // 30% below target
        excellentPerformance: 1.3, // 30% above target
      },
    },
  },
  
  // Ad refresh settings
  refresh: {
    interval: envConfig.AD_REFRESH_INTERVAL || 30000, // milliseconds
    strategy: 'rotational', // rotational, sequential, random
    maxImpressions: envConfig.AD_MAX_IMPRESSIONS || 100000,
    
    // Rotation algorithms
    algorithms: {
      ROUND_ROBIN: 'round_robin',
      WEIGHTED_RANDOM: 'weighted_random',
      PERFORMANCE_BASED: 'performance_based',
    },
  },
  
  // Ad content policies
  policies: {
    prohibitedContent: [
      'illegal_products',
      'tobacco_alcohol',
      'gambling',
      'adult_content',
      'hate_speech',
      'misinformation',
      'malware',
      'unfair_competition',
    ],
    
    requiredDisclosures: [
      'sponsored_content',
      'affiliate_links',
      'data_collection',
      'tracking_cookies',
    ],
    
    creativeGuidelines: {
      maxTextLength: 100,
      requiredElements: ['brand_name', 'call_to_action'],
      prohibitedElements: ['auto_play_sound', 'excessive_animation'],
      colorContrast: 4.5, // WCAG AA standard
    },
  },
  
  // Configuration methods
  getAdTypeConfig: (type) => {
    return adsConfig.adTypes[type.toUpperCase()] || null;
  },
  
  getPositionConfig: (position) => {
    return adsConfig.positions[position.toUpperCase()] || null;
  },
  
  getPricingModelConfig: (model) => {
    return adsConfig.pricingModels[model.toUpperCase()] || null;
  },
  
  // Calculate ad price
  calculatePrice: (model, baseAmount, position = null, targeting = {}) => {
    const modelConfig = adsConfig.getPricingModelConfig(model);
    if (!modelConfig) {
      throw new Error(`Invalid pricing model: ${model}`);
    }
    
    let price = baseAmount;
    
    // Apply position multiplier
    if (position) {
      const positionConfig = adsConfig.getPositionConfig(position);
      if (positionConfig) {
        price *= positionConfig.priceMultiplier;
      }
    }
    
    // Apply targeting multipliers
    if (targeting.premiumAudience) {
      price *= 1.5;
    }
    
    if (targeting.geographic) {
      // Higher prices for major cities
      const premiumCities = ['addis_ababa', 'dire_dawa', 'bahir_dar'];
      if (premiumCities.includes(targeting.geographic.city)) {
        price *= 1.2;
      }
    }
    
    // Round to nearest billing increment
    price = Math.ceil(price / modelConfig.billingIncrement) * modelConfig.billingIncrement;
    
    return Math.max(price, modelConfig.minBudget);
  },
  
  // Generate targeting options
  generateTargetingOptions: (audience) => {
    const options = {};
    
    if (audience.demographics) {
      options.demographics = {};
      
      if (audience.demographics.age) {
        options.demographics.age = adsConfig.targeting.demographics.age.ranges;
      }
      
      if (audience.demographics.gender) {
        options.demographics.gender = adsConfig.targeting.demographics.gender.options;
      }
    }
    
    if (audience.geographic) {
      options.geographic = {
        regions: adsConfig.targeting.geographic.regions,
        cities: adsConfig.targeting.geographic.cities,
      };
    }
    
    if (audience.interests) {
      options.interests = {};
      
      if (audience.interests.job_categories) {
        options.interests.job_categories = adsConfig.targeting.interests.job_categories;
      }
      
      if (audience.interests.industries) {
        options.interests.industries = adsConfig.targeting.interests.industries;
      }
    }
    
    return options;
  },
  
  // Validate ad creative
  validateCreative: (adType, creative) => {
    const typeConfig = adsConfig.getAdTypeConfig(adType);
    const errors = [];
    
    if (!typeConfig) {
      errors.push(`Invalid ad type: ${adType}`);
      return { valid: false, errors };
    }
    
    // Check dimensions
    if (creative.dimensions) {
      const validDimension = typeConfig.dimensions.some(dim => 
        dim.width === creative.dimensions.width && 
        dim.height === creative.dimensions.height
      );
      
      if (!validDimension) {
        errors.push(`Invalid dimensions for ${adType}. Allowed: ${typeConfig.dimensions.map(d => `${d.width}x${d.height}`).join(', ')}`);
      }
    }
    
    // Check file format
    if (creative.format && !typeConfig.formats.includes(creative.format.toLowerCase())) {
      errors.push(`Invalid file format. Allowed: ${typeConfig.formats.join(', ')}`);
    }
    
    // Check file size
    if (creative.size && creative.size > typeConfig.maxSize * 1024) {
      errors.push(`File size exceeds limit of ${typeConfig.maxSize}KB`);
    }
    
    // Check animation duration
    if (creative.animationDuration && creative.animationDuration > typeConfig.animationLimit) {
      errors.push(`Animation exceeds limit of ${typeConfig.animationLimit} seconds`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings: errors.length > 0 ? [] : ['Creative validation passed'],
    };
  },
  
  // Get available positions for ad type
  getAvailablePositions: (adType) => {
    return Object.values(adsConfig.positions)
      .filter(position => position.adTypes.includes(adType))
      .map(position => ({
        id: position.id,
        name: position.name,
        description: position.description,
        priceMultiplier: position.priceMultiplier,
        priority: position.priority,
      }));
  },
  
  // Calculate campaign performance score
  calculatePerformanceScore: (metrics) => {
    let score = 0;
    let totalWeight = 0;
    
    for (const [metric, config] of Object.entries(adsConfig.campaign.metrics)) {
      if (metrics[metric] !== undefined) {
        const achievement = metrics[metric] / config.target;
        score += achievement * config.weight;
        totalWeight += config.weight;
      }
    }
    
    // Normalize score
    if (totalWeight > 0) {
      score = (score / totalWeight) * 100;
    }
    
    return Math.min(Math.max(score, 0), 100);
  },
  
  // Get ad rotation algorithm
  getRotationAlgorithm: (campaigns, currentAlgorithm = 'performance_based') => {
    switch (currentAlgorithm) {
      case 'round_robin':
        return this.roundRobinRotation(campaigns);
        
      case 'weighted_random':
        return this.weightedRandomRotation(campaigns);
        
      case 'performance_based':
        return this.performanceBasedRotation(campaigns);
        
      default:
        return this.performanceBasedRotation(campaigns);
    }
  },
  
  // Rotation algorithms
  roundRobinRotation: (campaigns) => {
    // Simple round-robin rotation
    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    if (activeCampaigns.length === 0) return null;
    
    // Get campaign with oldest last shown time
    return activeCampaigns.reduce((oldest, campaign) => {
      return (!oldest.lastShown || campaign.lastShown < oldest.lastShown) 
        ? campaign 
        : oldest;
    });
  },
  
  weightedRandomRotation: (campaigns) => {
    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    if (activeCampaigns.length === 0) return null;
    
    // Weight by budget remaining
    const totalBudget = activeCampaigns.reduce((sum, c) => sum + c.budgetRemaining, 0);
    const weights = activeCampaigns.map(c => c.budgetRemaining / totalBudget);
    
    // Select based on weights
    let random = Math.random();
    for (let i = 0; i < activeCampaigns.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return activeCampaigns[i];
      }
    }
    
    return activeCampaigns[0];
  },
  
  performanceBasedRotation: (campaigns) => {
    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    if (activeCampaigns.length === 0) return null;
    
    // Calculate performance scores
    const scoredCampaigns = activeCampaigns.map(campaign => {
      const score = this.calculatePerformanceScore(campaign.metrics || {});
      return { ...campaign, performanceScore: score };
    });
    
    // Sort by performance score (descending)
    scoredCampaigns.sort((a, b) => b.performanceScore - a.performanceScore);
    
    // Return top performing campaign
    return scoredCampaigns[0];
  },
  
  // Get reporting metrics
  getReportingMetrics: (timeframe = 'daily') => {
    const baseMetrics = [
      'impressions',
      'clicks',
      'ctr',
      'conversions',
      'spend',
      'cpc',
      'cpm',
      'roi',
    ];
    
    const timeframeMetrics = {
      daily: [...baseMetrics, 'daily_budget_usage'],
      weekly: [...baseMetrics, 'weekly_trend', 'day_of_week_performance'],
      monthly: [...baseMetrics, 'monthly_trend', 'campaign_comparison'],
    };
    
    return timeframeMetrics[timeframe] || baseMetrics;
  },
};

module.exports = adsConfig;

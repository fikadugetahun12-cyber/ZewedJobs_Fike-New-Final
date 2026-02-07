const envConfig = require('./env');

/**
 * Social Media Configuration for Zewed Jobs
 * Integration with Google, Facebook, LinkedIn for authentication and sharing
 */

const socialConfig = {
  // Google OAuth Configuration
  google: {
    enabled: !!envConfig.GOOGLE_CLIENT_ID && !!envConfig.GOOGLE_CLIENT_SECRET,
    clientId: envConfig.GOOGLE_CLIENT_ID,
    clientSecret: envConfig.GOOGLE_CLIENT_SECRET,
    callbackUrl: `${envConfig.SERVER_URL}/api/v1/auth/google/callback`,
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenURL: 'https://oauth2.googleapis.com/token',
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
    
    // Google Jobs API (for job posting to Google)
    jobsAPI: {
      enabled: false, // Requires special approval from Google
      publisherId: null,
      apiKey: null,
      endpoint: 'https://jobs.googleapis.com/v4',
    },
  },
  
  // Facebook OAuth Configuration
  facebook: {
    enabled: !!envConfig.FACEBOOK_APP_ID && !!envConfig.FACEBOOK_APP_SECRET,
    appId: envConfig.FACEBOOK_APP_ID,
    appSecret: envConfig.FACEBOOK_APP_SECRET,
    callbackUrl: `${envConfig.SERVER_URL}/api/v1/auth/facebook/callback`,
    scope: ['email', 'public_profile'],
    profileFields: ['id', 'email', 'name', 'picture.type(large)'],
    authorizationURL: 'https://www.facebook.com/v12.0/dialog/oauth',
    tokenURL: 'https://graph.facebook.com/v12.0/oauth/access_token',
    userProfileURL: 'https://graph.facebook.com/v12.0/me',
    
    // Facebook Jobs Integration
    jobsIntegration: {
      enabled: false,
      pageId: null,
      accessToken: null,
    },
    
    // Facebook Marketing API (for job ads)
    marketingAPI: {
      enabled: false,
      adAccountId: null,
      accessToken: null,
    },
  },
  
  // LinkedIn OAuth Configuration
  linkedin: {
    enabled: !!envConfig.LINKEDIN_CLIENT_ID && !!envConfig.LINKEDIN_CLIENT_SECRET,
    clientId: envConfig.LINKEDIN_CLIENT_ID,
    clientSecret: envConfig.LINKEDIN_CLIENT_SECRET,
    callbackUrl: `${envConfig.SERVER_URL}/api/v1/auth/linkedin/callback`,
    scope: ['r_liteprofile', 'r_emailaddress'],
    authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
    userProfileURL: 'https://api.linkedin.com/v2/me',
    userEmailURL: 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
    
    // LinkedIn Job Posting API
    jobsAPI: {
      enabled: false,
      organizationId: null,
      accessToken: null,
      endpoint: 'https://api.linkedin.com/v2',
    },
  },
  
  // Social sharing configuration
  sharing: {
    platforms: {
      facebook: {
        shareUrl: 'https://www.facebook.com/sharer/sharer.php',
        appId: envConfig.FACEBOOK_APP_ID,
      },
      twitter: {
        shareUrl: 'https://twitter.com/intent/tweet',
      },
      linkedin: {
        shareUrl: 'https://www.linkedin.com/sharing/share-offsite/',
      },
      telegram: {
        shareUrl: 'https://t.me/share/url',
      },
      whatsapp: {
        shareUrl: 'https://api.whatsapp.com/send',
      },
    },
    
    // Default sharing messages
    messages: {
      job: {
        en: 'Check out this job opportunity on Zewed Jobs: {jobTitle} at {company} in {location}. Apply now!',
        am: 'ይህን የስራ እድል በZewed Jobs ይመልከቱ: {jobTitle} በ{company} በ{location}። አሁን ያመልክቱ!',
      },
      course: {
        en: 'Enroll in this course on Zewed Jobs: {courseName}. Enhance your skills today!',
        am: 'በዚህ ኮርስ በZewed Jobs ይመዝገቡ: {courseName}። አሁን ችሎታዎችዎን ያሳድጉ!',
      },
      event: {
        en: 'Join this event on Zewed Jobs: {eventName} on {date}. Register now!',
        am: 'በዚህ ክስተት በZewed Jobs ይሳተፉ: {eventName} በ{date}። አሁን ይመዝገቡ!',
      },
    },
    
    // Hashtags for social media
    hashtags: {
      default: ['#ZewedJobs', '#EthiopiaJobs', '#CareerEthiopia'],
      jobs: ['#JobOpportunity', '#Hiring', '#Career'],
      courses: ['#OnlineCourses', '#SkillDevelopment', '#Learning'],
      events: ['#Networking', '#CareerEvent', '#Workshop'],
    },
  },
  
  // Social login configuration
  socialLogin: {
    // Auto-fill user data from social profiles
    autoFill: {
      enabled: true,
      fields: ['firstName', 'lastName', 'email', 'profilePicture'],
    },
    
    // Merge social accounts with existing accounts
    accountLinking: {
      enabled: true,
      requireConfirmation: true,
    },
    
    // Terms and conditions for social login
    terms: {
      privacyPolicy: 'https://zewedjobs.com/privacy',
      termsOfService: 'https://zewedjobs.com/terms',
    },
  },
  
  // Social analytics configuration
  analytics: {
    trackShares: true,
    trackLogins: true,
    trackConversions: true,
    
    // UTM parameters for tracking
    utm: {
      source: 'zewedjobs',
      medium: 'social',
      campaigns: {
        job_share: 'job_share',
        course_share: 'course_share',
        event_share: 'event_share',
        social_login: 'social_login',
      },
    },
  },
  
  // Configuration methods
  isPlatformEnabled: (platform) => {
    return socialConfig[platform]?.enabled || false;
  },
  
  getPlatformConfig: (platform) => {
    if (!socialConfig[platform]) {
      throw new Error(`Unsupported social platform: ${platform}`);
    }
    
    if (!socialConfig[platform].enabled) {
      throw new Error(`${platform} integration is not enabled`);
    }
    
    return socialConfig[platform];
  },
  
  getShareUrl: (platform, params) => {
    const config = socialConfig.sharing.platforms[platform];
    if (!config) {
      throw new Error(`Unsupported sharing platform: ${platform}`);
    }
    
    const urlParams = new URLSearchParams(params);
    return `${config.shareUrl}?${urlParams.toString()}`;
  },
  
  generateShareMessage: (type, language = 'en', data = {}) => {
    const messageTemplate = socialConfig.sharing.messages[type]?.[language] || 
                           socialConfig.sharing.messages[type]?.en ||
                           'Check this out on Zewed Jobs!';
    
    // Replace placeholders with actual data
    return messageTemplate.replace(/{(\w+)}/g, (match, key) => {
      return data[key] || match;
    });
  },
  
  // Generate UTM parameters
  generateUTM: (campaign, content = null, term = null) => {
    const params = {
      utm_source: socialConfig.analytics.utm.source,
      utm_medium: socialConfig.analytics.utm.medium,
      utm_campaign: campaign,
    };
    
    if (content) params.utm_content = content;
    if (term) params.utm_term = term;
    
    return params;
  },
  
  // Get available social login options
  getAvailableLoginOptions: () => {
    const options = [];
    
    if (socialConfig.google.enabled) options.push('google');
    if (socialConfig.facebook.enabled) options.push('facebook');
    if (socialConfig.linkedin.enabled) options.push('linkedin');
    
    return options;
  },
  
  // Validate social token
  validateToken: async (platform, token) => {
    // This would typically make an API call to validate the token
    // For now, return a mock validation
    return {
      valid: true,
      platform,
      expiresAt: Date.now() + 3600000, // 1 hour from now
    };
  },
  
  // Get user profile from social platform
  getUserProfile: async (platform, accessToken) => {
    const config = socialConfig.getPlatformConfig(platform);
    
    // This would make actual API calls to get user profile
    // For now, return mock data
    switch (platform) {
      case 'google':
        return {
          id: 'google_123456',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          profilePicture: 'https://example.com/photo.jpg',
          locale: 'en',
          verified: true,
        };
      case 'facebook':
        return {
          id: 'facebook_123456',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          profilePicture: 'https://example.com/photo.jpg',
        };
      case 'linkedin':
        return {
          id: 'linkedin_123456',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          headline: 'Software Engineer',
          profilePicture: 'https://example.com/photo.jpg',
        };
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  },
};

module.exports = socialConfig;

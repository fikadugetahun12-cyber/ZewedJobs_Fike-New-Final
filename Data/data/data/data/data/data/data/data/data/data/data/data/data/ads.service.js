// services/ads/ads.service.js
class AdsService {
  constructor() {
    this.ads = require('../../data/ads.json');
    this.positions = this.ads.adPositions;
    this.campaigns = this.ads.activeCampaigns;
  }

  /**
   * Get ads for specific position with targeting
   */
  getAdsForPosition(positionId, userContext = {}) {
    return this.campaigns
      .filter(campaign => 
        campaign.position === positionId &&
        campaign.status === 'active' &&
        this.checkTargeting(campaign, userContext)
      )
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if user matches ad targeting criteria
   */
  checkTargeting(campaign, userContext) {
    const targeting = campaign.targeting;
    
    // Check geography
    if (targeting.geography && !targeting.geography.includes('all')) {
      if (!userContext.country || !targeting.geography.includes(userContext.country)) {
        return false;
      }
    }

    // Check audience
    if (targeting.audience && userContext.userType) {
      if (!targeting.audience.includes(userContext.userType)) {
        return false;
      }
    }

    // Check schedule
    if (targeting.schedule) {
      const now = new Date();
      const start = new Date(targeting.schedule.startDate);
      const end = new Date(targeting.schedule.endDate);
      
      if (now < start || now > end) return false;
      
      const dayOfWeek = now.getDay(); // 0-6, Sunday=0
      const hour = now.getHours();
      
      if (targeting.schedule.daysOfWeek && 
          !targeting.schedule.daysOfWeek.includes(dayOfWeek + 1)) {
        return false;
      }
      
      if (targeting.schedule.hours && 
          !targeting.schedule.hours.includes(hour)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Record ad impression
   */
  recordImpression(adId) {
    const campaign = this.campaigns.find(c => c.id === adId);
    if (campaign) {
      campaign.metrics.impressions++;
      this.updateCTR(campaign);
    }
  }

  /**
   * Record ad click
   */
  recordClick(adId) {
    const campaign = this.campaigns.find(c => c.id === adId);
    if (campaign) {
      campaign.metrics.clicks++;
      this.updateCTR(campaign);
    }
  }

  /**
   * Update CTR for campaign
   */
  updateCTR(campaign) {
    if (campaign.metrics.impressions > 0) {
      campaign.metrics.ctr = 
        (campaign.metrics.clicks / campaign.metrics.impressions) * 100;
    }
  }

  /**
   * Get available ad positions
   */
  getAvailablePositions() {
    return this.positions.filter(pos => pos.available);
  }

  /**
   * Create featured job listing
   */
  createFeaturedListing(jobId, durationDays = 30, priority = 3) {
    return {
      id: `featured-${Date.now()}`,
      jobId,
      type: 'featured-listing',
      priority,
      duration: durationDays,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    };
  }
}

module.exports = new AdsService();

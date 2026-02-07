import Ad from '../../models/Ad.js';
import Job from '../../models/Job.js';
import ApiError from '../../utils/apiError.js';
import logger from '../../utils/logger.js';

/**
 * Ad Service - Handles all ad placement, featured listings, and promotion logic
 */
class AdService {
  /**
   * Create a new ad for job promotion
   * @param {Object} adData - Ad data including jobId, advertiserId, type, etc.
   * @returns {Promise<Object>} Created ad
   */
  async createAd(adData) {
    try {
      // Validate job exists
      const job = await Job.findById(adData.job);
      if (!job) {
        throw new ApiError(404, 'Job not found');
      }

      // Check if job is already promoted
      const existingAd = await Ad.findOne({
        job: adData.job,
        isActive: true,
        endDate: { $gt: new Date() }
      });

      if (existingAd) {
        throw new ApiError(400, 'This job already has an active promotion');
      }

      // Set default start date if not provided
      if (!adData.startDate) {
        adData.startDate = new Date();
      }

      // Calculate cost based on ad type and duration
      adData.cost = this.calculateAdCost(
        adData.type,
        adData.startDate,
        adData.endDate,
        adData.placement
      );

      const ad = new Ad(adData);
      await ad.save();

      // Update job to featured if type is 'featured'
      if (adData.type === 'featured') {
        await Job.findByIdAndUpdate(adData.job, { isFeatured: true });
      }

      logger.info(`Ad created successfully: ${ad._id}`);
      return ad;
    } catch (error) {
      logger.error('Error creating ad:', error);
      throw error;
    }
  }

  /**
   * Get active ads for a specific placement
   * @param {string} placement - Placement location (homepage, search, etc.)
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} List of active ads
   */
  async getActiveAds(placement, filters = {}) {
    try {
      const query = {
        placement,
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        ...filters
      };

      const ads = await Ad.find(query)
        .populate('job', 'title company salary location')
        .populate('advertiser', 'name email')
        .sort({ priority: -1, createdAt: -1 })
        .limit(20);

      // Increment impressions for each ad
      await Promise.all(
        ads.map(ad => 
          Ad.findByIdAndUpdate(ad._id, { $inc: { impressions: 1 } })
        )
      );

      return ads;
    } catch (error) {
      logger.error('Error fetching active ads:', error);
      throw error;
    }
  }

  /**
   * Get featured jobs (priority ads)
   * @param {number} limit - Maximum number of featured jobs to return
   * @returns {Promise<Array>} Featured jobs
   */
  async getFeaturedJobs(limit = 10) {
    try {
      const featuredAds = await Ad.find({
        type: 'featured',
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      })
        .populate({
          path: 'job',
          match: { isActive: true, status: 'active' },
          populate: {
            path: 'company',
            select: 'name logo industry'
          }
        })
        .sort({ priority: -1, createdAt: -1 })
        .limit(limit);

      // Filter out ads with inactive jobs
      return featuredAds
        .filter(ad => ad.job)
        .map(ad => ({
          ...ad.job.toObject(),
          adPriority: ad.priority,
          adType: ad.type
        }));
    } catch (error) {
      logger.error('Error fetching featured jobs:', error);
      throw error;
    }
  }

  /**
   * Update ad details
   * @param {string} adId - Ad ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated ad
   */
  async updateAd(adId, updateData) {
    try {
      const ad = await Ad.findById(adId);
      if (!ad) {
        throw new ApiError(404, 'Ad not found');
      }

      // Recalculate cost if dates or type changed
      if (updateData.endDate || updateData.type || updateData.placement) {
        updateData.cost = this.calculateAdCost(
          updateData.type || ad.type,
          ad.startDate,
          updateData.endDate || ad.endDate,
          updateData.placement || ad.placement
        );
      }

      const updatedAd = await Ad.findByIdAndUpdate(
        adId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('job advertiser');

      logger.info(`Ad updated: ${adId}`);
      return updatedAd;
    } catch (error) {
      logger.error('Error updating ad:', error);
      throw error;
    }
  }

  /**
   * Deactivate an ad
   * @param {string} adId - Ad ID
   * @returns {Promise<Object>} Deactivated ad
   */
  async deactivateAd(adId) {
    try {
      const ad = await Ad.findById(adId);
      if (!ad) {
        throw new ApiError(404, 'Ad not found');
      }

      ad.isActive = false;
      await ad.save();

      // If it was a featured ad, update the job
      if (ad.type === 'featured') {
        await Job.findByIdAndUpdate(ad.job, { isFeatured: false });
      }

      logger.info(`Ad deactivated: ${adId}`);
      return ad;
    } catch (error) {
      logger.error('Error deactivating ad:', error);
      throw error;
    }
  }

  /**
   * Calculate ad cost based on type, duration, and placement
   * @private
   */
  calculateAdCost(type, startDate, endDate, placement) {
    const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    const baseRates = {
      standard: 10,
      featured: 50,
      sponsored: 100,
      premium: 200
    };

    const placementMultipliers = {
      homepage: 2.0,
      top: 3.0,
      search: 1.5,
      sidebar: 1.0,
      category: 1.2
    };

    const baseRate = baseRates[type] || baseRates.standard;
    const multiplier = placementMultipliers[placement] || 1.0;
    
    return baseRate * multiplier * durationDays;
  }

  /**
   * Get ad analytics for dashboard
   * @param {string} advertiserId - Advertiser ID
   * @param {Date} startDate - Start date for analytics
   * @param {Date} endDate - End date for analytics
   * @returns {Promise<Object>} Analytics data
   */
  async getAdAnalytics(advertiserId, startDate, endDate) {
    try {
      const ads = await Ad.find({
        advertiser: advertiserId,
        createdAt: { $gte: startDate, $lte: endDate }
      });

      const analytics = {
        totalAds: ads.length,
        activeAds: ads.filter(ad => ad.isActive).length,
        totalSpent: ads.reduce((sum, ad) => sum + ad.cost, 0),
        totalImpressions: ads.reduce((sum, ad) => sum + ad.impressions, 0),
        totalClicks: ads.reduce((sum, ad) => sum + ad.clicks, 0),
        byType: {},
        byPlacement: {}
      };

      // Group by type
      ads.forEach(ad => {
        analytics.byType[ad.type] = (analytics.byType[ad.type] || 0) + 1;
        analytics.byPlacement[ad.placement] = (analytics.byPlacement[ad.placement] || 0) + 1;
      });

      // Calculate CTR (Click-through rate)
      analytics.overallCTR = analytics.totalImpressions > 0 
        ? (analytics.totalClicks / analytics.totalImpressions) * 100 
        : 0;

      return analytics;
    } catch (error) {
      logger.error('Error fetching ad analytics:', error);
      throw error;
    }
  }
}

export default new AdService();

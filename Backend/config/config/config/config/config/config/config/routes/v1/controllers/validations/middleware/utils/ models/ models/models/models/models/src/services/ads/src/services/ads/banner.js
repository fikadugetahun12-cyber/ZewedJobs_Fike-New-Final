import Banner from '../../models/Banner.js';
import ApiError from '../../utils/apiError.js';
import logger from '../../utils/logger.js';
import { uploadToCloudinary } from '../../utils/fileUpload.js';

/**
 * Banner Service - Manages banners and front-page ad displays
 */
class BannerService {
  /**
   * Create a new banner
   * @param {Object} bannerData - Banner data
   * @param {Object} file - Banner image file
   * @returns {Promise<Object>} Created banner
   */
  async createBanner(bannerData, file) {
    try {
      // Upload banner image if provided
      if (file) {
        const uploadResult = await uploadToCloudinary(file, 'banners');
        bannerData.imageUrl = uploadResult.secure_url;
        bannerData.imagePublicId = uploadResult.public_id;
      }

      // Validate banner dates
      if (bannerData.startDate && bannerData.endDate) {
        const startDate = new Date(bannerData.startDate);
        const endDate = new Date(bannerData.endDate);
        
        if (endDate <= startDate) {
          throw new ApiError(400, 'End date must be after start date');
        }

        // Check for overlapping banners in same position
        const overlappingBanner = await Banner.findOne({
          position: bannerData.position,
          isActive: true,
          $or: [
            {
              startDate: { $lte: endDate },
              endDate: { $gte: startDate }
            }
          ]
        });

        if (overlappingBanner) {
          throw new ApiError(400, 'Another active banner exists in this position for the selected dates');
        }
      }

      const banner = new Banner(bannerData);
      await banner.save();

      logger.info(`Banner created: ${banner._id}`);
      return banner;
    } catch (error) {
      logger.error('Error creating banner:', error);
      throw error;
    }
  }

  /**
   * Get active banners for a specific position
   * @param {string} position - Banner position (hero, sidebar, footer, etc.)
   * @param {boolean} shuffle - Whether to shuffle results for rotation
   * @returns {Promise<Array>} Active banners
   */
  async getActiveBanners(position, shuffle = false) {
    try {
      const query = {
        position,
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      };

      let banners = await Banner.find(query)
        .sort({ priority: -1, createdAt: -1 })
        .limit(10);

      // Increment impressions for each banner
      await Promise.all(
        banners.map(banner => 
          Banner.findByIdAndUpdate(banner._id, { $inc: { impressions: 1 } })
        )
      );

      // Shuffle if needed for rotation
      if (shuffle && banners.length > 1) {
        banners = this.shuffleArray(banners);
      }

      return banners;
    } catch (error) {
      logger.error('Error fetching active banners:', error);
      throw error;
    }
  }

  /**
   * Get all banners with filtering
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Banners with pagination info
   */
  async getAllBanners(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      const query = { ...filters };

      const [banners, total] = await Promise.all([
        Banner.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Banner.countDocuments(query)
      ]);

      return {
        banners,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching banners:', error);
      throw error;
    }
  }

  /**
   * Update banner
   * @param {string} bannerId - Banner ID
   * @param {Object} updateData - Data to update
   * @param {Object} file - New banner image (optional)
   * @returns {Promise<Object>} Updated banner
   */
  async updateBanner(bannerId, updateData, file) {
    try {
      const banner = await Banner.findById(bannerId);
      if (!banner) {
        throw new ApiError(404, 'Banner not found');
      }

      // Handle image update
      if (file) {
        // Delete old image if exists
        if (banner.imagePublicId) {
          await deleteFromCloudinary(banner.imagePublicId);
        }

        // Upload new image
        const uploadResult = await uploadToCloudinary(file, 'banners');
        updateData.imageUrl = uploadResult.secure_url;
        updateData.imagePublicId = uploadResult.public_id;
      }

      const updatedBanner = await Banner.findByIdAndUpdate(
        bannerId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      logger.info(`Banner updated: ${bannerId}`);
      return updatedBanner;
    } catch (error) {
      logger.error('Error updating banner:', error);
      throw error;
    }
  }

  /**
   * Delete banner
   * @param {string} bannerId - Banner ID
   * @returns {Promise<Object>} Deleted banner
   */
  async deleteBanner(bannerId) {
    try {
      const banner = await Banner.findById(bannerId);
      if (!banner) {
        throw new ApiError(404, 'Banner not found');
      }

      // Delete image from cloud storage
      if (banner.imagePublicId) {
        await deleteFromCloudinary(banner.imagePublicId);
      }

      await Banner.findByIdAndDelete(bannerId);

      logger.info(`Banner deleted: ${bannerId}`);
      return { message: 'Banner deleted successfully' };
    } catch (error) {
      logger.error('Error deleting banner:', error);
      throw error;
    }
  }

  /**
   * Record banner click
   * @param {string} bannerId - Banner ID
   * @returns {Promise<void>}
   */
  async recordBannerClick(bannerId) {
    try {
      await Banner.findByIdAndUpdate(
        bannerId,
        { 
          $inc: { clicks: 1 },
          $set: { lastClickedAt: new Date() }
        }
      );
    } catch (error) {
      logger.error('Error recording banner click:', error);
      throw error;
    }
  }

  /**
   * Get banner statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Banner statistics
   */
  async getBannerStats(startDate, endDate) {
    try {
      const stats = await Banner.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$position',
            totalBanners: { $sum: 1 },
            totalImpressions: { $sum: '$impressions' },
            totalClicks: { $sum: '$clicks' },
            avgCTR: { 
              $avg: { 
                $cond: [
                  { $eq: ['$impressions', 0] },
                  0,
                  { $multiply: [{ $divide: ['$clicks', '$impressions'] }, 100] }
                ]
              }
            }
          }
        },
        {
          $project: {
            position: '$_id',
            totalBanners: 1,
            totalImpressions: 1,
            totalClicks: 1,
            avgCTR: { $round: ['$avgCTR', 2] },
            _id: 0
          }
        },
        {
          $sort: { totalImpressions: -1 }
        }
      ]);

      return stats;
    } catch (error) {
      logger.error('Error fetching banner stats:', error);
      throw error;
    }
  }

  /**
   * Shuffle array for banner rotation
   * @private
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export default new BannerService();

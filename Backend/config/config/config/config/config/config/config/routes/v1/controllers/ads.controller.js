const Ad = require('../models/Ad');
const AdCampaign = require('../models/AdCampaign');
const AdCreative = require('../models/AdCreative');
const AdImpression = require('../models/AdImpression');
const AdClick = require('../models/AdClick');
const AdConversion = require('../models/AdConversion');
const AdClient = require('../models/AdClient');
const User = require('../models/User');
const Company = require('../models/Company');
const adsConfig = require('../config/ads.config');
const features = require('../config/features');
const { ApiError } = require('../utils/error');
const { ApiResponse } = require('../utils/response');
const { paginate } = require('../utils/pagination');
const { cache } = require('../utils/cache');
const { sendEmail } = require('../utils/email');
const { uploadToCloudinary } = require('../utils/upload');
const { generateReport } = require('../utils/report');

/**
 * Ad Campaign Controller
 * Handles all business logic for advertisement management
 */
class AdsController {
  /**
   * Create a new ad campaign
   */
  async createCampaign(req, res, next) {
    try {
      const {
        name,
        type,
        clientId,
        budget,
        currency = 'ETB',
        startDate,
        endDate,
        targeting = {},
        status = 'draft',
        notes,
      } = req.body;

      const userId = req.user.id;

      // Check if user has permission to create campaign for this client
      if (!req.user.roles.includes('admin')) {
        const client = await AdClient.findById(clientId);
        if (!client || client.createdBy.toString() !== userId) {
          throw new ApiError(403, 'You do not have permission to create campaigns for this client');
        }
      }

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        throw new ApiError(400, 'End date must be after start date');
      }

      if (start < new Date()) {
        throw new ApiError(400, 'Start date cannot be in the past');
      }

      // Validate budget
      const minBudget = adsConfig.campaign.budgetTiers.small.min;
      if (budget < minBudget) {
        throw new ApiError(400, `Minimum budget is ${minBudget} ${currency}`);
      }

      // Create campaign
      const campaign = await AdCampaign.create({
        name,
        type,
        client: clientId,
        budget: {
          total: budget,
          spent: 0,
          remaining: budget,
          currency,
        },
        dates: {
          start: start,
          end: end,
          duration: Math.ceil((end - start) / (1000 * 60 * 60 * 24)), // days
        },
        targeting,
        status,
        notes,
        createdBy: userId,
        metrics: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          ctr: 0,
          cpc: 0,
          cpm: 0,
          roas: 0,
        },
      });

      // If status is active, schedule the campaign
      if (status === 'active') {
        await this.scheduleCampaign(campaign._id);
      }

      // Clear cache
      await cache.del('active_ads');
      await cache.del('campaigns_list');

      res.status(201).json(
        new ApiResponse(201, 'Campaign created successfully', { campaign })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all campaigns with filtering and pagination
   */
  async getAllCampaigns(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        type,
        clientId,
        startDate,
        endDate,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      // Build query
      const query = {};

      // Add status filter
      if (status) {
        query.status = status;
      }

      // Add type filter
      if (type) {
        query.type = type;
      }

      // Add client filter
      if (clientId) {
        query.client = clientId;
      }

      // Add date filters
      if (startDate || endDate) {
        query['dates.start'] = {};
        if (startDate) query['dates.start'].$gte = new Date(startDate);
        if (endDate) query['dates.start'].$lte = new Date(endDate);
      }

      // Add search
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
        ];
      }

      // Apply user restrictions if not admin
      if (!req.user.roles.includes('admin')) {
        if (req.user.roles.includes('advertiser')) {
          // Advertisers can only see their clients' campaigns
          const clients = await AdClient.find({ createdBy: req.user.id });
          query.client = { $in: clients.map(c => c._id) };
        } else {
          // Others can only see active campaigns
          query.status = 'active';
        }
      }

      // Get total count
      const total = await AdCampaign.countDocuments(query);

      // Get campaigns with pagination
      const campaigns = await AdCampaign.find(query)
        .populate('client', 'name email phone')
        .populate('createdBy', 'firstName lastName email')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      // Format response
      const formattedCampaigns = campaigns.map(campaign => ({
        ...campaign,
        progress: this.calculateCampaignProgress(campaign),
        performance: this.calculateCampaignPerformance(campaign.metrics),
      }));

      const pagination = {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      };

      res.status(200).json(
        new ApiResponse(200, 'Campaigns retrieved successfully', {
          campaigns: formattedCampaigns,
          pagination,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(req, res, next) {
    try {
      const { id } = req.params;

      const campaign = await AdCampaign.findById(id)
        .populate('client')
        .populate('createdBy', 'firstName lastName email')
        .populate('creatives')
        .lean();

      if (!campaign) {
        throw new ApiError(404, 'Campaign not found');
      }

      // Check permissions
      if (!this.hasCampaignAccess(req.user, campaign)) {
        throw new ApiError(403, 'You do not have access to this campaign');
      }

      // Get additional data
      const [impressions, clicks, conversions] = await Promise.all([
        AdImpression.countDocuments({ campaign: id }),
        AdClick.countDocuments({ campaign: id }),
        AdConversion.countDocuments({ campaign: id }),
      ]);

      // Calculate performance metrics
      const performance = {
        impressions,
        clicks,
        conversions,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? campaign.budget.spent / clicks : 0,
        cpm: impressions > 0 ? (campaign.budget.spent / impressions) * 1000 : 0,
        roas: campaign.budget.spent > 0 ? 
          (conversions * 100) / campaign.budget.spent : 0,
      };

      // Calculate progress
      const progress = this.calculateCampaignProgress(campaign);

      res.status(200).json(
        new ApiResponse(200, 'Campaign retrieved successfully', {
          campaign: {
            ...campaign,
            performance,
            progress,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const campaign = await AdCampaign.findById(id);
      
      if (!campaign) {
        throw new ApiError(404, 'Campaign not found');
      }

      // Check permissions
      if (!this.hasCampaignAccess(req.user, campaign)) {
        throw new ApiError(403, 'You do not have permission to update this campaign');
      }

      // Validate status changes
      if (updates.status && updates.status !== campaign.status) {
        if (!this.isValidStatusTransition(campaign.status, updates.status)) {
          throw new ApiError(400, `Invalid status transition from ${campaign.status} to ${updates.status}`);
        }
      }

      // Validate dates if being updated
      if (updates.startDate || updates.endDate) {
        const start = new Date(updates.startDate || campaign.dates.start);
        const end = new Date(updates.endDate || campaign.dates.end);
        
        if (start >= end) {
          throw new ApiError(400, 'End date must be after start date');
        }

        if (start < new Date()) {
          throw new ApiError(400, 'Start date cannot be in the past');
        }

        updates['dates.start'] = start;
        updates['dates.end'] = end;
        updates['dates.duration'] = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      }

      // Update campaign
      Object.keys(updates).forEach(key => {
        if (key === 'startDate' || key === 'endDate') return;
        campaign[key] = updates[key];
      });

      await campaign.save();

      // Handle status changes
      if (updates.status === 'active' && campaign.status !== 'active') {
        await this.scheduleCampaign(campaign._id);
      } else if (updates.status === 'paused' && campaign.status === 'active') {
        await this.pauseCampaign(campaign._id);
      }

      // Clear cache
      await cache.del(`campaign_${id}`);
      await cache.del('active_ads');

      res.status(200).json(
        new ApiResponse(200, 'Campaign updated successfully', { campaign })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(req, res, next) {
    try {
      const { id } = req.params;

      const campaign = await AdCampaign.findById(id);
      
      if (!campaign) {
        throw new ApiError(404, 'Campaign not found');
      }

      // Check if campaign can be deleted
      if (campaign.status === 'active') {
        throw new ApiError(400, 'Cannot delete an active campaign. Please pause it first.');
      }

      if (campaign.budget.spent > 0) {
        throw new ApiError(400, 'Cannot delete a campaign with spent budget');
      }

      // Delete related data
      await Promise.all([
        AdCreative.deleteMany({ campaign: id }),
        AdImpression.deleteMany({ campaign: id }),
        AdClick.deleteMany({ campaign: id }),
        AdConversion.deleteMany({ campaign: id }),
      ]);

      // Delete campaign
      await campaign.remove();

      // Clear cache
      await cache.del(`campaign_${id}`);
      await cache.del('campaigns_list');

      res.status(200).json(
        new ApiResponse(200, 'Campaign deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const campaign = await AdCampaign.findById(id);
      
      if (!campaign) {
        throw new ApiError(404, 'Campaign not found');
      }

      // Check permissions
      if (!this.hasCampaignAccess(req.user, campaign)) {
        throw new ApiError(403, 'You do not have permission to update this campaign');
      }

      // Validate status transition
      if (!this.isValidStatusTransition(campaign.status, status)) {
        throw new ApiError(400, `Invalid status transition from ${campaign.status} to ${status}`);
      }

      // Update status
      campaign.status = status;
      await campaign.save();

      // Handle status-specific actions
      switch (status) {
        case 'active':
          await this.scheduleCampaign(campaign._id);
          break;
        case 'paused':
          await this.pauseCampaign(campaign._id);
          break;
        case 'completed':
          await this.completeCampaign(campaign._id);
          break;
      }

      // Clear cache
      await cache.del(`campaign_${id}`);
      await cache.del('active_ads');

      res.status(200).json(
        new ApiResponse(200, 'Campaign status updated successfully', { campaign })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update campaign budget
   */
  async updateCampaignBudget(req, res, next) {
    try {
      const { id } = req.params;
      const { budget } = req.body;

      const campaign = await AdCampaign.findById(id);
      
      if (!campaign) {
        throw new ApiError(404, 'Campaign not found');
      }

      // Check permissions
      if (!this.hasCampaignAccess(req.user, campaign)) {
        throw new ApiError(403, 'You do not have permission to update this campaign');
      }

      // Validate budget
      if (budget <= campaign.budget.spent) {
        throw new ApiError(400, `Budget must be greater than spent amount (${campaign.budget.spent})`);
      }

      // Update budget
      campaign.budget.total = budget;
      campaign.budget.remaining = budget - campaign.budget.spent;
      await campaign.save();

      res.status(200).json(
        new ApiResponse(200, 'Campaign budget updated successfully', {
          budget: campaign.budget,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStatistics(req, res, next) {
    try {
      const { id } = req.params;
      const { startDate, endDate, interval = 'daily' } = req.query;

      const campaign = await AdCampaign.findById(id);
      
      if (!campaign) {
        throw new ApiError(404, 'Campaign not found');
      }

      // Check permissions
      if (!this.hasCampaignAccess(req.user, campaign)) {
        throw new ApiError(403, 'You do not have access to this campaign');
      }

      // Build date range
      const start = startDate ? new Date(startDate) : campaign.dates.start;
      const end = endDate ? new Date(endDate) : campaign.dates.end;

      // Get statistics by interval
      const statistics = await this.getStatisticsByInterval(id, start, end, interval);

      res.status(200).json(
        new ApiResponse(200, 'Statistics retrieved successfully', {
          campaignId: id,
          period: { start, end },
          interval,
          statistics,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(req, res, next) {
    try {
      const { id } = req.params;

      const campaign = await AdCampaign.findById(id)
        .populate('creatives')
        .lean();
      
      if (!campaign) {
        throw new ApiError(404, 'Campaign not found');
      }

      // Check permissions
      if (!this.hasCampaignAccess(req.user, campaign)) {
        throw new ApiError(403, 'You do not have access to this campaign');
      }

      // Get analytics data
      const analytics = await this.generateCampaignAnalytics(id);

      res.status(200).json(
        new ApiResponse(200, 'Analytics retrieved successfully', {
          campaign: campaign,
          analytics,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload ad creative
   */
  async uploadCreative(req, res, next) {
    try {
      const {
        campaignId,
        title,
        description,
        altText,
        callToAction,
        destinationUrl,
        isPrimary = false,
      } = req.body;

      const file = req.file;

      if (!file) {
        throw new ApiError(400, 'No file uploaded');
      }

      const campaign = await AdCampaign.findById(campaignId);
      
      if (!campaign) {
        throw new ApiError(404, 'Campaign not found');
      }

      // Check permissions
      if (!this.hasCampaignAccess(req.user, campaign)) {
        throw new ApiError(403, 'You do not have permission to upload creatives for this campaign');
      }

      // Validate file
      const validation = adsConfig.validateCreative(campaign.type, {
        dimensions: { width: file.width, height: file.height },
        format: file.mimetype.split('/')[1],
        size: file.size,
      });

      if (!validation.valid) {
        throw new ApiError(400, `Invalid creative: ${validation.errors.join(', ')}`);
      }

      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(file, 'ad_creatives');

      // Create creative
      const creative = await AdCreative.create({
        campaign: campaignId,
        title,
        description,
        altText,
        callToAction,
        destinationUrl,
        file: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          format: uploadResult.format,
          width: uploadResult.width,
          height: uploadResult.height,
          size: uploadResult.bytes,
        },
        isPrimary,
        status: 'active',
        createdBy: req.user.id,
      });

      // Update campaign with creative
      campaign.creatives.push(creative._id);
      if (isPrimary) {
        campaign.primaryCreative = creative._id;
      }
      await campaign.save();

      res.status(200).json(
        new ApiResponse(200, 'Creative uploaded successfully', { creative })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete ad creative
   */
  async deleteCreative(req, res, next) {
    try {
      const { id } = req.params;

      const creative = await AdCreative.findById(id).populate('campaign');
      
      if (!creative) {
        throw new ApiError(404, 'Creative not found');
      }

      // Check permissions
      if (!this.hasCampaignAccess(req.user, creative.campaign)) {
        throw new ApiError(403, 'You do not have permission to delete this creative');
      }

      // Check if it's the primary creative
      if (creative.isPrimary) {
        throw new ApiError(400, 'Cannot delete primary creative. Set another creative as primary first.');
      }

      // Delete from Cloudinary
      await uploadToCloudinary.delete(creative.file.publicId);

      // Delete from database
      await creative.remove();

      // Remove from campaign
      await AdCampaign.findByIdAndUpdate(
        creative.campaign._id,
        { $pull: { creatives: creative._id } }
      );

      res.status(200).json(
        new ApiResponse(200, 'Creative deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active ads for display
   */
  async getActiveAds(req, res, next) {
    try {
      const {
        position,
        type,
        limit = 1,
        userId,
        category,
      } = req.query;

      // Try cache first
      const cacheKey = `active_ads_${position}_${type}_${limit}_${userId}_${category}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return res.status(200).json(
          new ApiResponse(200, 'Active ads retrieved from cache', cached)
        );
      }

      // Build query for active campaigns
      const now = new Date();
      const campaignQuery = {
        status: 'active',
        'dates.start': { $lte: now },
        'dates.end': { $gte: now },
        'budget.remaining': { $gt: 0 },
      };

      // Add filters
      if (type) {
        campaignQuery.type = type;
      }

      // Get eligible campaigns
      const campaigns = await AdCampaign.find(campaignQuery)
        .populate('creatives')
        .populate('client')
        .lean();

      if (campaigns.length === 0) {
        throw new ApiError(404, 'No active campaigns found');
      }

      // Filter campaigns by targeting
      const targetedCampaigns = campaigns.filter(campaign => 
        this.matchesTargeting(campaign.targeting, { userId, category })
      );

      if (targetedCampaigns.length === 0) {
        throw new ApiError(404, 'No targeted campaigns found');
      }

      // Select ads using rotation algorithm
      const selectedAds = this.selectAdsForDisplay(targetedCampaigns, parseInt(limit), position);

      // Format response
      const ads = selectedAds.map(ad => ({
        id: ad.creative._id,
        campaignId: ad.campaign._id,
        type: ad.campaign.type,
        title: ad.creative.title,
        description: ad.creative.description,
        imageUrl: ad.creative.file.url,
        altText: ad.creative.altText,
        callToAction: ad.creative.callToAction,
        destinationUrl: ad.creative.destinationUrl,
        tracking: {
          impressionUrl: `${process.env.SERVER_URL}/api/v1/ads/impression`,
          clickUrl: `${process.env.SERVER_URL}/api/v1/ads/click`,
          adId: ad.creative._id,
          campaignId: ad.campaign._id,
        },
      }));

      // Cache the result
      await cache.set(cacheKey, { ads }, 300); // 5 minutes cache

      res.status(200).json(
        new ApiResponse(200, 'Active ads retrieved successfully', { ads })
      );
    } catch (error) {
      // If no ads found, return empty array instead of error
      if (error.statusCode === 404) {
        return res.status(200).json(
          new ApiResponse(200, 'No active ads found', { ads: [] })
        );
      }
      next(error);
    }
  }

  /**
   * Record ad impression
   */
  async recordImpression(req, res, next) {
    try {
      const {
        adId,
        campaignId,
        userId,
        pageUrl,
        position,
        device = {},
        viewability = 100,
      } = req.body;

      // Validate ad and campaign
      const [creative, campaign] = await Promise.all([
        AdCreative.findById(adId),
        AdCampaign.findById(campaignId),
      ]);

      if (!creative || !campaign) {
        throw new ApiError(404, 'Ad or campaign not found');
      }

      // Check if campaign is active
      if (campaign.status !== 'active') {
        throw new ApiError(400, 'Campaign is not active');
      }

      // Check budget
      if (campaign.budget.remaining <= 0) {
        throw new ApiError(400, 'Campaign budget exhausted');
      }

      // Record impression
      const impression = await AdImpression.create({
        creative: adId,
        campaign: campaignId,
        user: userId,
        pageUrl,
        position,
        device,
        viewability,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
      });

      // Update campaign metrics
      await this.updateCampaignMetrics(campaignId, 'impression');

      // Check viewability for billing
      if (viewability >= 50) { // Only bill for viewable impressions
        const cost = this.calculateImpressionCost(campaign);
        
        // Update campaign budget
        campaign.budget.spent += cost;
        campaign.budget.remaining -= cost;
        await campaign.save();
      }

      // Update creative stats
      creative.impressions += 1;
      await creative.save();

      res.status(200).json(
        new ApiResponse(200, 'Impression recorded successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record ad click
   */
  async recordClick(req, res, next) {
    try {
      const {
        adId,
        campaignId,
        userId,
        pageUrl,
        position,
        device = {},
      } = req.body;

      // Validate ad and campaign
      const [creative, campaign] = await Promise.all([
        AdCreative.findById(adId),
        AdCampaign.findById(campaignId),
      ]);

      if (!creative || !campaign) {
        throw new ApiError(404, 'Ad or campaign not found');
      }

      // Check if campaign is active
      if (campaign.status !== 'active') {
        throw new ApiError(400, 'Campaign is not active');
      }

      // Check for click fraud prevention
      const recentClicks = await AdClick.countDocuments({
        user: userId,
        creative: adId,
        timestamp: { $gte: new Date(Date.now() - 3600000) }, // Last hour
      });

      if (recentClicks > 5) {
        // Too many clicks from same user, possible fraud
        console.warn(`Possible click fraud detected for user ${userId} on ad ${adId}`);
      }

      // Record click
      const click = await AdClick.create({
        creative: adId,
        campaign: campaignId,
        user: userId,
        pageUrl,
        position,
        device,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
      });

      // Update campaign metrics
      await this.updateCampaignMetrics(campaignId, 'click');

      // Update creative stats
      creative.clicks += 1;
      creative.ctr = creative.impressions > 0 ? (creative.clicks / creative.impressions) * 100 : 0;
      await creative.save();

      res.status(200).json(
        new ApiResponse(200, 'Click recorded successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record ad conversion
   */
  async recordConversion(req, res, next) {
    try {
      const {
        adId,
        campaignId,
        userId,
        conversionType,
        value = 0,
        metadata = {},
      } = req.body;

      // Validate ad and campaign
      const [creative, campaign] = await Promise.all([
        AdCreative.findById(adId),
        AdCampaign.findById(campaignId),
      ]);

      if (!creative || !campaign) {
        throw new ApiError(404, 'Ad or campaign not found');
      }

      // Record conversion
      const conversion = await AdConversion.create({
        creative: adId,
        campaign: campaignId,
        user: userId,
        conversionType,
        value,
        metadata,
        ipAddress: req.ip,
        timestamp: new Date(),
      });

      // Update campaign metrics
      await this.updateCampaignMetrics(campaignId, 'conversion', value);

      // Update creative stats
      creative.conversions += 1;
      await creative.save();

      // If this is a purchase conversion, notify campaign owner
      if (conversionType === 'purchase' && value > 0) {
        await this.notifyConversion(campaign, conversion);
      }

      res.status(200).json(
        new ApiResponse(200, 'Conversion recorded successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate performance report
   */
  async generateReport(req, res, next) {
    try {
      const {
        startDate,
        endDate,
        campaignId,
        clientId,
        format = 'json',
      } = req.query;

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start) || isNaN(end)) {
        throw new ApiError(400, 'Invalid date format');
      }

      if (start > end) {
        throw new ApiError(400, 'Start date must be before end date');
      }

      // Build query
      const query = {
        'dates.start': { $gte: start },
        'dates.end': { $lte: end },
      };

      if (campaignId) {
        query._id = campaignId;
      }

      if (clientId) {
        query.client = clientId;
      }

      // Get campaigns
      const campaigns = await AdCampaign.find(query)
        .populate('client')
        .populate('creatives')
        .lean();

      // Get detailed statistics for each campaign
      const reportData = await Promise.all(
        campaigns.map(async campaign => {
          const [impressions, clicks, conversions] = await Promise.all([
            AdImpression.countDocuments({ 
              campaign: campaign._id,
              timestamp: { $gte: start, $lte: end }
            }),
            AdClick.countDocuments({ 
              campaign: campaign._id,
              timestamp: { $gte: start, $lte: end }
            }),
            AdConversion.find({ 
              campaign: campaign._id,
              timestamp: { $gte: start, $lte: end }
            }),
          ]);

          const conversionValue = conversions.reduce((sum, conv) => sum + conv.value, 0);

          return {
            campaign: campaign.name,
            client: campaign.client?.name,
            type: campaign.type,
            budget: campaign.budget,
            dates: campaign.dates,
            impressions,
            clicks,
            conversions: conversions.length,
            conversionValue,
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            cpc: clicks > 0 ? campaign.budget.spent / clicks : 0,
            cpm: impressions > 0 ? (campaign.budget.spent / impressions) * 1000 : 0,
            roas: campaign.budget.spent > 0 ? (conversionValue / campaign.budget.spent) * 100 : 0,
          };
        })
      );

      // Calculate totals
      const totals = reportData.reduce((acc, data) => ({
        impressions: acc.impressions + data.impressions,
        clicks: acc.clicks + data.clicks,
        conversions: acc.conversions + data.conversions,
        conversionValue: acc.conversionValue + data.conversionValue,
        spent: acc.spent + data.budget.spent,
      }), { impressions: 0, clicks: 0, conversions: 0, conversionValue: 0, spent: 0 });

      totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
      totals.cpc = totals.clicks > 0 ? totals.spent / totals.clicks : 0;
      totals.cpm = totals.impressions > 0 ? (totals.spent / totals.impressions) * 1000 : 0;
      totals.roas = totals.spent > 0 ? (totals.conversionValue / totals.spent) * 100 : 0;

      // Generate report in requested format
      const report = await generateReport({
        data: reportData,
        totals,
        period: { start, end },
        format,
      });

      // Set headers for download
      if (format !== 'json') {
        const filename = `ad_report_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}.${format}`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/pdf');
        return res.send(report);
      }

      res.status(200).json(
        new ApiResponse(200, 'Report generated successfully', {
          period: { start, end },
          campaigns: reportData,
          totals,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all advertising clients
   */
  async getClients(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
      } = req.query;

      // Build query
      const query = {};

      if (status) {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
        ];
      }

      // Apply user restrictions if not admin
      if (!req.user.roles.includes('admin')) {
        query.createdBy = req.user.id;
      }

      // Get clients
      const clients = await AdClient.find(query)
        .populate('createdBy', 'firstName lastName email')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      // Get campaign counts
      const clientsWithStats = await Promise.all(
        clients.map(async client => {
          const [activeCampaigns, totalSpent] = await Promise.all([
            AdCampaign.countDocuments({ 
              client: client._id,
              status: 'active'
            }),
            AdCampaign.aggregate([
              { $match: { client: client._id } },
              { $group: { _id: null, total: { $sum: '$budget.spent' } } }
            ]),
          ]);

          return {
            ...client,
            stats: {
              activeCampaigns,
              totalSpent: totalSpent[0]?.total || 0,
              campaigns: await AdCampaign.countDocuments({ client: client._id }),
            },
          };
        })
      );

      // Get total count
      const total = await AdClient.countDocuments(query);

      const pagination = {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      };

      res.status(200).json(
        new ApiResponse(200, 'Clients retrieved successfully', {
          clients: clientsWithStats,
          pagination,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get client by ID
   */
  async getClient(req, res, next) {
    try {
      const { id } = req.params;

      const client = await AdClient.findById(id)
        .populate('createdBy', 'firstName lastName email')
        .lean();

      if (!client) {
        throw new ApiError(404, 'Client not found');
      }

      // Check permissions
      if (!req.user.roles.includes('admin') && client.createdBy._id.toString() !== req.user.id) {
        throw new ApiError(403, 'You do not have access to this client');
      }

      // Get client campaigns
      const campaigns = await AdCampaign.find({ client: id })
        .sort({ 'dates.start': -1 })
        .limit(10)
        .lean();

      // Get client statistics
      const stats = await this.getClientStatistics(id);

      res.status(200).json(
        new ApiResponse(200, 'Client retrieved successfully', {
          client,
          campaigns,
          stats,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get targeting options
   */
  async getTargetingOptions(req, res, next) {
    try {
      const options = adsConfig.generateTargetingOptions({
        demographics: true,
        geographic: true,
        interests: true,
        behavioral: true,
        device: true,
      });

      res.status(200).json(
        new ApiResponse(200, 'Targeting options retrieved successfully', { options })
      );
    } catch (error) {
      next(error);
    }
  }

  // Helper Methods

  /**
   * Check if user has access to campaign
   */
  hasCampaignAccess(user, campaign) {
    if (user.roles.includes('admin')) {
      return true;
    }

    if (user.roles.includes('advertiser')) {
      // Advertisers can access campaigns for their clients
      return campaign.createdBy.toString() === user.id;
    }

    return false;
  }

  /**
   * Validate status transition
   */
  isValidStatusTransition(currentStatus, newStatus) {
    const transitions = {
      draft: ['pending', 'active', 'cancelled'],
      pending: ['active', 'draft', 'cancelled'],
      active: ['paused', 'completed', 'cancelled'],
      paused: ['active', 'completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    return transitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Calculate campaign progress
   */
  calculateCampaignProgress(campaign) {
    const now = new Date();
    const start = new Date(campaign.dates.start);
    const end = new Date(campaign.dates.end);

    // Time progress
    const totalDuration = end - start;
    const elapsed = now - start;
    const timeProgress = Math.min(Math.max(elapsed / totalDuration, 0), 1) * 100;

    // Budget progress
    const budgetProgress = campaign.budget.total > 0 
      ? (campaign.budget.spent / campaign.budget.total) * 100 
      : 0;

    // Overall progress (weighted average)
    const overallProgress = (timeProgress * 0.4) + (budgetProgress * 0.6);

    return {
      time: Math.round(timeProgress),
      budget: Math.round(budgetProgress),
      overall: Math.round(overallProgress),
      daysRemaining: Math.max(Math.ceil((end - now) / (1000 * 60 * 60 * 24)), 0),
    };
  }

  /**
   * Calculate campaign performance
   */
  calculateCampaignPerformance(metrics) {
    const score = adsConfig.calculatePerformanceScore(metrics);
    
    let rating = 'poor';
    if (score >= 80) rating = 'excellent';
    else if (score >= 60) rating = 'good';
    else if (score >= 40) rating = 'average';
    else if (score >= 20) rating = 'below_average';

    return {
      score: Math.round(score),
      rating,
      insights: this.generatePerformanceInsights(metrics),
    };
  }

  /**
   * Generate performance insights
   */
  generatePerformanceInsights(metrics) {
    const insights = [];

    if (metrics.ctr < 0.5) {
      insights.push('CTR is below industry average. Consider improving ad creative or targeting.');
    }

    if (metrics.cpc > 10) {
      insights.push('Cost per click is high. Consider adjusting bids or improving quality score.');
    }

    if (metrics.roas < 100) {
      insights.push('Return on ad spend is below target. Consider optimizing conversion funnel.');
    }

    return insights.length > 0 ? insights : ['Campaign is performing well. Keep up the good work!'];
  }

  /**
   * Check if user matches targeting criteria
   */
  matchesTargeting(targeting, userData) {
    // If no targeting, match all
    if (!targeting || Object.keys(targeting).length === 0) {
      return true;
    }

    // In a real implementation, this would check against user profile
    // For now, we'll implement basic checks
    
    let matches = true;

    // Check demographics
    if (targeting.demographics) {
      // Add demographic matching logic
    }

    // Check geographic
    if (targeting.geographic) {
      // Add geographic matching logic
    }

    // Check interests
    if (targeting.interests) {
      // Add interest matching logic
    }

    return matches;
  }

  /**
   * Select ads for display using rotation algorithm
   */
  selectAdsForDisplay(campaigns, limit, position) {
    const eligibleAds = [];

    campaigns.forEach(campaign => {
      campaign.creatives.forEach(creative => {
        if (creative.status === 'active') {
          eligibleAds.push({
            campaign,
            creative,
            weight: this.calculateAdWeight(campaign, creative, position),
          });
        }
      });
    });

    if (eligibleAds.length === 0) {
      return [];
    }

    // Sort by weight (descending)
    eligibleAds.sort((a, b) => b.weight - a.weight);

    // Select top N ads
    return eligibleAds.slice(0, limit).map(ad => ({
      campaign: ad.campaign,
      creative: ad.creative,
    }));
  }

  /**
   * Calculate ad weight for rotation
   */
  calculateAdWeight(campaign, creative, position) {
    let weight = 1;

    // Weight by budget remaining
    weight *= (campaign.budget.remaining / campaign.budget.total);

    // Weight by performance
    if (creative.impressions > 0) {
      weight *= (creative.ctr / 100) * 2; // Double weight for CTR
    }

    // Weight by position relevance
    if (position && campaign.targeting?.positions?.includes(position)) {
      weight *= 1.5;
    }

    // Weight by recency
    const daysSinceCreation = Math.floor((new Date() - creative.createdAt) / (1000 * 60 * 60 * 24));
    weight *= Math.max(0.1, 1 - (daysSinceCreation / 30)); // Decrease weight over 30 days

    return weight;
  }

  /**
   * Update campaign metrics
   */
  async updateCampaignMetrics(campaignId, metricType, value = 0) {
    const campaign = await AdCampaign.findById(campaignId);
    
    if (!campaign) return;

    // Update basic metrics
    switch (metricType) {
      case 'impression':
        campaign.metrics.impressions += 1;
        break;
      case 'click':
        campaign.metrics.clicks += 1;
        break;
      case 'conversion':
        campaign.metrics.conversions += 1;
        campaign.metrics.conversionValue += value;
        break;
    }

    // Calculate derived metrics
    if (campaign.metrics.impressions > 0) {
      campaign.metrics.ctr = (campaign.metrics.clicks / campaign.metrics.impressions) * 100;
      campaign.metrics.cpm = (campaign.budget.spent / campaign.metrics.impressions) * 1000;
    }

    if (campaign.metrics.clicks > 0) {
      campaign.metrics.cpc = campaign.budget.spent / campaign.metrics.clicks;
    }

    if (campaign.budget.spent > 0) {
      campaign.metrics.roas = (campaign.metrics.conversionValue / campaign.budget.spent) * 100;
    }

    await campaign.save();
  }

  /**
   * Calculate impression cost
   */
  calculateImpressionCost(campaign) {
    // This would integrate with the actual pricing model
    // For now, use a simple calculation
    
    const config = adsConfig.getPricingModelConfig('cpm');
    if (!config) return 0;

    const costPerImpression = config.baseRate / 1000; // CPM to cost per impression
    
    // Apply position multiplier if applicable
    // Add any other adjustments here

    return costPerImpression;
  }

  /**
   * Schedule campaign for display
   */
  async scheduleCampaign(campaignId) {
    // This would integrate with a job scheduler (like Bull, Agenda, etc.)
    // For now, just update the status
    
    const campaign = await AdCampaign.findById(campaignId);
    if (!campaign) return;

    campaign.status = 'active';
    campaign.activatedAt = new Date();
    await campaign.save();

    // Schedule end date check
    this.scheduleCampaignEnd(campaignId, campaign.dates.end);
  }

  /**
   * Schedule campaign end
   */
  scheduleCampaignEnd(campaignId, endDate) {
    // Schedule a job to end the campaign at the specified date
    const endTime = new Date(endDate).getTime() - Date.now();
    
    if (endTime > 0) {
      setTimeout(async () => {
        const campaign = await AdCampaign.findById(campaignId);
        if (campaign && campaign.status === 'active') {
          campaign.status = 'completed';
          campaign.completedAt = new Date();
          await campaign.save();
          
          // Notify campaign owner
          await this.notifyCampaignComplete(campaign);
        }
      }, endTime);
    }
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId) {
    const campaign = await AdCampaign.findById(campaignId);
    if (!campaign) return;

    campaign.status = 'paused';
    campaign.pausedAt = new Date();
    await campaign.save();
  }

  /**
   * Complete campaign
   */
  async completeCampaign(campaignId) {
    const campaign = await AdCampaign.findById(campaignId);
    if (!campaign) return;

    campaign.status = 'completed';
    campaign.completedAt = new Date();
    await campaign.save();

    // Notify campaign owner
    await this.notifyCampaignComplete(campaign);
  }

  /**
   * Get statistics by time interval
   */
  async getStatisticsByInterval(campaignId, start, end, interval) {
    const intervals = [];
    let current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      let nextDate;
      
      switch (interval) {
        case 'hourly':
          nextDate = new Date(current.getTime() + 60 * 60 * 1000);
          break;
        case 'daily':
          nextDate = new Date(current.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          nextDate = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          nextDate = new Date(current.getFullYear(), current.getMonth() + 1, 1);
          break;
        default:
          nextDate = new Date(current.getTime() + 24 * 60 * 60 * 1000);
      }

      intervals.push({
        start: new Date(current),
        end: new Date(nextDate - 1),
      });

      current = nextDate;
    }

    // Get data for each interval
    const statistics = await Promise.all(
      intervals.map(async interval => {
        const [impressions, clicks, conversions] = await Promise.all([
          AdImpression.countDocuments({
            campaign: campaignId,
            timestamp: { $gte: interval.start, $lte: interval.end },
          }),
          AdClick.countDocuments({
            campaign: campaignId,
            timestamp: { $gte: interval.start, $lte: interval.end },
          }),
          AdConversion.aggregate([
            {
              $match: {
                campaign: campaignId,
                timestamp: { $gte: interval.start, $lte: interval.end },
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                value: { $sum: '$value' },
              },
            },
          ]),
        ]);

        const conversionData = conversions[0] || { count: 0, value: 0 };

        return {
          date: interval.start,
          impressions,
          clicks,
          conversions: conversionData.count,
          conversionValue: conversionData.value,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        };
      })
    );

    return statistics;
  }

  /**
   * Generate campaign analytics
   */
  async generateCampaignAnalytics(campaignId) {
    const [
      impressions,
      clicks,
      conversions,
      topCreatives,
      deviceBreakdown,
      timeBreakdown,
    ] = await Promise.all([
      // Total metrics
      AdImpression.countDocuments({ campaign: campaignId }),
      AdClick.countDocuments({ campaign: campaignId }),
      AdConversion.aggregate([
        { $match: { campaign: campaignId } },
        { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$value' } } },
      ]),

      // Top performing creatives
      AdCreative.find({ campaign: campaignId })
        .sort({ ctr: -1 })
        .limit(5)
        .select('title impressions clicks ctr conversions')
        .lean(),

      // Device breakdown
      AdImpression.aggregate([
        { $match: { campaign: campaignId } },
        { $group: { _id: '$device.type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Time of day breakdown
      AdImpression.aggregate([
        { $match: { campaign: campaignId } },
        {
          $group: {
            _id: { $hour: '$timestamp' },
            impressions: { $sum: 1 },
            clicks: {
              $sum: {
                $cond: [{ $in: ['$_id', { $ifNull: ['$clicked', []] }] }, 1, 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const conversionData = conversions[0] || { count: 0, value: 0 };

    return {
      summary: {
        impressions,
        clicks,
        conversions: conversionData.count,
        conversionValue: conversionData.value,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        averageViewability: 75, // This would be calculated from actual data
      },
      topCreatives,
      deviceBreakdown,
      timeBreakdown,
      recommendations: this.generateAnalyticsRecommendations({
        impressions,
        clicks,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        conversionRate: impressions > 0 ? (conversionData.count / impressions) * 100 : 0,
      }),
    };
  }

  /**
   * Generate analytics recommendations
   */
  generateAnalyticsRecommendations(metrics) {
    const recommendations = [];

    if (metrics.ctr < 0.5) {
      recommendations.push({
        type: 'ctr_improvement',
        priority: 'high',
        title: 'Improve Click-Through Rate',
        description: 'CTR is below industry average. Consider A/B testing different ad creatives.',
        actions: [
          'Test different call-to-action buttons',
          'Experiment with different images',
          'Try different ad copy',
        ],
      });
    }

    if (metrics.conversionRate < 2) {
      recommendations.push({
        type: 'conversion_optimization',
        priority: 'medium',
        title: 'Optimize Conversion Rate',
        description: 'Conversion rate can be improved. Consider optimizing the landing page.',
        actions: [
          'Simplify the conversion form',
          'Add trust signals (reviews, badges)',
          'Improve page load speed',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Get client statistics
   */
  async getClientStatistics(clientId) {
    const [
      totalCampaigns,
      activeCampaigns,
      totalSpent,
      totalImpressions,
      totalClicks,
      totalConversions,
    ] = await Promise.all([
      AdCampaign.countDocuments({ client: clientId }),
      AdCampaign.countDocuments({ client: clientId, status: 'active' }),
      AdCampaign.aggregate([
        { $match: { client: clientId } },
        { $group: { _id: null, total: { $sum: '$budget.spent' } } },
      ]),
      AdCampaign.aggregate([
        { $match: { client: clientId } },
        { $group: { _id: null, total: { $sum: '$metrics.impressions' } } },
      ]),
      AdCampaign.aggregate([
        { $match: { client: clientId } },
        { $group: { _id: null, total: { $sum: '$metrics.clicks' } } },
      ]),
      AdCampaign.aggregate([
        { $match: { client: clientId } },
        { $group: { _id: null, total: { $sum: '$metrics.conversions' } } },
      ]),
    ]);

    return {
      totalCampaigns,
      activeCampaigns,
      totalSpent: totalSpent[0]?.total || 0,
      totalImpressions: totalImpressions[0]?.total || 0,
      totalClicks: totalClicks[0]?.total || 0,
      totalConversions: totalConversions[0]?.total || 0,
      averageCtr: totalImpressions[0]?.total > 0 
        ? (totalClicks[0]?.total / totalImpressions[0]?.total) * 100 
        : 0,
      averageCpc: totalClicks[0]?.total > 0 
        ? totalSpent[0]?.total / totalClicks[0]?.total 
        : 0,
    };
  }

  /**
   * Notify campaign completion
   */
  async notifyCampaignComplete(campaign) {
    try {
      const client = await AdClient.findById(campaign.client);
      if (!client) return;

      const user = await User.findById(client.createdBy);
      if (!user) return;

      await sendEmail({
        to: user.email,
        subject: `Campaign Completed: ${campaign.name}`,
        template: 'campaign_complete',
        data: {
          campaignName: campaign.name,
          startDate: campaign.dates.start.toLocaleDateString(),
          endDate: campaign.dates.end.toLocaleDateString(),
          spent: campaign.budget.spent,
          impressions: campaign.metrics.impressions,
          clicks: campaign.metrics.clicks,
          conversions: campaign.metrics.conversions,
          ctr: campaign.metrics.ctr.toFixed(2),
          cpc: campaign.metrics.cpc.toFixed(2),
          roas: campaign.metrics.roas.toFixed(2),
          dashboardUrl: `${process.env.CLIENT_URL}/dashboard/ads/campaigns/${campaign._id}`,
        },
      });
    } catch (error) {
      console.error('Failed to send campaign completion notification:', error);
    }
  }

  /**
   * Notify conversion
   */
  async notifyConversion(campaign, conversion) {
    try {
      const client = await AdClient.findById(campaign.client);
      if (!client) return;

      const user = await User.findById(client.createdBy);
      if (!user) return;

      await sendEmail({
        to: user.email,
        subject: `New Conversion: ${campaign.name}`,
        template: 'new_conversion',
        data: {
          campaignName: campaign.name,
          conversionType: conversion.conversionType,
          conversionValue: conversion.value,
          timestamp: conversion.timestamp.toLocaleString(),
          totalConversions: campaign.metrics.conversions,
          conversionValueTotal: campaign.metrics.conversionValue,
          dashboardUrl: `${process.env.CLIENT_URL}/dashboard/ads/campaigns/${campaign._id}`,
        },
      });
    } catch (error) {
      console.error('Failed to send conversion notification:', error);
    }
  }
}

module.exports = new AdsController();

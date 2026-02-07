import asyncHandler from 'express-async-handler';
import adsService from '../../services/ads/ads.service.js';
import ApiResponse from '../../utils/apiResponse.js';
import validate from '../../validations/ad.validation.js';

class AdsController {
  // Create new ad
  createAd = asyncHandler(async (req, res) => {
    const { error } = validate.createAd(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const ad = await adsService.createAd({
      ...req.body,
      advertiser: req.user._id
    });

    res.status(201).json(
      new ApiResponse(201, 'Ad created successfully', ad)
    );
  });

  // Get active ads
  getActiveAds = asyncHandler(async (req, res) => {
    const { placement } = req.params;
    const ads = await adsService.getActiveAds(placement, req.query);

    res.status(200).json(
      new ApiResponse(200, 'Active ads retrieved', ads)
    );
  });

  // Get featured jobs
  getFeaturedJobs = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const jobs = await adsService.getFeaturedJobs(limit);

    res.status(200).json(
      new ApiResponse(200, 'Featured jobs retrieved', jobs)
    );
  });

  // Update ad
  updateAd = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { error } = validate.updateAd(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const ad = await adsService.updateAd(id, req.body);
    
    res.status(200).json(
      new ApiResponse(200, 'Ad updated successfully', ad)
    );
  });

  // Get ad analytics
  getAdAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const analytics = await adsService.getAdAnalytics(
      req.user._id,
      new Date(startDate),
      new Date(endDate)
    );

    res.status(200).json(
      new ApiResponse(200, 'Analytics retrieved', analytics)
    );
  });
}

export default new AdsController();

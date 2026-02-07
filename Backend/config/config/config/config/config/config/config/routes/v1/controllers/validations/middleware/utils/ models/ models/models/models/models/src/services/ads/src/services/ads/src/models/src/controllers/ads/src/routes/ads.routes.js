import express from 'express';
import adsController from '../controllers/ads/ads.controller.js';
import bannerController from '../controllers/ads/banner.controller.js';
import { auth, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// Ad routes
router.post('/ads', auth, authorize('employer', 'admin'), adsController.createAd);
router.get('/ads/placement/:placement', adsController.getActiveAds);
router.get('/ads/featured-jobs', adsController.getFeaturedJobs);
router.put('/ads/:id', auth, authorize('employer', 'admin'), adsController.updateAd);
router.delete('/ads/:id', auth, authorize('employer', 'admin'), adsController.deactivateAd);
router.get('/ads/analytics', auth, authorize('employer', 'admin'), adsController.getAdAnalytics);

// Banner routes
router.post('/banners', 
  auth, 
  authorize('admin'), 
  upload.single('bannerImage'), 
  bannerController.createBanner
);
router.get('/banners/position/:position', bannerController.getActiveBanners);
router.get('/banners', auth, authorize('admin'), bannerController.getAllBanners);
router.put('/banners/:id', 
  auth, 
  authorize('admin'), 
  upload.single('bannerImage'), 
  bannerController.updateBanner
);
router.delete('/banners/:id', auth, authorize('admin'), bannerController.deleteBanner);
router.post('/banners/:id/click', bannerController.recordClick);
router.get('/banners/stats', auth, authorize('admin'), bannerController.getBannerStats);

export default router;

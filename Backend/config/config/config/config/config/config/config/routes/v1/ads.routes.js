const express = require('express');
const router = express.Router();
const adsController = require('../../controllers/ads.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const adValidation = require('../../validations/ad.validation');
const upload = require('../../middleware/upload');

/**
 * @swagger
 * tags:
 *   name: Ads
 *   description: Advertisement management APIs
 */

/**
 * @swagger
 * /api/v1/ads/campaigns:
 *   post:
 *     summary: Create a new ad campaign
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - clientId
 *               - budget
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Summer Hiring Campaign 2024"
 *               type:
 *                 type: string
 *                 enum: [banner, sidebar, interstitial, native, video]
 *                 example: "banner"
 *               clientId:
 *                 type: string
 *                 example: "client123"
 *               budget:
 *                 type: number
 *                 example: 10000
 *               currency:
 *                 type: string
 *                 default: "ETB"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-06-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-08-31"
 *               targeting:
 *                 type: object
 *                 properties:
 *                   demographics:
 *                     type: object
 *                   geographic:
 *                     type: object
 *                   interests:
 *                     type: object
 *               status:
 *                 type: string
 *                 enum: [draft, pending, active, paused, completed, cancelled]
 *                 default: "draft"
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post(
  '/campaigns',
  authenticate,
  authorize(['admin', 'advertiser']),
  validate(adValidation.createCampaign),
  adsController.createCampaign
);

/**
 * @swagger
 * /api/v1/ads/campaigns:
 *   get:
 *     summary: Get all ad campaigns
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, active, paused, completed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [banner, sidebar, interstitial, native, video]
 *         description: Filter by ad type
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filter by client
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in campaign name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: "createdAt"
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: "desc"
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of campaigns
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/campaigns',
  authenticate,
  authorize(['admin', 'advertiser', 'analyst']),
  adsController.getAllCampaigns
);

/**
 * @swagger
 * /api/v1/ads/campaigns/{id}:
 *   get:
 *     summary: Get campaign by ID
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign details
 *       404:
 *         description: Campaign not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/campaigns/:id',
  authenticate,
  authorize(['admin', 'advertiser', 'analyst']),
  validate(adValidation.getCampaign),
  adsController.getCampaign
);

/**
 * @swagger
 * /api/v1/ads/campaigns/{id}:
 *   put:
 *     summary: Update campaign
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               budget:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               targeting:
 *                 type: object
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Campaign updated
 *       404:
 *         description: Campaign not found
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  '/campaigns/:id',
  authenticate,
  authorize(['admin', 'advertiser']),
  validate(adValidation.updateCampaign),
  adsController.updateCampaign
);

/**
 * @swagger
 * /api/v1/ads/campaigns/{id}:
 *   delete:
 *     summary: Delete campaign
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign deleted
 *       404:
 *         description: Campaign not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  '/campaigns/:id',
  authenticate,
  authorize(['admin']),
  validate(adValidation.deleteCampaign),
  adsController.deleteCampaign
);

/**
 * @swagger
 * /api/v1/ads/campaigns/{id}/status:
 *   patch:
 *     summary: Update campaign status
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, pending, active, paused, completed, cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Campaign not found
 *       400:
 *         description: Invalid status transition
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/campaigns/:id/status',
  authenticate,
  authorize(['admin', 'advertiser']),
  validate(adValidation.updateStatus),
  adsController.updateCampaignStatus
);

/**
 * @swagger
 * /api/v1/ads/campaigns/{id}/budget:
 *   patch:
 *     summary: Update campaign budget
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - budget
 *             properties:
 *               budget:
 *                 type: number
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Budget updated
 *       404:
 *         description: Campaign not found
 *       400:
 *         description: Invalid budget
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/campaigns/:id/budget',
  authenticate,
  authorize(['admin', 'advertiser']),
  validate(adValidation.updateBudget),
  adsController.updateCampaignBudget
);

/**
 * @swagger
 * /api/v1/ads/campaigns/{id}/statistics:
 *   get:
 *     summary: Get campaign statistics
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [hourly, daily, weekly, monthly]
 *           default: "daily"
 *         description: Time interval for statistics
 *     responses:
 *       200:
 *         description: Campaign statistics
 *       404:
 *         description: Campaign not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/campaigns/:id/statistics',
  authenticate,
  authorize(['admin', 'advertiser', 'analyst']),
  validate(adValidation.getStatistics),
  adsController.getCampaignStatistics
);

/**
 * @swagger
 * /api/v1/ads/campaigns/{id}/analytics:
 *   get:
 *     summary: Get campaign analytics
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign analytics
 *       404:
 *         description: Campaign not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/campaigns/:id/analytics',
  authenticate,
  authorize(['admin', 'advertiser', 'analyst']),
  validate(adValidation.getCampaign),
  adsController.getCampaignAnalytics
);

/**
 * @swagger
 * /api/v1/ads/creative/upload:
 *   post:
 *     summary: Upload ad creative
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - campaignId
 *               - file
 *             properties:
 *               campaignId:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               altText:
 *                 type: string
 *               callToAction:
 *                 type: string
 *               destinationUrl:
 *                 type: string
 *               isPrimary:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Creative uploaded successfully
 *       400:
 *         description: Invalid file or data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/creative/upload',
  authenticate,
  authorize(['admin', 'advertiser']),
  upload.single('file'),
  validate(adValidation.uploadCreative),
  adsController.uploadCreative
);

/**
 * @swagger
 * /api/v1/ads/creative/{id}:
 *   delete:
 *     summary: Delete ad creative
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Creative ID
 *     responses:
 *       200:
 *         description: Creative deleted
 *       404:
 *         description: Creative not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/creative/:id',
  authenticate,
  authorize(['admin', 'advertiser']),
  validate(adValidation.deleteCreative),
  adsController.deleteCreative
);

/**
 * @swagger
 * /api/v1/ads/active:
 *   get:
 *     summary: Get active ads for display
 *     tags: [Ads]
 *     parameters:
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *         description: Ad position on page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [banner, sidebar, interstitial, native, video]
 *         description: Ad type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Number of ads to return
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID for targeting
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Content category for targeting
 *     responses:
 *       200:
 *         description: List of active ads
 *       404:
 *         description: No active ads found
 */
router.get(
  '/active',
  adsController.getActiveAds
);

/**
 * @swagger
 * /api/v1/ads/impression:
 *   post:
 *     summary: Record ad impression
 *     tags: [Ads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adId
 *               - campaignId
 *             properties:
 *               adId:
 *                 type: string
 *               campaignId:
 *                 type: string
 *               userId:
 *                 type: string
 *               pageUrl:
 *                 type: string
 *               position:
 *                 type: string
 *               device:
 *                 type: object
 *               viewability:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Impression recorded
 *       400:
 *         description: Invalid data
 *       404:
 *         description: Ad not found
 */
router.post(
  '/impression',
  validate(adValidation.recordImpression),
  adsController.recordImpression
);

/**
 * @swagger
 * /api/v1/ads/click:
 *   post:
 *     summary: Record ad click
 *     tags: [Ads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adId
 *               - campaignId
 *             properties:
 *               adId:
 *                 type: string
 *               campaignId:
 *                 type: string
 *               userId:
 *                 type: string
 *               pageUrl:
 *                 type: string
 *               position:
 *                 type: string
 *               device:
 *                 type: object
 *     responses:
 *       200:
 *         description: Click recorded
 *       400:
 *         description: Invalid data
 *       404:
 *         description: Ad not found
 */
router.post(
  '/click',
  validate(adValidation.recordClick),
  adsController.recordClick
);

/**
 * @swagger
 * /api/v1/ads/conversion:
 *   post:
 *     summary: Record ad conversion
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adId
 *               - campaignId
 *               - conversionType
 *             properties:
 *               adId:
 *                 type: string
 *               campaignId:
 *                 type: string
 *               userId:
 *                 type: string
 *               conversionType:
 *                 type: string
 *                 enum: [signup, purchase, download, lead, other]
 *               value:
 *                 type: number
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Conversion recorded
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/conversion',
  authenticate,
  validate(adValidation.recordConversion),
  adsController.recordConversion
);

/**
 * @swagger
 * /api/v1/ads/report:
 *   get:
 *     summary: Generate ad performance report
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Report start date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Report end date
 *       - in: query
 *         name: campaignId
 *         schema:
 *           type: string
 *         description: Filter by campaign
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filter by client
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv, pdf]
 *           default: "json"
 *         description: Report format
 *     responses:
 *       200:
 *         description: Performance report
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/report',
  authenticate,
  authorize(['admin', 'advertiser', 'analyst']),
  adsController.generateReport
);

/**
 * @swagger
 * /api/v1/ads/clients:
 *   get:
 *     summary: Get all advertising clients
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *     responses:
 *       200:
 *         description: List of clients
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/clients',
  authenticate,
  authorize(['admin', 'advertiser']),
  adsController.getClients
);

/**
 * @swagger
 * /api/v1/ads/clients/{id}:
 *   get:
 *     summary: Get client by ID
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Client details
 *       404:
 *         description: Client not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/clients/:id',
  authenticate,
  authorize(['admin', 'advertiser']),
  validate(adValidation.getClient),
  adsController.getClient
);

/**
 * @swagger
 * /api/v1/ads/targeting-options:
 *   get:
 *     summary: Get available targeting options
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Targeting options
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/targeting-options',
  authenticate,
  authorize(['admin', 'advertiser']),
  adsController.getTargetingOptions
);

module.exports = router;

const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createCampaign = {
  body: Joi.object().keys({
    name: Joi.string().required().min(3).max(200),
    type: Joi.string().required().valid('banner', 'sidebar', 'interstitial', 'native', 'video'),
    clientId: Joi.string().required().custom(objectId),
    budget: Joi.number().required().min(100).max(1000000),
    currency: Joi.string().default('ETB').valid('ETB', 'USD'),
    startDate: Joi.date().required().iso(),
    endDate: Joi.date().required().iso().greater(Joi.ref('startDate')),
    targeting: Joi.object().optional(),
    status: Joi.string().default('draft').valid('draft', 'pending', 'active', 'paused', 'completed', 'cancelled'),
    notes: Joi.string().optional().max(1000),
  }),
};

const getCampaign = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
};

const updateCampaign = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string().optional().min(3).max(200),
    type: Joi.string().optional().valid('banner', 'sidebar', 'interstitial', 'native', 'video'),
    budget: Joi.number().optional().min(100).max(1000000),
    startDate: Joi.date().optional().iso(),
    endDate: Joi.date().optional().iso(),
    targeting: Joi.object().optional(),
    status: Joi.string().optional().valid('draft', 'pending', 'active', 'paused', 'completed', 'cancelled'),
    notes: Joi.string().optional().max(1000),
  }),
};

const deleteCampaign = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
};

const updateStatus = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    status: Joi.string().required().valid('draft', 'pending', 'active', 'paused', 'completed', 'cancelled'),
  }),
};

const updateBudget = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    budget: Joi.number().required().min(1),
  }),
};

const getStatistics = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    startDate: Joi.date().optional().iso(),
    endDate: Joi.date().optional().iso(),
    interval: Joi.string().optional().valid('hourly', 'daily', 'weekly', 'monthly'),
  }),
};

const uploadCreative = {
  body: Joi.object().keys({
    campaignId: Joi.string().required().custom(objectId),
    title: Joi.string().required().min(3).max(100),
    description: Joi.string().optional().max(500),
    altText: Joi.string().optional().max(200),
    callToAction: Joi.string().optional().max(50),
    destinationUrl: Joi.string().optional().uri(),
    isPrimary: Joi.boolean().default(false),
  }),
};

const deleteCreative = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
};

const recordImpression = {
  body: Joi.object().keys({
    adId: Joi.string().required().custom(objectId),
    campaignId: Joi.string().required().custom(objectId),
    userId: Joi.string().optional().custom(objectId),
    pageUrl: Joi.string().required().uri(),
    position: Joi.string().optional(),
    device: Joi.object().optional(),
    viewability: Joi.number().optional().min(0).max(100),
  }),
};

const recordClick = {
  body: Joi.object().keys({
    adId: Joi.string().required().custom(objectId),
    campaignId: Joi.string().required().custom(objectId),
    userId: Joi.string().optional().custom(objectId),
    pageUrl: Joi.string().required().uri(),
    position: Joi.string().optional(),
    device: Joi.object().optional(),
  }),
};

const recordConversion = {
  body: Joi.object().keys({
    adId: Joi.string().required().custom(objectId),
    campaignId: Joi.string().required().custom(objectId),
    userId: Joi.string().optional().custom(objectId),
    conversionType: Joi.string().required().valid('signup', 'purchase', 'download', 'lead', 'other'),
    value: Joi.number().optional().min(0),
    metadata: Joi.object().optional(),
  }),
};

const getClient = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
};

module.exports = {
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  updateStatus,
  updateBudget,
  getStatistics,
  uploadCreative,
  deleteCreative,
  recordImpression,
  recordClick,
  recordConversion,
  getClient,
};

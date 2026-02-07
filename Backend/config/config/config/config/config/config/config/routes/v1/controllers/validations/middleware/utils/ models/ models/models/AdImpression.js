const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Ad Impression Schema
 */
const adImpressionSchema = new Schema({
  creative: {
    type: Schema.Types.ObjectId,
    ref: 'AdCreative',
    required: true,
  },
  campaign: {
    type: Schema.Types.ObjectId,
    ref: 'AdCampaign',
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  sessionId: String,
  pageUrl: {
    type: String,
    required: true,
  },
  position: String,
  device: {
    type: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
    },
    platform: String,
    browser: String,
    os: String,
    screenResolution: String,
  },
  viewability: {
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  },
  cost: {
    type: Number,
    default: 0,
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for analytics queries
adImpressionSchema.index({ campaign: 1, timestamp: 1 });
adImpressionSchema.index({ creative: 1, timestamp: 1 });
adImpressionSchema.index({ user: 1, timestamp: 1 });
adImpressionSchema.index({ timestamp: 1 });

module.exports = mongoose.model('AdImpression', adImpressionSchema);

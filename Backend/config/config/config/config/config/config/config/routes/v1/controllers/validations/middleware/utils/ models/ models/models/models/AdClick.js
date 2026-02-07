const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Ad Click Schema
 */
const adClickSchema = new Schema({
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
adClickSchema.index({ campaign: 1, timestamp: 1 });
adClickSchema.index({ creative: 1, timestamp: 1 });
adClickSchema.index({ user: 1, timestamp: 1 });
adClickSchema.index({ timestamp: 1 });

module.exports = mongoose.model('AdClick', adClickSchema);

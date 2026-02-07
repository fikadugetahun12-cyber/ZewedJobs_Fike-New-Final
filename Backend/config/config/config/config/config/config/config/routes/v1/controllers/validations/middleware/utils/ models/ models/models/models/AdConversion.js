const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Ad Conversion Schema
 */
const adConversionSchema = new Schema({
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
  conversionType: {
    type: String,
    required: true,
    enum: ['signup', 'purchase', 'download', 'lead', 'other'],
  },
  value: {
    type: Number,
    default: 0,
  },
  metadata: Schema.Types.Mixed,
  ipAddress: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for analytics queries
adConversionSchema.index({ campaign: 1, timestamp: 1 });
adConversionSchema.index({ creative: 1, timestamp: 1 });
adConversionSchema.index({ user: 1, timestamp: 1 });
adConversionSchema.index({ conversionType: 1, timestamp: 1 });
adConversionSchema.index({ timestamp: 1 });

module.exports = mongoose.model('AdConversion', adConversionSchema);

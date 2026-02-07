const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Ad Creative Schema
 */
const adCreativeSchema = new Schema({
  campaign: {
    type: Schema.Types.ObjectId,
    ref: 'AdCampaign',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  altText: {
    type: String,
    maxlength: 200,
  },
  callToAction: {
    type: String,
    maxlength: 50,
  },
  destinationUrl: {
    type: String,
    required: true,
  },
  file: {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      required: true,
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'paused', 'archived'],
    default: 'active',
  },
  metrics: {
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    conversions: {
      type: Number,
      default: 0,
    },
    ctr: {
      type: Number,
      default: 0,
    },
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
adCreativeSchema.index({ campaign: 1, status: 1 });
adCreativeSchema.index({ isPrimary: 1 });
adCreativeSchema.index({ 'metrics.ctr': -1 });

// Calculate CTR before saving
adCreativeSchema.pre('save', function(next) {
  if (this.metrics.impressions > 0) {
    this.metrics.ctr = (this.metrics.clicks / this.metrics.impressions) * 100;
  }
  next();
});

module.exports = mongoose.model('AdCreative', adCreativeSchema);

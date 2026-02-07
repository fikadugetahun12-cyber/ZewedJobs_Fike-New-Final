const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Ad Campaign Schema
 */
const adCampaignSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  type: {
    type: String,
    required: true,
    enum: ['banner', 'sidebar', 'interstitial', 'native', 'video'],
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'AdClient',
    required: true,
  },
  budget: {
    total: {
      type: Number,
      required: true,
      min: 100,
    },
    spent: {
      type: Number,
      default: 0,
      min: 0,
    },
    remaining: {
      type: Number,
      default: function() { return this.budget.total; },
      min: 0,
    },
    currency: {
      type: String,
      default: 'ETB',
      enum: ['ETB', 'USD'],
    },
  },
  dates: {
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      default: function() {
        return Math.ceil((this.dates.end - this.dates.start) / (1000 * 60 * 60 * 24));
      },
    },
  },
  targeting: {
    demographics: {
      age: [String],
      gender: [String],
      education: [String],
      income: [String],
    },
    geographic: {
      regions: [String],
      cities: [String],
    },
    interests: {
      job_categories: [String],
      industries: [String],
      skills: [String],
    },
    behavioral: {
      job_search_frequency: [String],
      application_rate: [String],
      profile_completeness: [String],
      membership_tier: [String],
    },
    device: {
      types: [String],
      platforms: [String],
      browsers: [String],
    },
    positions: [String],
    categories: [String],
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft',
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
    conversionValue: {
      type: Number,
      default: 0,
    },
    ctr: {
      type: Number,
      default: 0,
    },
    cpc: {
      type: Number,
      default: 0,
    },
    cpm: {
      type: Number,
      default: 0,
    },
    roas: {
      type: Number,
      default: 0,
    },
    averageViewability: {
      type: Number,
      default: 0,
    },
  },
  creatives: [{
    type: Schema.Types.ObjectId,
    ref: 'AdCreative',
  }],
  primaryCreative: {
    type: Schema.Types.ObjectId,
    ref: 'AdCreative',
  },
  notes: {
    type: String,
    maxlength: 1000,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  activatedAt: Date,
  pausedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
}, {
  timestamps: true,
});

// Indexes
adCampaignSchema.index({ status: 1, 'dates.start': 1, 'dates.end': 1 });
adCampaignSchema.index({ client: 1, status: 1 });
adCampaignSchema.index({ createdBy: 1 });
adCampaignSchema.index({ 'budget.remaining': 1 });

// Methods
adCampaignSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         now >= this.dates.start && 
         now <= this.dates.end &&
         this.budget.remaining > 0;
};

adCampaignSchema.methods.calculateProgress = function() {
  const now = new Date();
  const totalDuration = this.dates.end - this.dates.start;
  const elapsed = now - this.dates.start;
  
  const timeProgress = Math.min(Math.max(elapsed / totalDuration, 0), 1) * 100;
  const budgetProgress = this.budget.total > 0 
    ? (this.budget.spent / this.budget.total) * 100 
    : 0;
  
  const overallProgress = (timeProgress * 0.4) + (budgetProgress * 0.6);
  
  return {
    time: Math.round(timeProgress),
    budget: Math.round(budgetProgress),
    overall: Math.round(overallProgress),
    daysRemaining: Math.max(Math.ceil((this.dates.end - now) / (1000 * 60 * 60 * 24)), 0),
  };
};

module.exports = mongoose.model('AdCampaign', adCampaignSchema);

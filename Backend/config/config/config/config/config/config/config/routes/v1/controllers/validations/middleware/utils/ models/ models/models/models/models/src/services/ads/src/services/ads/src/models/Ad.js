import mongoose from 'mongoose';

const adSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  advertiser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['featured', 'sponsored', 'premium', 'standard'],
    default: 'standard',
    required: true
  },
  placement: {
    type: String,
    enum: ['homepage', 'category', 'search', 'sidebar', 'top', 'email'],
    required: true
  },
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 1
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  impressions: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  cost: {
    type: Number,
    required: true
  },
  spent: {
    type: Number,
    default: 0
  },
  dailyLimit: {
    type: Number,
    default: 0
  },
  targetKeywords: [String],
  targetLocations: [String],
  targetCategories: [String],
  ctr: {
    type: Number,
    default: 0
  },
  lastClickedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
adSchema.index({ isActive: 1, endDate: 1 });
adSchema.index({ placement: 1, isActive: 1 });
adSchema.index({ advertiser: 1, createdAt: -1 });
adSchema.index({ job: 1, isActive: 1 });

// Virtual for remaining days
adSchema.virtual('remainingDays').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Middleware to update CTR before save
adSchema.pre('save', function(next) {
  if (this.impressions > 0) {
    this.ctr = (this.clicks / this.impressions) * 100;
  }
  next();
});

const Ad = mongoose.model('Ad', adSchema);
export default Ad;

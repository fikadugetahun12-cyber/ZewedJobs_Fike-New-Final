const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Ad Client Schema
 */
const adClientSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  website: {
    type: String,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: {
      type: String,
      default: 'Ethiopia',
    },
    postalCode: String,
  },
  contactPerson: {
    name: String,
    position: String,
    email: String,
    phone: String,
  },
  billing: {
    billingEmail: String,
    billingAddress: String,
    taxId: String,
    paymentTerms: {
      type: String,
      enum: ['net15', 'net30', 'net60', 'prepaid'],
      default: 'net30',
    },
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
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
}, {
  timestamps: true,
});

// Indexes
adClientSchema.index({ email: 1 }, { unique: true });
adClientSchema.index({ status: 1 });
adClientSchema.index({ createdBy: 1 });

module.exports = mongoose.model('AdClient', adClientSchema);

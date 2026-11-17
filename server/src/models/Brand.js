const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Petrol Pump / Fuel',
        'Banking & Finance',
        'Food & Dining',
        'Retail & Grocery',
        'Healthcare & Pharmacy',
        'Automobile & Service',
        'Other',
      ],
      default: 'Other',
    },
    logoUrl: {
      type: String,
      default: '',
    },
    escalationEmail: {
      type: String,
      required: [true, 'Corporate grievance / escalation email is required'],
      lowercase: true,
      trim: true,
    },
    totalComplaints: {
      type: Number,
      default: 0,
    },
    resolvedCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 3.5,
      min: 1.0,
      max: 5.0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for Resolution Rate %
brandSchema.virtual('resolutionRate').get(function () {
  if (!this.totalComplaints || this.totalComplaints === 0) return 100;
  return Math.round((this.resolvedCount / this.totalComplaints) * 100);
});

module.exports = mongoose.model('Brand', brandSchema);

const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand reference is required'],
      index: true,
    },
    branchName: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Branch address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    placeId: {
      type: String,
      default: null,
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'GeoJSON coordinates [longitude, latitude] are required'],
      },
    },
    ratingScore: {
      type: Number,
      default: 3.5,
      min: 1.0,
      max: 5.0,
    },
    totalComplaints: {
      type: Number,
      default: 0,
    },
    resolvedComplaints: {
      type: Number,
      default: 0,
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

// 2dsphere index for Geospatial queries
branchSchema.index({ location: '2dsphere' });
branchSchema.index({ brandId: 1, city: 1 });

branchSchema.virtual('resolutionRate').get(function () {
  if (!this.totalComplaints || this.totalComplaints === 0) return 100;
  return Math.round((this.resolvedComplaints / this.totalComplaints) * 100);
});

module.exports = mongoose.model('Branch', branchSchema);

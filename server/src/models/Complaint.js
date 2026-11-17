const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    actor: {
      type: String,
      default: 'System',
    },
    notes: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand reference is required'],
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch reference is required'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Rude Staff', 'Overcharging', 'Poor Hygiene', 'Service Delay', 'Other'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    evidenceUrls: {
      type: [String],
      default: [],
    },
    isGpsVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    userCoordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    distanceMeters: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['Open', 'Escalated', 'Resolved'],
      default: 'Open',
      index: true,
    },
    escalatedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolveToken: {
      type: String,
      index: true,
    },
    timeline: {
      type: [timelineEventSchema],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate human-friendly Ticket ID before validation
complaintSchema.pre('validate', function (next) {
  if (!this.ticketId) {
    const year = new Date().getFullYear();
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    this.ticketId = `ESC-${year}-${randomHex}`;
  }
  if (!this.resolveToken) {
    this.resolveToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  next();
});

// Helper virtual to calculate remaining SLA time in hours (48h window from creation)
complaintSchema.virtual('slaHoursRemaining').get(function () {
  if (this.status !== 'Open') return 0;
  const elapsedMs = Date.now() - new Date(this.createdAt).getTime();
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;
  const remainingMs = fortyEightHoursMs - elapsedMs;
  return Math.max(0, Math.round(remainingMs / (60 * 60 * 1000)));
});

module.exports = mongoose.model('Complaint', complaintSchema);

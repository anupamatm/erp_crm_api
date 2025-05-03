const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  stage: {
    type: String,
    enum: ['prospecting', 'qualification', 'needs-analysis', 'proposal', 'negotiation', 'closed-won', 'closed-lost'],
    default: 'prospecting'
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  probability: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  expectedCloseDate: {
    type: Date,
    required: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  source: {
    type: String,
    enum: ['website', 'referral', 'cold-call', 'trade-show', 'social-media', 'email-campaign', 'other'],
    required: true
  },
  description: String,
  nextAction: {
    type: String,
    enum: ['follow-up', 'meeting', 'proposal', 'presentation', 'contract', 'none'],
    default: 'follow-up'
  },
  nextActionDate: Date,
  competitors: [{
    name: String,
    strengths: [String],
    weaknesses: [String]
  }],
  lostReason: {
    type: String,
    enum: ['price', 'features', 'timing', 'competition', 'no-budget', 'no-decision', 'other'],
    sparse: true
  },
  activities: [{
    type: {
      type: String,
      enum: ['call', 'meeting', 'email', 'note'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    outcome: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  closedDate: Date,
  convertedToOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder'
  }
}, {
  timestamps: true
});

// Calculate weighted value based on probability
opportunitySchema.virtual('weightedValue').get(function() {
  return (this.value * this.probability) / 100;
});

// Pre-save middleware to update stage based on probability
opportunitySchema.pre('save', function(next) {
  if (this.probability === 100) {
    this.stage = 'closed-won';
  } else if (this.probability === 0 && this.stage !== 'prospecting') {
    this.stage = 'closed-lost';
  }
  next();
});

// Indexes for better query performance
opportunitySchema.index({ customer: 1 });
opportunitySchema.index({ stage: 1 });
opportunitySchema.index({ expectedCloseDate: 1 });
opportunitySchema.index({ assignedTo: 1 });
opportunitySchema.index({ createdAt: -1 });

const Opportunity = mongoose.model('Opportunity', opportunitySchema);

module.exports = Opportunity;
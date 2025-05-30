const mongoose = require('mongoose');

const accountTypes = ['Income', 'Expense', 'Asset', 'Liability'];

const accountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Income', 'Expense', 'Asset', 'Liability', 'Equity']
  },
  code: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  initialBalance: {
    type: Number,
    default: 0
  },
  openingBalance: {
    type: Number,
    default: 0
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  branch: {
    type: String,
    trim: true
  },
  ifscCode: {
    type: String,
    trim: true
  },
  swiftCode: {
    type: String,
    trim: true
  },
  taxId: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  website: {
    type: String,
    trim: true
  },
  parentAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  }
}, {
  timestamps: true
});
accountSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'account'
});
// Add virtual for transaction count
accountSchema.virtual('transactionCount').get(function() {
  return this._transactionCount;
});

// Add virtual for total amount
accountSchema.virtual('totalAmount').get(function() {
  return this._totalAmount;
});
// Enable virtuals for toJSON and toObject
accountSchema.set('toJSON', { virtuals: true });
accountSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Account', accountSchema);

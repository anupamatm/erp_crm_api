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
    enum: accountTypes
  },
  description: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add virtual for transaction count
accountSchema.virtual('transactionCount').get(function() {
  return this._transactionCount;
});

// Add virtual for total amount
accountSchema.virtual('totalAmount').get(function() {
  return this._totalAmount;
});

module.exports = mongoose.model('Account', accountSchema);

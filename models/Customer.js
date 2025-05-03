const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true
  },
  phone: String,
  address: String,
  company: String,
  notes: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);

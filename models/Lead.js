// erp-crm-backend/models/Lead.js
const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: String,
  company: String,
  source: {
    type: String,
    enum: ['website', 'referral', 'trade_show', 'cold_call', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  notes: String,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  expectedRevenue: Number,
  closeDate: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Lead', leadSchema);
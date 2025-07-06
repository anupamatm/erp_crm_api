const mongoose = require('mongoose');

const jobOpeningSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  requirements: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Open', 'Closed', 'On Hold'],
    default: 'Open',
  },
  postedDate: {
    type: Date,
    default: Date.now,
  },
  closingDate: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  timestamps: true,
});

const JobOpening = mongoose.model('JobOpening', jobOpeningSchema);

module.exports = JobOpening;

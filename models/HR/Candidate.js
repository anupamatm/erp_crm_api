const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: truea
  },
  position: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    required: true
  },
  stage: {
    type: String,
    enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'],
    default: 'applied'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  resumeUrl: String,
  notes: String,
  skills: [String],
  education: String,
  previousCompany: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Candidate', candidateSchema);
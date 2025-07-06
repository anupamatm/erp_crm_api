const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewDate: {
    type: Date,
    default: Date.now,
  },
  ratings: {
    qualityOfWork: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    teamwork: { type: Number, min: 1, max: 5 },
    productivity: { type: Number, min: 1, max: 5 },
  },
  comments: {
    type: String,
    trim: true,
  },
  goals: [{
    description: { type: String, required: true },
    deadline: { type: Date },
    completed: { type: Boolean, default: false },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Performance', performanceSchema);

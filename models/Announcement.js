const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  target: { 
    type: String, 
    enum: ['all', 'department', 'individual'],
    default: 'all' 
  },
  targetIds: [{ 
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetModel'
  }],
  targetModel: {
    type: String,
    enum: ['Department', 'Employee'],
    required: function() {
      return this.target !== 'all';
    }
  },
  startDate: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee',
    required: true 
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for better query performance
announcementSchema.index({ startDate: 1, endDate: 1 });
announcementSchema.index({ isActive: 1 });
announcementSchema.index({ target: 1, targetIds: 1 });

// Virtual for checking if announcement is currently active
announcementSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.isActive && 
         this.startDate <= now && 
         this.endDate >= now;
});

module.exports = mongoose.model('Announcement', announcementSchema);

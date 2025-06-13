const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String,
    trim: true 
  },
  file: {
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true }
  },
  documentType: { 
    type: String, 
    enum: ['policy', 'procedure', 'form', 'report', 'other'],
    required: true,
    default: 'other'
  },
  category: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  accessLevel: {
    type: String,
    enum: ['public', 'department', 'private'],
    default: 'private',
    required: true
  },
  accessibleBy: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'accessibleByModel'
  }],
  accessibleByModel: {
    type: String,
    enum: ['Employee', 'Department'],
    required: function() {
      return this.accessLevel !== 'public';
    }
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiryDate: {
    type: Date
  },
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    file: {
      name: String,
      url: String,
      type: String,
      size: Number
    },
    version: Number,
    updatedAt: Date,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    notes: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for better query performance
documentSchema.index({ title: 'text', description: 'text', tags: 'text' });
documentSchema.index({ documentType: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ accessLevel: 1 });
documentSchema.index({ 'accessibleBy': 1 });
documentSchema.index({ isActive: 1 });
documentSchema.index({ expiryDate: 1 });

// Virtual for checking if document is expired
documentSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// Pre-save hook to handle versioning
documentSchema.pre('save', async function(next) {
  if (this.isModified('file') && !this.isNew) {
    // If this is an update and file is modified, archive the current version
    if (!this.previousVersions) {
      this.previousVersions = [];
    }
    
    const currentVersion = this.version || 1;
    
    this.previousVersions.push({
      file: {
        name: this.file.name,
        url: this.file.url,
        type: this.file.type,
        size: this.file.size
      },
      version: currentVersion,
      updatedAt: this.updatedAt || new Date(),
      updatedBy: this.updatedBy,
      notes: `Version ${currentVersion}`
    });
    
    this.version = currentVersion + 1;
  }
  
  next();
});

module.exports = mongoose.model('Document', documentSchema);

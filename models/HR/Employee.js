const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    unique: true
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  phone: { 
    type: String,
    match: [/^[0-9\-\+\s()]*$/, 'Please use a valid phone number']
  },
  department: { 
    type: String, 
    required: true,
    ref: 'Department' 
  },
  position: { 
    type: String, 
    required: true 
  },
  dateOfJoining: { 
    type: Date, 
    default: Date.now,
    required: true 
  },
  salary: { 
    type: Number, 
    required: true,
    min: 0 
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    zipCode: { type: String, default: '' }
  },
  emergencyContact: {
    name: { type: String, default: '' },
    relation: { type: String, default: '' },
    phone: { 
      type: String, 
      default: '',
      match: [/^[0-9\-\+\s()]*$/, 'Please use a valid phone number']
    }
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'on-leave', 'terminated'], 
    default: 'active' 
  },
  documents: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now }
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes for better query performance
employeeSchema.index({ email: 1 });
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
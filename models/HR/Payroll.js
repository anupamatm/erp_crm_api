const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  month: { 
    type: Number, 
    required: true,
    min: 1,
    max: 12 
  },
  year: { 
    type: Number, 
    required: true,
    min: 2000,
    max: 2100
  },
  basicSalary: { 
    type: Number, 
    required: true,
    min: 0 
  },
  allowances: [{
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 }
  }],
  deductions: [{
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 }
  }],
  overtime: {
    hours: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  bonuses: [{
    name: String,
    amount: { type: Number, min: 0 }
  }],
  taxDetails: {
    taxableIncome: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    taxBracket: { type: String }
  },
  netSalary: { 
    type: Number, 
    required: true,
    min: 0 
  },
  paymentDate: { 
    type: Date,
    required: true 
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'check', 'cash', 'other'],
    required: true
  },
  paymentReference: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'processed', 'paid', 'cancelled'],
    default: 'draft'
  },
  notes: {
    type: String,
    trim: true
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  payslipGenerated: {
    type: Boolean,
    default: false
  },
  payslipUrl: {
    type: String,
    trim: true
  },
  // For tracking changes
  history: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    changedAt: Date,
    notes: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add compound index to ensure only one payroll per employee per month
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// Indexes for common queries
payrollSchema.index({ month: 1, year: 1 });
payrollSchema.index({ status: 1 });
payrollSchema.index({ paymentDate: 1 });
payrollSchema.index({ 'employee.department': 1 });

// Virtual for total allowances
payrollSchema.virtual('totalAllowances').get(function() {
  return this.allowances.reduce((sum, item) => sum + item.amount, 0);
});

// Virtual for total deductions
payrollSchema.virtual('totalDeductions').get(function() {
  return this.deductions.reduce((sum, item) => sum + item.amount, 0);
});

// Virtual for total bonuses
payrollSchema.virtual('totalBonuses').get(function() {
  return this.bonuses.reduce((sum, item) => sum + (item.amount || 0), 0);
});

// Virtual for gross salary (basic + allowances + bonuses + overtime)
payrollSchema.virtual('grossSalary').get(function() {
  return this.basicSalary + this.totalAllowances + this.totalBonuses + (this.overtime?.amount || 0);
});

// Pre-save hook to calculate totals and validate data
payrollSchema.pre('save', function(next) {
  // Calculate overtime amount if hours and rate are provided
  if (this.overtime && this.overtime.hours && this.overtime.rate) {
    this.overtime.amount = this.overtime.hours * this.overtime.rate;
  }
  
  // Ensure net salary is not negative
  if (this.netSalary < 0) {
    this.netSalary = 0;
  }
  
  // Add to history if status changed
  if (this.isModified('status') && this.history) {
    this.history.push({
      status: this.status,
      changedBy: this.processedBy,
      changedAt: new Date(),
      notes: this.notes
    });
  }
  
  next();
});

// Static method to check if payroll exists for employee in given month/year
payrollSchema.statics.existsForPeriod = async function(employeeId, month, year) {
  const count = await this.countDocuments({ 
    employee: employeeId,
    month,
    year
  });
  return count > 0;
};

// Method to generate payslip number
payrollSchema.methods.generatePayslipNumber = function() {
  const pad = (num) => num.toString().padStart(2, '0');
  return `PS-${this.year}${pad(this.month)}-${this.employee.employeeId || this.employee._id.toString().slice(-6).toUpperCase()}`;
};

module.exports = mongoose.model('Payroll', payrollSchema);

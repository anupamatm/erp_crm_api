// models/Quotation.js
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  product: {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String }
  },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  tax: { type: Number, default: 0, min: 0, max: 100 },
  subTotal: { type: Number, required: true }
});

const quotationSchema = new mongoose.Schema({
  // Required fields
  quoteNumber: { type: String, required: true, unique: true },
  customer: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    name: { type: String, required: true },
    email: { type: String }
  },
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
    default: 'draft',
    required: true 
  },
  validUntil: { type: Date, required: true },
  items: [itemSchema],
  
  // Optional fields
  terms: { type: String },
  notes: { type: String },
  
  // Calculated fields
  subtotal: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  
  // System fields
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Legacy fields (for backward compatibility)
  client: { type: String },
  number: { type: String },
  year: { type: String },
  currency: { type: String, default: 'USD' },
  date: { type: Date, default: Date.now },
  expireDate: { type: Date },
  note: { type: String },
  taxValue: { type: Number, default: 0 }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save hook to calculate totals
quotationSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);
  
  // Calculate total discount
  this.discountAmount = this.items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice;
    return sum + (itemTotal * (item.discount / 100));
  }, 0);
  
  // Calculate total tax
  this.taxAmount = this.items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice;
    const itemAfterDiscount = itemTotal * (1 - (item.discount / 100));
    return sum + (itemAfterDiscount * (item.tax / 100));
  }, 0);
  
  // Calculate total amount
  this.totalAmount = this.subtotal - this.discountAmount + this.taxAmount;
  
  // Set legacy fields for backward compatibility
  if (!this.quoteNumber) {
    const now = new Date();
    this.quoteNumber = `QT-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  
  if (!this.client && this.customer) {
    this.client = this.customer.name;
  }
  
  if (!this.year) {
    this.year = new Date().getFullYear().toString();
  }
  
  if (!this.expireDate && this.validUntil) {
    this.expireDate = this.validUntil;
  }
  
  if (!this.note && this.notes) {
    this.note = this.notes;
  }
  
  if (!this.taxValue) {
    this.taxValue = this.taxAmount;
  }
  
  next();
});

// Indexes
quotationSchema.index({ quoteNumber: 1 }, { unique: true });
quotationSchema.index({ 'customer._id': 1 });
quotationSchema.index({ status: 1 });
quotationSchema.index({ validUntil: 1 });
quotationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Quotation', quotationSchema);

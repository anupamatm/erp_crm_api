const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  description: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  subTotal: {
    type: Number,
    required: true
  }
});

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true
  },
  method: {
    type: String,
    enum: ['cash', 'bank_transfer', 'credit_card', 'check', 'other'],
    required: true
  },
  reference: String,
  notes: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  salesOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder'
  },
  items: [invoiceItemSchema],
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled', 'void'],
    default: 'draft'
  },
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  issueDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  payments: [paymentSchema],
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  notes: String,
  terms: String,
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Generate invoice number before saving
invoiceSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await mongoose.model('Invoice').countDocuments() + 1;
    this.invoiceNumber = `INV${year}${month}${count.toString().padStart(4, '0')}`;
  }
  next();
});

// Calculate totals before saving
invoiceSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.subTotal, 0);
  
  // Calculate total amount
  this.totalAmount = this.subtotal;
  if (this.discount) {
    this.totalAmount -= (this.totalAmount * (this.discount / 100));
  }
  if (this.tax) {
    this.totalAmount += (this.totalAmount * (this.tax / 100));
  }
  
  // Calculate balance
  this.amountPaid = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
  this.balance = this.totalAmount - this.amountPaid;
  
  // Update status based on payments
  if (this.balance === 0) {
    this.status = 'paid';
  } else if (this.amountPaid > 0) {
    this.status = 'partially_paid';
  } else if (this.dueDate < new Date() && this.status !== 'paid') {
    this.status = 'overdue';
  }
  
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema); 
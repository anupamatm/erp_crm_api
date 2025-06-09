// models/Quotation.js
const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  client: { type: String, required: true },
  number: { type: String, required: true },
  year: { type: String, required: true },
  currency: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], required: true },
  date: { type: Date, required: true },
  expireDate: { type: Date },
  note: { type: String },
  taxValue: { type: Number },
  items: [
    {
      name: { type: String },
      description: { type: String },
      quantity: { type: Number },
      price: { type: Number }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Quotation', quotationSchema);

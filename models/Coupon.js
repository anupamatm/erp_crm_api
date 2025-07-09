// e:\mern\erp-crm\erp-crm-backend\models\Coupon.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountType: { 
    type: String, 
    enum: ['percentage', 'fixed'], 
    required: true 
  },
  discountValue: { type: Number, required: true },
  minPurchase: { type: Number, default: 0 },
  maxDiscount: Number,
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  usageLimit: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
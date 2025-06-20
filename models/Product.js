const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  price: {
    type: Number,
    required: true,
  },
  category: String,
  stock: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['in_stock', 'out_of_stock', 'discontinued', 'not_set'],
    default: 'not_set',
  },
  imageUrl: String,
}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);

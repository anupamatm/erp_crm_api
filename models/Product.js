const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  stock: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['in-stock', 'out-of-stock', 'discontinued', 'not-set'],
    default: 'not-set',
  },
  imageUrl: String,
  // Add any other fields as needed
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
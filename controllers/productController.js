const Product = require('../models/Product');

// Helper function to format response
const formatResponse = (data, page, limit, total) => ({
  success: true,
  data,
  pagination: {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
    itemsPerPage: limit,
  },
});

exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(400).json({
      success: false,
      error: err.message,
      message: 'Failed to create product'
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, minPrice, maxPrice } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json(formatResponse(products, page, limit, total));
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      message: 'Failed to fetch products'
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: 'The requested product does not exist'
      });
    }
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      message: 'Failed to fetch product'
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: 'The requested product does not exist'
      });
    }
    res.status(200).json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(400).json({
      success: false,
      error: err.message,
      message: 'Failed to update product'
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: 'The requested product does not exist'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      message: 'Failed to delete product'
    });
  }
};

// erp-crm-backend/routes/productRoutes.js
const express = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');

const router = express.Router();

// Roles for product routes
const adminAndInventoryRoles = ['admin', 'inventory_manager'];
const allRoles = ['admin', 'sales_exec', 'sales_manager', 'inventory_manager', 'finance'];

// Apply authentication and authorization globally for product routes
router.use(authenticate);

// ─── Create a product ───
router.post('/', authorize(adminAndInventoryRoles), productController.createProduct);

// ─── List all products ───
router.get('/', authorize(allRoles), productController.getAllProducts);

// ─── Get single product by ID ───
router.get('/:id', authorize(allRoles), productController.getProductById);

// ─── Update a product ───
router.put('/:id', authorize(adminAndInventoryRoles), productController.updateProduct);

// ─── Delete a product ───
router.delete('/:id', authorize(['admin']), productController.deleteProduct);

router.get('/low-stock', productController.getLowStockProducts);


module.exports = router;

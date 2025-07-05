const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/authMiddleware');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changeUserRole,
  createUser  
} = require('../controllers/userController');
const customerController = require('../controllers/customerController');

// Customer self-service profile routes
// Allow customer to get their own profile by user id
router.get('/customers/:id/profile', authorize(['customer', 'admin']), customerController.getCustomerProfile);
// Allow customer to update their own profile by user id
router.put('/customers/:id/profile', authorize(['customer', 'admin']), customerController.updateCustomerProfile);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin, Sales Manager
router.get('/users', authorize(['admin', 'sales_manager']), getAllUsers);

// Apply admin middleware to remaining routes
router.use(authorize(['admin']));

// @route   POST /api/admin/users
// @desc    Create new user
// @access  Private/Admin
router.post('/users', createUser);

// @route   GET /api/admin/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get('/users/:id', getUserById);

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/users/:id', updateUser);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/users/:id', deleteUser);

// @route   PUT /api/admin/users/:id/role
// @desc    Change user role
// @access  Private/Admin
router.put('/users/:id/role', changeUserRole);

module.exports = router;
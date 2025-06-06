const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/authMiddleware');
const { 
  getAccounts,
  createAccount,
  getAccountById,
  updateAccount,
  deleteAccount,
  getTransactions,
  createTransaction,
  getSummary
} = require('../controllers/financeController');
const { body } = require('express-validator');

// Roles that can access finance routes
const financeRoles = ['admin', 'finance', 'sales_manager', 'sales_exec'];

// Get all accounts
router.get('/accounts', authorize(financeRoles), getAccounts);

// Create new account
router.post(
  '/accounts',
  authorize(financeRoles),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('type').isIn(['Income', 'Expense', 'Asset', 'Liability', 'Equity'])
      .withMessage('Invalid account type'),
    body('initialBalance').optional().isNumeric().toFloat(),
    body('openingBalance').optional().isNumeric().toFloat(),
    body('currentBalance').optional().isNumeric().toFloat(),
    body('isActive').optional().isBoolean(),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('website').optional().isURL().withMessage('Invalid URL format'),
    // Add validation for other fields as needed
  ],
  createAccount
);

// Get account by ID
router.get('/accounts/:id', authorize(financeRoles), getAccountById);

// Update account
router.put('/accounts/:id', authorize(financeRoles), updateAccount);

// Delete account
router.delete('/accounts/:id', authorize(   financeRoles), deleteAccount);

// Get all transactions
router.get('/transactions', authorize(financeRoles), getTransactions);

// Create new transaction
router.post(
  '/transactions',
  authorize(financeRoles),
  [
    body('date').isDate().withMessage('Invalid date format'),
    body('type').isIn(['Income', 'Expense']).withMessage('Invalid transaction type'),
    body('account').isMongoId().withMessage('Invalid account ID'),
    body('amount').isNumeric().withMessage('Amount must be a number')
  ],
  createTransaction
);

// Get transaction summary
router.get('/summary', authorize(financeRoles), getSummary);

module.exports = router;

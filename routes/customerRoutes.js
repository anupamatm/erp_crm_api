// routes/customerRoutes.js
const express = require('express');
const { authorize } = require('../middleware/authMiddleware');
const customerController = require('../controllers/customerController');
const SalesOrder = require('../models/SalesOrder');
const Invoice = require('../models/Invoice');

const router = express.Router();

// ─── Create a customer ───
// Only admin, sales_manager or sales_exec can create
router.post(
  '/',
  
  authorize(['admin', 'sales_manager', 'sales_exec']),
  customerController.createCustomer
);

// ─── List all customers ───
// Only admin, sales_manager, sales_exec can view all customers
router.get(
  '/',
 
  authorize(['admin', 'sales_manager', 'sales_exec']),
  customerController.getAllCustomers
);

// Get customer statistics
router.get(
  '/statistics',
 
  authorize(['admin', 'sales_manager']),
  customerController.getStatistics
);

// ─── Get one customer ───
// Only admin, sales_manager, sales_exec can view customer details
router.get(
  '/:id',
 
  authorize(['admin', 'sales_manager', 'sales_exec']),
  customerController.getCustomerById
);

// ─── Update a customer ───
// Only admin or sales_manager can update
router.put(
  '/:id',
  
  authorize(['admin', 'sales_manager']),
  customerController.updateCustomer
);

// ─── Delete a customer ───
// Only admin can delete
router.delete(
  '/:id',
  
  authorize(['admin']),
  customerController.deleteCustomer
);

// Get customer's orders
router.get('/:id/orders',  authorize(['customer']), async (req, res) => {
  try {
    const orders = await SalesOrder.find({ customer: req.params.id })
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

// Get customer's invoices
router.get('/:id/invoices', authorize(['customer']), async (req, res) => {
  try {
    const invoices = await Invoice.find({ customer: req.params.id })
      .populate('items.product', 'name')
      .populate('salesOrder', 'orderNumber')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching invoices' });
  }
});

// Get customer's payment history
router.get('/:id/payments', authorize(['customer']), async (req, res) => {
  try {
    const invoices = await Invoice.find({ customer: req.params.id })
      .populate('payments.recordedBy', 'name')
      .sort({ createdAt: -1 });
    
    const paymentHistory = invoices.reduce((acc, invoice) => {
      return [...acc, ...invoice.payments];
    }, []);
    
    res.json(paymentHistory);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching payment history' });
  }
});

module.exports = router;

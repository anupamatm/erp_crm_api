const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const salesController = require('../controllers/salesController');
const opportunityController = require('../controllers/opportunityController');
const invoiceController = require('../controllers/invoiceController');

// Sales Order Routes
router.get('/dashboard', authorize(['admin', 'sales_manager', 'sales_exec']), salesController.getDashboardData);
router.get('/orders', authorize(['admin', 'sales_manager', 'sales_exec']), salesController.getAllOrders);
router.post('/orders', authorize(['admin', 'sales_manager']), salesController.createOrder);
router.get('/orders/:id', authorize(['admin', 'sales_manager', 'sales_exec']), salesController.getOrderById);
router.put('/orders/:id', authorize(['admin', 'sales_manager']), salesController.updateOrder);
router.delete('/orders/:id', authorize(['admin']), salesController.deleteOrder);
router.get('/last', salesController.getLastOrder);

// Opportunity Routes
router.get('/opportunities/statistics', authorize(['admin', 'sales_manager', 'sales_exec']), opportunityController.getStatistics);
router.get('/opportunities', authorize(['admin', 'sales_manager', 'sales_exec']), opportunityController.getAllOpportunities);
router.post('/opportunities', authorize(['admin', 'sales_manager']), opportunityController.createOpportunity);
router.get('/opportunities/:id', authorize(['admin', 'sales_manager', 'sales_exec']), opportunityController.getOpportunityById);
router.put('/opportunities/:id', authorize(['admin', 'sales_manager']), opportunityController.updateOpportunity);
router.delete('/opportunities/:id', authorize(['admin']), opportunityController.deleteOpportunity);
router.post('/opportunities/:id/activities', authorize(['admin', 'sales_manager', 'sales_exec']), opportunityController.addActivity);
router.post('/opportunities/:id/convert-to-order', authorize(['admin', 'sales_manager']), opportunityController.convertToOrder);

// Invoice Routes
router.get('/invoices', authorize(['admin', 'sales_manager', 'sales_exec']), invoiceController.getAllInvoices);
router.post('/invoices', authorize(['admin', 'sales_manager']), invoiceController.createInvoice);
router.get('/invoices/:id', authorize(['admin', 'sales_manager', 'sales_exec']), invoiceController.getInvoiceById);
router.put('/invoices/:id', authorize(['admin', 'sales_manager']), invoiceController.updateInvoice);
router.delete('/invoices/:id', authorize(['admin']), invoiceController.deleteInvoice);
router.post('/invoices/:id/payments', authorize(['admin', 'sales_manager']), invoiceController.recordPayment);
router.get('/invoices/statistics', authorize(['admin', 'sales_manager', 'sales_exec']), invoiceController.getStatistics);

module.exports = router; 
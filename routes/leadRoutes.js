// erp-crm-backend/routes/leadRoutes.js
const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Roles that can access lead routes
const leadRoles = ['admin', 'sales_manager', 'sales_exec'];

// Apply authentication and authorization to all lead routes
router.use(authorize(leadRoles));

// CSV Import Route
router.post('/import', leadController.importLeads);
// Lead routes
router.get('/', leadController.getLeads);
router.get('/stats', leadController.getLeadsStats);
router.get('/status/:status', leadController.getLeadsByStatus);
router.get('/source/:source', leadController.getLeadsBySource);
router.get('/:id', leadController.getLead);
router.post('/', leadController.createLead);
router.put('/:id', leadController.updateLead);
router.delete('/:id', leadController.deleteLead);
router.put('/:id/convert', leadController.convertToCustomer); // New route for converting lead to customer

module.exports = router;

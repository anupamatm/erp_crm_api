const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const Customer = require('../models/Customer');
const SalesOrder = require('../models/SalesOrder');
const Invoice = require('../models/Invoice');

// Middleware to ensure the user is a customer
const isCustomer = [authenticate, authorize(['customer'])];

// Get customer's profile
router.get('/profile', isCustomer, async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user._id })
      .select('-__v -createdAt -updatedAt')
      .lean();

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (err) {
    console.error('Error fetching customer profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update customer profile
router.put('/profile', isCustomer, async (req, res) => {
  try {
    const { name, email, phone, address, company, notes } = req.body;
    
    const customer = await Customer.findOneAndUpdate(
      { user: req.user._id },
      { $set: { name, email, phone, address, company, notes } },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Update user email if it was changed
    if (email) {
      await User.findByIdAndUpdate(
        req.user._id,
        { $set: { email, name } },
        { new: true, runValidators: true }
      );
    }

    res.json({
      message: 'Profile updated successfully',
      customer: {
        ...customer.toJSON(),
        email
      }
    });
  } catch (err) {
    console.error('Error updating customer profile:', err);
    
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// Get customer's orders
router.get('/orders', isCustomer, async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const orders = await SalesOrder.find({ customer: customer._id })
      .populate('items.product', 'name price')
      .sort({ createdAt: -1 });
      
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get order details
router.get('/orders/:orderId', isCustomer, async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const order = await SalesOrder.findOne({
      _id: req.params.orderId,
      customer: customer._id
    })
    .populate('items.product', 'name price')
    .populate('shippingAddress billingAddress', 'name line1 line2 city state postalCode country');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error('Error fetching order details:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get customer's invoices
router.get('/invoices', isCustomer, async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const invoices = await Invoice.find({ customer: customer._id })
      .populate('order', 'orderNumber')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get invoice details
router.get('/invoices/:invoiceId', isCustomer, async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.invoiceId,
      customer: customer._id
    })
    .populate('order', 'orderNumber')
    .populate('items.product', 'name description price')
    .populate('customer', 'name email phone company')
    .populate('billingAddress shippingAddress', 'name line1 line2 city state postalCode country');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (err) {
    console.error('Error fetching invoice details:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get payment history
router.get('/payments', isCustomer, async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const invoices = await Invoice.find({ 
      customer: customer._id,
      'payments.0': { $exists: true } // Only invoices with payments
    })
    .select('invoiceNumber payments amountPaid paymentStatus')
    .sort({ 'payments.date': -1 });

    const paymentHistory = [];
    
    invoices.forEach(invoice => {
      invoice.payments.forEach(payment => {
        paymentHistory.push({
          _id: payment._id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceId: invoice._id,
          amount: payment.amount,
          date: payment.date,
          method: payment.method,
          status: payment.status,
          notes: payment.notes
        });
      });
    });

    // Sort by payment date (newest first)
    paymentHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(paymentHistory);
  } catch (err) {
    console.error('Error fetching payment history:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

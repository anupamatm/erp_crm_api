const Invoice = require('../models/Invoice');
const SalesOrder = require('../models/SalesOrder');

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(query)
      .populate('customer', 'name email')
      .populate('salesOrder', 'orderNumber')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(query);

    res.json({
      invoices,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Error fetching invoices' });
  }
};

// Create a new invoice
exports.createInvoice = async (req, res) => {
  try {
    let invoiceData = { ...req.body };

    // If creating invoice from sales order, populate data
    if (req.body.salesOrder) {
      const salesOrder = await SalesOrder.findById(req.body.salesOrder)
        .populate('customer')
        .populate('items.product');

      if (!salesOrder) {
        return res.status(404).json({ error: 'Sales order not found' });
      }

      invoiceData = {
        ...invoiceData,
        customer: salesOrder.customer._id,
        items: salesOrder.items.map(item => ({
          product: item.product._id,
          description: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          tax: item.tax,
          subTotal: item.subtotal
        })),
        subtotal: salesOrder.subtotal,
        discount: salesOrder.discountAmount,
        tax: salesOrder.taxAmount,
        totalAmount: salesOrder.totalAmount,
        billingAddress: salesOrder.billingAddress
      };
    }

    // Calculate balance (totalAmount - amountPaid)
    const totalAmount = invoiceData.totalAmount || 0;
    const amountPaid = invoiceData.amountPaid || 0;
    const balance = totalAmount - amountPaid;

    const invoice = new Invoice({
      ...invoiceData,
      createdBy: req.user._id,
      issueDate: invoiceData.issueDate || new Date(),
      dueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      amountPaid: amountPaid,
      balance: balance,
      status: amountPaid >= totalAmount ? 'paid' : (amountPaid > 0 ? 'partially_paid' : 'draft')
    });

    await invoice.save();
    
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customer', 'name email')
      .populate('salesOrder', 'orderNumber')
      .populate('items.product', 'name');

    res.status(201).json(populatedInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Error creating invoice' });
  }
};

// Get a specific invoice
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('salesOrder', 'orderNumber')
      .populate('items.product', 'name price')
      .populate('createdBy', 'name')
      .populate('payments.recordedBy', 'name');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Error fetching invoice' });
  }
};

// Update an invoice
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('customer', 'name email')
    .populate('salesOrder', 'orderNumber')
    .populate('items.product', 'name price');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Error updating invoice' });
  }
};

// Delete an invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Error deleting invoice' });
  }
};

// Record payment for an invoice
exports.recordPayment = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    invoice.payments.push({
      ...req.body,
      recordedBy: req.user._id,
      date: new Date()
    });

    await invoice.save();
    
    const updatedInvoice = await Invoice.findById(req.params.id)
      .populate('payments.recordedBy', 'name');

    res.json(updatedInvoice.payments[updatedInvoice.payments.length - 1]);
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Error recording payment' });
  }
};

// Get invoice statistics
exports.getStatistics = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

    const statistics = await Invoice.aggregate([
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalInvoiced: { $sum: '$totalAmount' },
                totalPaid: { $sum: '$amountPaid' },
                totalOutstanding: { $sum: '$balance' },
                count: { $sum: 1 }
              }
            }
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                total: { $sum: '$totalAmount' }
              }
            }
          ],
          recent: [
            {
              $match: {
                createdAt: { $gte: thirtyDaysAgo }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                total: { $sum: '$totalAmount' }
              }
            }
          ]
        }
      }
    ]);

    res.json({
      overall: statistics[0].overall[0] || {
        totalInvoiced: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        count: 0
      },
      byStatus: statistics[0].byStatus,
      recent: statistics[0].recent[0] || {
        count: 0,
        total: 0
      }
    });
  } catch (error) {
    console.error('Error fetching invoice statistics:', error);
    res.status(500).json({ error: 'Error fetching invoice statistics' });
  }
}; 
// routes/quotations.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Quotation = require('../models/Quotation');

// GET all quotations with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const total = await Quotation.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    const quotations = await Quotation.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    res.json({
      docs: quotations,
      total,
      limit,
      page,
      pages: totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    });
  } catch (err) {
    console.error('Error fetching quotations:', err);
    res.status(500).json({ 
      message: 'Failed to fetch quotations', 
      error: err.message 
    });
  }
});

// GET a specific quotation by ID
router.get('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid quotation ID' });
  }

  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching quotation', error: err.message });
  }
});

// POST - create a new quotation
router.post('/', async (req, res) => {
  try {
    console.log('Incoming Quotation:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    const requiredFields = ['customer', 'validUntil'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        missingFields,
        receivedData: Object.keys(req.body)
      });
    }
    
    // Generate a quote number if not provided
    const generateQuoteNumber = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
      return `QT-${year}${month}${day}-${random}`;
    };

    // Calculate totals
    const items = (req.body.items || []).map(item => {
      const quantity = item.quantity || 1;
      const unitPrice = item.unitPrice || 0;
      const discount = item.discount || 0;
      const tax = item.tax || 0;
      const subTotal = quantity * unitPrice;
      const discountAmount = subTotal * (discount / 100);
      const taxableAmount = subTotal - discountAmount;
      const taxAmount = taxableAmount * (tax / 100);
      
      return {
        product: {
          name: item.product?.name || 'Unnamed Product',
          price: unitPrice,
          description: item.product?.description || ''
        },
        quantity,
        unitPrice,
        discount,
        tax,
        subTotal
      };
    });
    
    // Calculate grand totals
    const subtotal = items.reduce((sum, item) => sum + item.subTotal, 0);
    const discountAmount = items.reduce((sum, item) => {
      return sum + (item.subTotal * (item.discount / 100));
    }, 0);
    const taxAmount = items.reduce((sum, item) => {
      const itemTotal = item.subTotal * (1 - (item.discount / 100));
      return sum + (itemTotal * (item.tax / 100));
    }, 0);
    const totalAmount = subtotal - discountAmount + taxAmount;

    // Map incoming data to the new model structure
    const quotationData = {
      quoteNumber: req.body.quoteNumber || generateQuoteNumber(),
      customer: {
        _id: req.body.customer._id,
        name: req.body.customer.name,
        email: req.body.customer.email
      },
      validUntil: new Date(req.body.validUntil),
      status: req.body.status || 'draft',
      items,
      terms: req.body.terms,
      notes: req.body.notes,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      
      // Set createdBy/updatedBy if user is authenticated
      ...(req.user && { 
        createdBy: req.user._id,
        updatedBy: req.user._id 
      })
    };
    
    console.log('Attempting to save quotation with data:', JSON.stringify(quotationData, null, 2));
    
    // Create a new quotation document
    const newQuotation = new Quotation(quotationData);
    
    // Validate the document manually to get detailed errors
    try {
      await newQuotation.validate();
      console.log('Validation passed, saving to database...');
      
      const saved = await newQuotation.save();
      console.log('Quotation saved successfully:', saved.quoteNumber);
      
      // Populate the createdBy/updatedBy fields if they exist
      const populated = await Quotation.findById(saved._id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .lean();
      
      res.status(201).json(populated);
    } catch (validationError) {
      console.error('Validation error details:', validationError);
      
      // Handle validation errors
      if (validationError.name === 'ValidationError') {
        const errors = [];
        
        // Log all validation errors
        for (const field in validationError.errors) {
          errors.push({
            field,
            message: validationError.errors[field].message,
            value: validationError.errors[field].value,
            kind: validationError.errors[field].kind,
            path: validationError.errors[field].path,
            properties: validationError.errors[field].properties
          });
        }
        
        console.error('Detailed validation errors:', JSON.stringify(errors, null, 2));
        
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.map(e => ({
            field: e.path,
            message: e.message,
            value: e.value,
            kind: e.kind
          })),
          receivedData: req.body,
          errorDetails: errors
        });
      }
      
      // Re-throw other errors
      throw validationError;
    }
  } catch (err) {
    console.error('POST error:', err);
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      console.error('Duplicate key error:', err.keyValue);
      return res.status(400).json({
        message: 'Duplicate key error',
        duplicateField: Object.keys(err.keyValue)[0],
        duplicateValue: Object.values(err.keyValue)[0]
      });
    }
    
    // Generic error response
    res.status(500).json({ 
      message: 'Failed to create quotation',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// PUT - update an existing quotation
router.put('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid quotation ID' });
  }

  try {
    const updated = await Quotation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Quotation not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update quotation', error: err.message });
  }
});

// DELETE - remove a quotation
router.delete('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid quotation ID' });
  }

  try {
    const deleted = await Quotation.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Quotation not found' });
    res.json({ message: 'Quotation deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete quotation', error: err.message });
  }
});

module.exports = router;

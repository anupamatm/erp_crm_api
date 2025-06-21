// routes/quotations.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Quotation = require('../models/Quotation');

// GET all quotations
router.get('/', async (req, res) => {
  try {
    const quotations = await Quotation.find();
    res.json(quotations);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch quotations', error: err.message });
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
    console.log('Incoming Quotation:', req.body); // Log incoming data
    const newQuotation = new Quotation(req.body);
    const saved = await newQuotation.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('POST error:', err); // Catch and log validation errors
    res.status(500).json({ message: 'Failed to create quotation', error: err.message });
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

const Quotation = require('../models/Quotation');

// Create new quotation
exports.createQuotation = async (req, res) => {
  try {
    const quotation = new Quotation(req.body);
    await quotation.save();
    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};

// Get all quotations
exports.getQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find();
    res.status(200).json(quotations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get a single quotation
exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a quotation
exports.updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Convert to order
exports.convertToOrder = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    quotation.status = 'accepted'; // Mark it accepted
    await quotation.save();

    // Here you could also create an `Order` document if you have one
    res.json({ message: 'Quotation converted to order', quotation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



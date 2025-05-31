const Lead = require('../models/Lead');
const Customer =require("../models/Customer")// Assuming Customer model is defined
const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');

// Get all leads
const getLeads = async (req, res) => {
  try {
    const leads = await Lead.find()
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(leads);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get single lead
const getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');
    
    if (!lead) {
      return res.status(404).json({ msg: 'Lead not found' });
    }

    res.json(lead);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Lead not found' });
    }
    res.status(500).send('Server Error');
  }
};

// Create lead
const createLead = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, company, source, status, priority, notes, assignedTo, expectedRevenue, closeDate, user } = req.body;

    const lead = new Lead({
      user: new mongoose.Types.ObjectId(user),
      firstName,
      lastName,
      email,
      phone,
      company,
      source,
      status,
      priority,
      notes,
      assignedTo,
      expectedRevenue,
      closeDate
    });

    await lead.save();
    res.status(201).json(lead);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update lead
const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ msg: 'Lead not found' });
    }

    // Check if user is authorized to update this lead
    if (lead.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    lead.set(req.body);
    await lead.save();
    res.json(lead);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Delete lead
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ msg: 'Lead not found' });
    }

    // Check if user is authorized to delete this lead
    if (lead.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await lead.remove();
    res.json({ msg: 'Lead removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get leads by status
const getLeadsByStatus = async (req, res) => {
  try {
    const status = req.params.status;
    const leads = await Lead.find({ status })
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json(leads);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get leads by source
const getLeadsBySource = async (req, res) => {
  try {
    const source = req.params.source;
    const leads = await Lead.find({ source })
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json(leads);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get leads statistics
const getLeadsStats = async (req, res) => {
  try {
    // Get total leads and revenue
    const totalStats = await Lead.aggregate([
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          totalRevenue: { $sum: '$expectedRevenue' }
        }
      }
    ]);

    // Get status counts
    const statusStats = await Lead.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert status stats to object
    const statusCount = statusStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {
      new: 0,
      contacted: 0,
      qualified: 0,
      converted: 0,
      lost: 0
    });

    res.json({
      totalLeads: totalStats[0]?.totalLeads || 0,
      totalRevenue: totalStats[0]?.totalRevenue || 0,
      statusCount: statusCount
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Convert lead to customer
const convertToCustomer = async (req, res) => {
  try {
    const leadId = req.params.id;
    const { name, email, phone, company, notes } = req.body;

    // Find the lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ msg: 'Lead not found' });
    }

    // Create customer
    const customer = new Customer({
      user: lead.user,
      name: name || `${lead.firstName} ${lead.lastName}`,
      email: email || lead.email,
      phone: phone || lead.phone,
      company: company || lead.company,
      notes: notes || lead.notes
    });

    await customer.save();

    // Update lead status
    lead.status = 'converted';
    lead.assignedTo = null; // Clear assignedTo since it's now a customer
    await lead.save();

    res.status(200).json({
      msg: 'Lead converted to customer successfully',
      customer
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Import multiple leads from CSV
const importLeads = async (req, res) => {
  try {
    const file = req.file; // The uploaded file
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];

    // Parse the CSV file
    fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row); // Collect parsed rows
      })
      .on('end', async () => {
        try {
          // Validate data (optional, depending on your requirements)
          const validLeads = results.filter(lead => lead.firstName && lead.email);
          
          if (validLeads.length === 0) {
            return res.status(400).json({ message: 'No valid leads found in CSV' });
          }

          // Enrich lead data if needed (e.g., assigning current user)
          const enrichedLeads = validLeads.map(lead => ({
            ...lead,
            user: req.user.id // Assuming current user is available via req.user
          }));

          // Insert the leads into the database
          await Lead.insertMany(enrichedLeads);
          res.status(200).json({ message: 'Leads imported successfully' });
        } catch (error) {
          console.error('Error saving leads:', error);
          res.status(500).json({ message: 'Error while saving leads to the database' });
        } finally {
          // Clean up uploaded file
          fs.unlinkSync(file.path);
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        res.status(500).json({ message: 'Error parsing CSV file' });
      });
  } catch (error) {
    console.error('Error during lead import:', error);
    res.status(500).json({ message: 'Server error during import' });
  }
};

module.exports = {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getLeadsByStatus,
  getLeadsBySource,
  getLeadsStats,
  convertToCustomer,
  importLeads
};

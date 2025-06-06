const Customer = require('../models/Customer');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Create customer with user account
exports.createCustomer = async (req, res) => {
  try {
    const { name, email, password, phone, address, company, notes } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user account
    const user = new User({
      name,
      email,
      password,
      role: 'customer'
    });
    await user.save();

    // Create customer profile
    const customer = new Customer({
      user: user._id,
      name,
      email,
      phone,
      address,
      company,
      notes,
      status: 'active'
    });
    await customer.save();
    
    res.status(201).json({
      message: 'Customer created successfully',
      customer: {
        ...customer.toJSON(),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    // If customer creation fails, clean up the user
    if (err.customer && err.user) {
      await User.findByIdAndDelete(err.user._id);
    }
    res.status(400).json({ error: err.message });
  }
};

// Get all customers with pagination and user data
exports.getAllCustomers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  try {
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      Customer.find()
        .populate('user', 'name email role')
        .skip(skip)
        .limit(limit),
      Customer.countDocuments()
    ]);

    res.json({
      data: customers,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get one customer with user data
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('user', 'name email role');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, company, notes, status } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Update user information if email or name changed
    if (name || email) {
      const user = await User.findById(customer.user);
      if (!user) {
        throw new Error('Associated user not found');
      }

      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new Error('Email already in use');
        }
        user.email = email;
      }
      if (name) {
        user.name = name;
      }
      await user.save();
    }

    // Update customer profile
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, address, company, notes, status },
      { new: true }
    ).populate('user', 'name email role');

    res.json(updatedCustomer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete customer and associated user account
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Delete user account
    await User.findByIdAndDelete(customer.user);
    
    // Delete customer profile
    await Customer.findByIdAndDelete(req.params.id);

    res.json({ message: 'Customer and associated user account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get customer profile
exports.getCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.params.id })
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
};

// Update customer profile
exports.updateCustomerProfile = async (req, res) => {
  try {
    const { name, email, phone, address, company, notes } = req.body;
    
    // Find and update customer
    const customer = await Customer.findOneAndUpdate(
      { user: req.params.id },
      { $set: { name, email, phone, address, company, notes } },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Update user email if it was changed
    if (email) {
      await User.findByIdAndUpdate(
        req.params.id,
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
    
    // Handle duplicate key error for email
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
};

// Get customer statistics
exports.getStatistics = async (req, res) => {
  try {
    const [totalStats, statusStats, recentStats] = await Promise.all([
      // Get total customers
      Customer.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            inactive: {
              $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
            }
          }
        }
      ]),

      // Get customers by status
      Customer.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Get recent customers (last 30 days)
      Customer.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      total: totalStats[0] || { total: 0, active: 0, inactive: 0 },
      byStatus: statusStats,
      recent: recentStats[0] || { count: 0 }
    });
  } catch (err) {
    console.error('Error getting customer statistics:', err);
    res.status(500).json({ error: 'Error getting customer statistics' });
  }
};




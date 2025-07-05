const User = require('../models/User');
const Customer = require('../models/Customer');

// @desc    Get all users with pagination, search, and role filtering
// @route   GET /api/admin/users
// @query   page - Page number (default: 1)
// @query   limit - Number of items per page (default: 10)
// @query   search - Search term (searches in name and email)
// @query   role - Filter by user role (e.g., 'sales_exec')
// @access  Private/Admin, Sales Manager
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role;
    const skip = (page - 1) * limit;

    // Build the query for search and role filtering
    const query = {};
    
    // Add search conditions
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add role filter if provided
    if (role) {
      query.role = role;
    }

    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    // Get paginated users
    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      data: users,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error getting users:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error('Error getting user:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// In controllers/userController.js
exports.createUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  console.log('CREATE USER endpoint hit', { name, email, role });

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Validate role
    const validRoles = ['admin', 'sales_manager', 'sales_exec', 'inventory_mgr', 'support', 'hr', 'finance', 'customer'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Create new user
    const user = new User({ name, email, password, role });
    
    await user.save();
     // If user is a customer, create a customer profile
     if (role === 'customer') {
      const customer = new Customer({
        user: user._id,
        name,
        email,
        status: 'active' // default status
      });
      await customer.save();
    }
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });

  } catch (err) {
    console.error('Error creating user:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Track if user was a customer before role change
    const wasCustomer = user.role === 'customer';

    // Update user fields
    user.name = name || user.name;
    user.email = email || user.email;
    if (role) user.role = role;
    if (password) user.password = password;

    await user.save();

    // If user is/was a customer, update or remove Customer record
    if (role === 'customer' || wasCustomer) {
      let customer = await Customer.findOne({ user: user._id });
      if (role === 'customer') {
        // Update or create customer
        if (customer) {
          if (name) customer.name = name;
          if (email) customer.email = email;
          await customer.save();
        } else {
          await Customer.create({ user: user._id, name: user.name, email: user.email, status: 'active' });
        }
      } else if (wasCustomer && role !== 'customer' && customer) {
        // If role changed away from customer, remove customer record
        await customer.deleteOne();
      }
    }

    user = user.toObject();
    delete user.password;
    res.status(200).json({ message: 'User updated successfully', user });
  } catch (err) {
    console.error('Error updating user:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Remove associated customer if user was a customer
    if (user.role === 'customer') {
      await Customer.deleteOne({ user: user._id });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Change user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !['admin', 'sales_manager', 'sales_exec', 'inventory_mgr', 'support', 'hr', 'finance', 'customer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.role = role;
    await user.save();
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json({
      message: 'User role updated successfully',
      user: userResponse
    });
  } catch (err) {
    console.error('Error changing user role:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
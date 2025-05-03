const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
  console.log('SIGNUP endpoint hit');
  const { name, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: 'User already exists' });

    if (!role || !['admin','sales_manager','sales_exec','inventory_mgr','support','hr','finance','customer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = new User({ name, email, password, role });
    await user.save();

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error in signup:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;
  console.log('Received signin request with email:', email);
  try {
    console.log('Attempting to sign in with email:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('User found:', {
      id: user._id,
      email: user.email,
      role: user.role
    });

    const payload = { id: user._id, role: user.role };
    console.log('Creating token with payload:', payload);
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
    console.log('Token created successfully');
    
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (err) {
    console.error('Error during sign in:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded.id || !decoded.role) {
        return res.status(401).json({ error: 'Invalid token payload' });
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const payload = { id: user._id, role: user.role };
      const newToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

      res.json({ 
        token: newToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired' });
      }
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (err) {
    console.error('Error in token refresh:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.signout = async (req, res) => {
  res.json({ message: 'Logged out (remove token on client)' });
};

exports.createAdminUser = async () => {
  const email = 'admin@example.com';
  const password = 'admin123';
  const role = 'admin';

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('Admin user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, role });
    await user.save();

    console.log('Admin user created successfully');
  } catch (err) {
    console.error('Error creating admin user:', err.message);
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -__v');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Error fetching current user:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

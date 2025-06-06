const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get profile and notification preferences
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name email notificationPreferences');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update profile (name, email)
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true, select: 'name email notificationPreferences' }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update notification preferences
exports.updateNotifications = async (req, res) => {
  try {
    const { email, sms } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notificationPreferences: { email, sms } },
      { new: true, runValidators: true, select: 'notificationPreferences' }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.notificationPreferences);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

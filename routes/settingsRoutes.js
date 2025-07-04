const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middleware/authMiddleware');

// All routes require authentication
router.get('/profile', authenticate, settingsController.getProfile);
router.put('/profile', authenticate, settingsController.updateProfile);
router.put('/password', authenticate, settingsController.changePassword);
router.put('/notifications', authenticate, settingsController.updateNotifications);

module.exports = router;

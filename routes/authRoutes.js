// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const {
  signup,
  signin,
  signout,
  getCurrentUser,
  refresh
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Auth Routes
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/signout', signout);
router.get('/me', authenticate, getCurrentUser);
router.post('/refresh', authenticate, refresh);

module.exports = router;

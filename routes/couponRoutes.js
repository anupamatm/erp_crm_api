const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { sendCouponEmail } = require('../services/emailService');

// Get all coupons
const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (error) {
    next(error);
  }
};

// Create new coupon
const createCoupon = async (req, res, next) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
};

// Delete coupon
const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};

// routes/couponRoutes.js - Add this new route
router.post(
    '/send',
    authenticate,
    authorize(['admin', 'sales']),
    async (req, res, next) => {
      try {
        const { couponId, customerEmails } = req.body;
        
        // Get coupon details
        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
          return res.status(404).json({ message: 'Coupon not found' });
        }
  
        // Send email to each customer
        const results = await Promise.all(
          customerEmails.map(async (email) => {
            const success = await sendCouponEmail(email, coupon);
            return { email, success };
          })
        );
  
        // Count successful sends
        const successfulSends = results.filter(r => r.success).length;
        
        res.json({
          success: true,
          message: `Coupon sent to ${successfulSends} of ${customerEmails.length} customers`,
          details: results
        });
      } catch (error) {
        next(error);
      }
    }
  );


  // Update coupon by ID
const updateCoupon = async (req, res, next) => {
    try {
      const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!coupon) {
        return res.status(404).json({ message: 'Coupon not found' });
      }
      res.json(coupon);
    } catch (error) {
      next(error);
    }
  };
  
  router.put('/:id', authenticate, authorize(['admin', 'sales']), updateCoupon);
  
// Define routes
router.get('/', authenticate, getCoupons);
router.post('/', authenticate, authorize(['admin', 'sales']), createCoupon);
router.delete('/:id', authenticate, authorize(['admin', 'sales']), deleteCoupon);

module.exports = router;
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth.middleware');
const { body } = require('express-validator');

// Rate limiting for auth routes (max 10 requests per 15 minutes per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

// @route   POST api/auth/register
// @desc    Register a new user
router.post(
  '/register',
  authLimiter,
  [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be at least 8 chars long with a number and special character')
      .isLength({ min: 8 })
      .matches(/^(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
  ],
  authController.register
);

// @route   POST api/auth/login
// @desc    Login user and return JWT
router.post(
  '/login',
  authLimiter,
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists()
  ],
  authController.login
);

// @route   PUT api/auth/profile
// @desc    Update user profile
router.put('/profile', authLimiter, auth, authController.updateProfile);

module.exports = router;

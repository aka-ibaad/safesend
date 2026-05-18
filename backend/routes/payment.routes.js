const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const auth = require('../middleware/auth.middleware');

// @route   POST /api/payment/create-intent
// @desc    Create mock PaymentIntent
router.post('/create-intent', auth, paymentController.createPaymentIntent);

router.post('/confirm-mock', auth, paymentController.confirmMockPayment);

module.exports = router;

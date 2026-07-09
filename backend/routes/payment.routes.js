const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const auth = require('../middleware/auth.middleware');

// Client: initiate a mock payment for a file
router.post('/create-intent', auth, paymentController.createPaymentIntent);

// Freelancer: accept payment and unlock the file
router.post('/confirm-mock', auth, paymentController.confirmMockPayment);

// Freelancer: get all files with pending payments
router.get('/pending', auth, paymentController.getPendingPayments);

// Freelancer: reject a payment
router.post('/reject', auth, paymentController.rejectPayment);

module.exports = router;


const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const auth = require('../middleware/auth.middleware');

// Client: initiate a mock payment for a file
router.post('/create-intent', auth, paymentController.createPaymentIntent);

// Freelancer: accept payment and unlock the file
router.post('/confirm-mock', auth, paymentController.confirmMockPayment);

// Client: get their own payment history
router.get('/my-payments', auth, paymentController.getMyPayments);

// Freelancer: get all files with pending payments
router.get('/pending', auth, paymentController.getPendingPayments);

// Freelancer: get history of accepted/rejected payments
router.get('/history', auth, paymentController.getPaymentHistory);

// Freelancer: reject a payment
router.post('/reject', auth, paymentController.rejectPayment);

module.exports = router;


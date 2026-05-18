const File = require('../models/File.model');

// Mock Stripe — creates a fake PaymentIntent and immediately marks file as unlocked
// This simulates what a real Stripe webhook would do

exports.createPaymentIntent = async (req, res) => {
  try {
    const { fileId } = req.body;
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    // Mock PaymentIntent response (mimics Stripe API response shape)
    const mockPaymentIntent = {
      id: `pi_mock_${Date.now()}`,
      client_secret: `pi_mock_secret_${Date.now()}`,
      amount: 5000, // $50.00 in cents (mock amount)
      currency: 'usd',
      status: 'requires_payment_method',
    };

    file.paymentIntentId = mockPaymentIntent.id;
    await file.save();

    res.json(mockPaymentIntent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mock webhook — in real app this is triggered by Stripe, here client calls this directly
exports.confirmMockPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const file = await File.findOne({ paymentIntentId });
    if (!file) return res.status(404).json({ message: 'File not found for this payment' });

    // Mark file as unlocked — same logic as stripe.webhooks.constructEvent in production
    file.isUnlocked = true;
    await file.save();

    res.json({ message: 'Payment confirmed. File unlocked!', fileId: file._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



const File = require('../models/File.model');

// Client initiates a payment — sets paymentStatus to 'pending_acceptance'
// Freelancer must accept to unlock the file
exports.createPaymentIntent = async (req, res) => {
  try {
    const { fileId } = req.body;
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    if (file.paymentStatus === 'pending_acceptance') {
      return res.status(400).json({ message: 'Payment already pending for this file' });
    }
    if (file.isUnlocked) {
      return res.status(400).json({ message: 'File is already unlocked' });
    }

    const mockPaymentIntent = {
      id: `pi_mock_${Date.now()}`,
      client_secret: `pi_mock_secret_${Date.now()}`,
      amount: Math.round((file.price || 0) * 100), // in cents
      currency: 'usd',
      status: 'pending_acceptance',
    };

    file.paymentIntentId = mockPaymentIntent.id;
    file.paymentStatus = 'pending_acceptance';
    file.paidBy = req.user.userId;
    file.paidAt = new Date();
    await file.save();

    res.json({ ...mockPaymentIntent, price: file.price });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Freelancer accepts the payment → unlocks the file
exports.confirmMockPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const file = await File.findOne({ paymentIntentId });
    if (!file) return res.status(404).json({ message: 'File not found for this payment' });

    if (String(file.uploadedBy) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'Only the freelancer who uploaded this file can accept payment' });
    }

    file.isUnlocked = true;
    file.paymentStatus = 'accepted';
    await file.save();

    res.json({ message: 'Payment accepted. File unlocked!', fileId: file._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Freelancer: get all files they uploaded that have a pending payment
exports.getPendingPayments = async (req, res) => {
  try {
    const files = await File.find({
      uploadedBy: req.user.userId,
      paymentStatus: 'pending_acceptance'
    })
      .populate('paidBy', 'name email')
      .sort({ paidAt: -1 });

    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Freelancer rejects a payment → resets file back to locked/unpaid
exports.rejectPayment = async (req, res) => {
  try {
    const { fileId } = req.body;
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    if (String(file.uploadedBy) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'Only the uploader can reject this payment' });
    }

    file.paymentStatus = 'rejected';
    file.paymentIntentId = null;
    file.paidBy = null;
    file.paidAt = null;
    await file.save();

    res.json({ message: 'Payment rejected. File reset to locked.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




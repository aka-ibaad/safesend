const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalFileUrl: {
    type: String, // encrypted, private
    required: true
  },
  originalName: { type: String },
  originalFilePublicId: {
    type: String,
    required: true
  },
  originalFileType: {
    type: String,
    default: 'upload'
  },
  previewFileUrl: {
    type: String, // watermarked, viewable in-app
    required: true
  },
  previewFilePublicId: {
    type: String,
    required: true
  },
  isUnlocked: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: [null, 'pending_acceptance', 'accepted', 'rejected'],
    default: null
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  paymentIntentId: {
    type: String
  },
  proofOfEffort: {
    originalityScore: Number,
    effortLevel: String,
    summary: String
  },
  annotations: [
    {
      clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      content: String,
      timestamp: { type: Date, default: Date.now },
      position: { x: Number, y: Number }
    }
  ],
  screenshotAttempts: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const File = mongoose.model('File', fileSchema);

module.exports = File;

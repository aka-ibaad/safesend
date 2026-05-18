const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const auth = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// @route   GET api/files/my-files
// @desc    Get all files uploaded by the current freelancer
router.get('/my-files', auth, fileController.getMyFiles);

// @route   GET api/files/shared-files
// @desc    Get all files the client can preview (all unlocked+locked files)
router.get('/shared-files', auth, fileController.getSharedFiles);

// @route   POST api/files/upload
// @desc    Upload file (freelancer)
router.post('/upload', auth, upload.single('file'), fileController.uploadFile);

// @route   GET api/files/:id/preview
// @desc    Get file preview and AI report
router.get('/:id/preview', auth, fileController.getFilePreview);

// @route   GET api/files/:id/download
// @desc    Get signed source file URL (unlocked only)
router.get('/:id/download', auth, fileController.downloadFile);

// @route   GET api/files/:id/download-enhanced
// @desc    Download file with format and quality options
router.get('/:id/download-enhanced', auth, fileController.downloadEnhanced);

// @route   POST api/files/:id/annotate
// @desc    Save annotation
router.post('/:id/annotate', auth, fileController.addAnnotation);

// @route   GET api/files/:id/annotations
// @desc    Get all annotations for a file
router.get('/:id/annotations', auth, fileController.getAnnotations);

// @route   POST api/files/:id/screenshot-alert
// @desc    Log screenshot attempt
router.post('/:id/screenshot-alert', auth, fileController.logScreenshot);

module.exports = router;

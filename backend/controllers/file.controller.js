const cloudinary = require('cloudinary').v2;
const File = require('../models/File.model');
const watermarkService = require('../services/watermark.service');
const encryptionService = require('../services/encryption.service');
const aiService = require('../services/ai.service');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const { originalname } = req.file;

    // 1. Generate Watermarked Preview
    let previewFilePath = filePath;
    const isImage = req.file.mimetype.startsWith('image/');
    const isDesignFile = /pdf|psd|ai|postscript|illustrator/i.test(req.file.mimetype) || 
                         /\.(pdf|psd|ai)$/i.test(originalname);

    if (isImage || isDesignFile) {
      if (isDesignFile && !isImage) {
        // For non-images (PDF/PSD/AI), we first get a static JPG from Cloudinary
        // to use as a base for our watermark. 
        // Note: For a production app, we might use a dedicated conversion lib, 
        // but Cloudinary's 'image' resource type handles these formats well.
        console.log(`Generating image base for design file: ${originalname}`);
        const conversion = await cloudinary.uploader.upload(filePath, {
          resource_type: 'image',
          format: 'jpg',
          page: 1 // Get first page/layer
        });
        
        // Temporarily download the converted image to watermark it
        const convResponse = await axios.get(conversion.secure_url, { responseType: 'arraybuffer' });
        const convPath = path.join(__dirname, '../tmp', `conv-${Date.now()}.jpg`);
        fs.writeFileSync(convPath, Buffer.from(convResponse.data));
        
        const watermarkText = `SECUREDELIVER - User ID: ${req.user.userId}`;
        previewFilePath = await watermarkService.generateWatermarkedPreview(convPath, originalname, watermarkText);
        
        // Clean up conversion temp file
        if (fs.existsSync(convPath)) fs.unlinkSync(convPath);
      } else {
        // Standard image watermarking
        const watermarkText = `SECUREDELIVER - User ID: ${req.user.userId}`;
        previewFilePath = await watermarkService.generateWatermarkedPreview(filePath, originalname, watermarkText);
      }
    }

    // 2. Encrypt Original File
    const encryptedPath = encryptionService.encryptFile(filePath);

    // 3. Upload to Cloudinary
    // Upload encrypted original (private)
    const originalUpload = await cloudinary.uploader.upload(encryptedPath, {
      resource_type: 'raw',
      access_mode: 'authenticated'
    });

    // Upload watermarked preview (public in-app)
    const previewUpload = await cloudinary.uploader.upload(previewFilePath, {
      resource_type: 'image'
    });

    // 4. AI Proof of Effort
    const proofOfEffort = await aiService.generateProofOfEffort(`A ${req.file.mimetype} file named ${originalname} uploaded by a freelancer.`);

    // 5. Save to MongoDB
    const newFile = new File({
      uploadedBy: req.user.userId,
      originalName: originalname,
      originalFileUrl: originalUpload.secure_url,
      originalFilePublicId: originalUpload.public_id,
      originalFileType: originalUpload.type || 'upload',
      previewFileUrl: previewUpload.secure_url,
      previewFilePublicId: previewUpload.public_id,
      proofOfEffort
    });

    await newFile.save();

    // Cleanup tmp files
    [filePath, previewFilePath, encryptedPath].forEach(path => {
      if (fs.existsSync(path)) fs.unlinkSync(path);
    });

    res.status(201).json(newFile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFilePreview = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    // Generate a fallback name for older files to help mobile app with extensions
    let originalName = file.originalName;
    if (!originalName && file.originalFileUrl) {
      const lastPart = file.originalFileUrl.split('/').pop();
      const ext = lastPart.split('.').pop();
      const cleanExt = (ext === 'enc' || !ext) ? 'jpg' : ext;
      originalName = `Recovered_File_${file._id}.${cleanExt}`;
    }

    res.json({ 
      previewUrl: file.previewFileUrl, 
      originalName,
      proofOfEffort: file.proofOfEffort,
      isUnlocked: file.isUnlocked 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    if (!file.isUnlocked) {
      return res.status(403).json({ message: 'File is locked. Payment required.' });
    }

    // 1. Generate a signed URL for the encrypted original file
    let publicId = file.originalFilePublicId;
    
    // Fallback for older records that might not have the public_id field
    if (!publicId && file.originalFileUrl) {
      console.log('⚠️ originalFilePublicId missing. Attempting to parse from URL...');
      // Cloudinary URL usually looks like .../upload/v12345/public_id.bin
      const parts = file.originalFileUrl.split('/');
      const lastPart = parts.pop();
      publicId = lastPart; 
      console.log(`Parsed fallback publicId (full): ${publicId}`);
    }

    if (!publicId) {
      console.error('❌ Could not determine public_id for download');
      return res.status(500).json({ message: 'File identification failed' });
    }

    console.log(`Generating signed URL for publicId: ${publicId} (Type: ${file.originalFileType || 'upload'})`);
    const signedUrl = cloudinary.url(publicId, {
      sign_url: true,
      type: file.originalFileType || 'upload',
      resource_type: 'raw',
      expires_at: Math.floor(Date.now() / 1000) + 600
    });
    console.log(`Signed URL generated: ${signedUrl}`);

    // 2. Fetch the encrypted file data
    const response = await axios.get(signedUrl, { responseType: 'arraybuffer' });
    const encryptedBuffer = Buffer.from(response.data);

    // 3. Decrypt the file
    const decryptedBuffer = encryptionService.decryptFile(encryptedBuffer);

    // 4. Send the decrypted file as a download
    // Use the original filename with correct extension
    let filename = file.originalName || `Secure_File_${file._id}.bin`;
    
    // Fallback: If no originalName, try to infer extension from the Cloudinary URL
    if (!file.originalName && file.originalFileUrl) {
      const parts = file.originalFileUrl.split('/');
      const lastPart = parts.pop();
      // If it ends in .enc (my encryption format) or other, try to keep that extension
      if (lastPart.includes('.')) {
        const ext = lastPart.split('.').pop();
        // Remove .enc if it exists to get original extension
        const cleanExt = ext === 'enc' ? 'jpg' : ext; // Default to jpg if ambiguous
        filename = `Recovered_File_${file._id}.${cleanExt}`;
      }
    }
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(decryptedBuffer);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ message: 'Failed to process download: ' + err.message });
  }
};

exports.downloadEnhanced = async (req, res) => {
  try {
    const { format, quality } = req.query; // e.g., format=png, quality=90
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    if (!file.isUnlocked) {
      return res.status(403).json({ message: 'File is locked. Payment required.' });
    }

    // Since original is encrypted and in Cloudinary raw, we'd normally need to 
    // download, decrypt, process, and then serve. 
    // For this prototype, we'll process the preview (which is unencrypted) 
    // to demonstrate the quality/format change if requested, 
    // but a real production app would use the source.
    
    // For now, let's just use Cloudinary transformations if it's an image
    // OR use sharp if we have a local copy. 
    // Optimization: Use Cloudinary's built-in transformation for simplicity and speed.
    
    let transformedUrl = file.previewFileUrl;
    if (file.previewFileUrl.includes('image/upload')) {
      const qValue = quality ? `q_${quality}` : 'q_auto';
      const fValue = format ? `f_${format}` : 'f_auto';
      transformedUrl = file.previewFileUrl.replace('/upload/', `/upload/${qValue},${fValue}/`);
    }

    res.json({ downloadUrl: transformedUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addAnnotation = async (req, res) => {
  try {
    const { content, position } = req.body;
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    file.annotations.push({
      clientId: req.user.userId,
      content,
      position
    });

    await file.save();
    res.status(201).json({ message: 'Annotation added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logScreenshot = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    file.screenshotAttempts.push({ userId: req.user.userId });
    await file.save();
    res.status(201).json({ message: 'Screenshot logged' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all files uploaded by the logged-in freelancer
exports.getMyFiles = async (req, res) => {
  try {
    const files = await File.find({ uploadedBy: req.user.userId }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all files available to client (all files in the system for simplicity)
exports.getSharedFiles = async (req, res) => {
  try {
    const files = await File.find({}).populate('uploadedBy', 'name email').sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get annotations for a specific file
exports.getAnnotations = async (req, res) => {
  try {
    const file = await File.findById(req.params.id).populate('annotations.clientId', 'name');
    if (!file) return res.status(404).json({ message: 'File not found' });
    res.json(file.annotations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

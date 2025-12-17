const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  uploadDocument,
  uploadImage,
  uploadPortfolio,
  deleteFile
} = require('../config/cloudinary');

// Upload single document (for company verification)
router.post('/document', authMiddleware, (req, res) => {
  uploadDocument.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ 
        error: err.message || 'File upload failed' 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({
      message: 'File uploaded successfully',
      file: {
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        format: req.file.format
      }
    });
  });
});

// Upload multiple documents (up to 10 files)
router.post('/documents', authMiddleware, (req, res) => {
  uploadDocument.array('files', 10)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ 
        error: err.message || 'File upload failed' 
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const files = req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
      originalName: file.originalname,
      size: file.size,
      format: file.format
    }));
    
    res.json({
      message: `${files.length} file(s) uploaded successfully`,
      files
    });
  });
});

// Upload single image (avatar, logo)
router.post('/image', authMiddleware, (req, res) => {
  uploadImage.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ 
        error: err.message || 'Image upload failed' 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    
    res.json({
      message: 'Image uploaded successfully',
      file: {
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        format: req.file.format,
        width: req.file.width,
        height: req.file.height
      }
    });
  });
});

// Upload portfolio images (up to 5 per request)
router.post('/portfolio', authMiddleware, (req, res) => {
  uploadPortfolio.array('files', 5)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ 
        error: err.message || 'Portfolio upload failed' 
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const files = req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
      originalName: file.originalname,
      size: file.size,
      format: file.format
    }));
    
    res.json({
      message: `${files.length} portfolio image(s) uploaded successfully`,
      files
    });
  });
});

// Delete file by public ID
router.delete('/:publicId', authMiddleware, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    // Decode public ID (it comes URL encoded)
    const decodedPublicId = decodeURIComponent(publicId);
    
    const deleted = await deleteFile(decodedPublicId);
    
    if (deleted) {
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete file' });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get upload limits info
router.get('/limits', (req, res) => {
  res.json({
    document: {
      maxSize: '10MB',
      formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
      maxFiles: 10
    },
    image: {
      maxSize: '5MB',
      formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      maxFiles: 1
    },
    portfolio: {
      maxSize: '5MB',
      formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      maxFiles: 5
    }
  });
});

module.exports = router;
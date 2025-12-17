const crypto = require('crypto');
const path = require('path');

/**
 * Upload Service
 * 
 * PRODUCTION: Replace with Cloudinary or AWS S3
 * CURRENT: Mock implementation for development
 */

class UploadService {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
  }

  /**
   * Generate unique filename
   */
  generateFilename(originalName) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    return `${timestamp}-${randomString}${ext}`;
  }

  /**
   * Validate file
   */
  validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new Error('File size exceeds 5MB limit');
    }

    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only images and PDFs allowed');
    }

    return true;
  }

  /**
   * Upload single file (MOCK - for development)
   * PRODUCTION: Use Cloudinary or AWS S3
   */
  async uploadSingle(file) {
    try {
      this.validateFile(file);

      // MOCK: Return a fake URL
      // In production, upload to cloud storage and return real URL
      const filename = this.generateFilename(file.originalname);
      const mockUrl = `http://localhost:5000/uploads/${filename}`;

      console.log('📤 Mock file upload:', {
        originalName: file.originalname,
        filename,
        size: file.size,
        type: file.mimetype
      });

      // TODO: Implement real upload to Cloudinary
      // const result = await cloudinary.uploader.upload(file.path);
      // return result.secure_url;

      return {
        success: true,
        url: mockUrl,
        filename,
        originalName: file.originalname,
        size: file.size,
        message: 'File uploaded successfully (MOCK)'
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(files) {
    try {
      const uploadPromises = files.map(file => this.uploadSingle(file));
      const results = await Promise.all(uploadPromises);
      
      return {
        success: true,
        files: results.filter(r => r.success),
        message: `${results.length} files uploaded successfully`
      };
    } catch (error) {
      console.error('Multiple upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete file (MOCK)
   * PRODUCTION: Delete from cloud storage
   */
  async deleteFile(fileUrl) {
    try {
      console.log('🗑️  Mock file deletion:', fileUrl);
      
      // TODO: Implement real deletion from Cloudinary
      // await cloudinary.uploader.destroy(publicId);

      return {
        success: true,
        message: 'File deleted successfully (MOCK)'
      };
    } catch (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new UploadService();

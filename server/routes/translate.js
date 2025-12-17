// server/routes/translate.js
const express = require('express');
const router = express.Router();

/**
 * POST /api/translate
 * Translate text
 */
router.post('/', async (req, res) => {
  try {
    const { text, target_lang = 'ur' } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    
    // If no API key, return original text
    if (!apiKey) {
      console.warn('Google Translate API key not configured');
      return res.json({ 
        translated_text: text,
        source: 'none',
        message: 'Translation service not configured'
      });
    }
    
    // Optional: Add axios for Google Translate API
    // If you want to use Google Translate, install axios: npm install axios
    
    res.json({
      translated_text: text, // For now, just echo back
      source: 'echo',
      message: 'Translation endpoint working. Add Google Translate API to enable real translations.'
    });
    
  } catch (error) {
    console.error('Translation error:', error.message);
    res.status(500).json({ 
      error: 'Translation failed',
      translated_text: req.body.text || ''
    });
  }
});

/**
 * GET /api/translate/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  const hasApiKey = !!process.env.GOOGLE_TRANSLATE_API_KEY;
  
  res.json({
    status: 'ok',
    google_translate_configured: hasApiKey,
    message: hasApiKey 
      ? 'Google Translate API key is configured' 
      : 'No Google Translate API key found in environment variables'
  });
});

module.exports = router;
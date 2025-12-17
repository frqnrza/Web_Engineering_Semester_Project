// server/routes/chatbot.js - COMPLETE FIXED VERSION
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key-here');

// System prompt for TechConnect
const SYSTEM_PROMPT = `You are TechConnect AI, an assistant for a Pakistani tech marketplace platform.

Platform Features:
- Connects businesses with verified tech companies in Pakistan
- Services: Web Development, Mobile Apps, Digital Marketing, UI/UX Design
- Payment: JazzCash, EasyPaisa, Bank Transfer with escrow protection
- Verification: Companies submit SECP documents, portfolio, references

Response Guidelines:
1. Keep responses concise (2-3 sentences maximum)
2. Be helpful and specific to TechConnect platform
3. For pricing questions, provide ranges in PKR
4. If unsure, direct to support or relevant platform section`;

// Try different models in order
const AVAILABLE_MODELS = [
  'gemini-1.5-flash',      // Most reliable free tier
  'gemini-1.5-pro',        // Paid tier
  'gemini-2.0-flash',      // Latest free tier
  'gemini-pro'            // Legacy (might not work)
];

// Function to get working model
const getWorkingModel = async () => {
  for (const modelName of AVAILABLE_MODELS) {
    try {
      console.log(`Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      });
      
      // Test the model
      const testResult = await model.generateContent("Test");
      await testResult.response;
      
      console.log(`✅ Model ${modelName} is working`);
      return model;
    } catch (error) {
      console.log(`❌ Model ${modelName} failed: ${error.message}`);
      continue;
    }
  }
  throw new Error('No working Gemini model found');
};

// Initialize model on server start
let chatModel;
getWorkingModel().then(model => {
  chatModel = model;
  console.log('✅ Gemini AI initialized successfully');
}).catch(error => {
  console.error('❌ Failed to initialize Gemini AI:', error.message);
  chatModel = null;
});

// Fallback responses for when Gemini is unavailable
const getFallbackResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('سلام')) {
    return 'Hello! I\'m your TechConnect AI assistant. How can I help you today?';
  }
  
  if (lowerMessage.includes('project') || lowerMessage.includes('post') || lowerMessage.includes('پراجیکٹ')) {
    return 'To post a project, click the "Post Project" button in the header. You\'ll need to sign in first if you haven\'t already.';
  }
  
  if (lowerMessage.includes('company') || lowerMessage.includes('browse') || lowerMessage.includes('کمپنی')) {
    return 'To browse verified tech companies, click "Browse Companies" in the navigation menu. Filter by category, price, and location.';
  }
  
  if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('ادائیگی')) {
    return 'We support JazzCash, EasyPaisa, and bank transfers. All payments are held in escrow until milestone completion.';
  }
  
  return 'Thanks for your question! For detailed assistance, please contact our support team. I can help you with posting projects, finding companies, payments, and more.';
};

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, language = 'en' } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // If Gemini is not initialized, use fallback
    if (!chatModel) {
      const fallbackResponse = getFallbackResponse(message);
      return res.json({ 
        response: fallbackResponse,
        source: 'fallback',
        model: 'none'
      });
    }
    
    // Generate response with Gemini
    const prompt = `${SYSTEM_PROMPT}\n\nUser Question: ${message}\n\nLanguage: ${language}`;
    
    const result = await chatModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ 
      response: text,
      source: 'gemini-ai',
      model: chatModel.model 
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    
    // Use fallback on API errors
    const fallbackResponse = getFallbackResponse(req.body?.message || '');
    
    res.json({ 
      response: fallbackResponse,
      source: 'fallback',
      error: error.message 
    });
  }
});

// Test endpoint to verify API connection
router.get('/test', async (req, res) => {
  try {
    if (!chatModel) {
      throw new Error('Gemini AI not initialized');
    }
    
    const result = await chatModel.generateContent("Hello, are you working?");
    const response = await result.response;
    const text = response.text();
    
    res.json({ 
      success: true, 
      message: 'Gemini AI is working',
      response: text,
      model: chatModel.model
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      availableModels: AVAILABLE_MODELS
    });
  }
});

module.exports = router;
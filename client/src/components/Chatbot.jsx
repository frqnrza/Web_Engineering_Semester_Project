import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Loader2, AlertCircle, Shield, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { translate } from '../services/translations';

// Custom hook for Gemini API integration
const useGeminiAPI = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize and check API availability
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        // Check if we have an API key
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        
        if (!apiKey) {
          setError('GEMINI_API_KEY not found in environment variables');
          setIsAvailable(false);
          return;
        }

        // Simple test to verify API is accessible
        const testResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: "Say 'OK'" }]
              }],
              generationConfig: {
                maxOutputTokens: 10
              }
            })
          }
        );

        if (testResponse.ok) {
          setIsAvailable(true);
          setIsInitialized(true);
          setError(null);
        } else {
          const errorData = await testResponse.json();
          setError(`API Error: ${errorData.error?.message || 'Unknown error'}`);
          setIsAvailable(false);
        }
      } catch (err) {
        console.error('Gemini API check failed:', err);
        setError(err.message || 'Network error');
        setIsAvailable(false);
      }
    };

    checkAvailability();
  }, []);

  const sendMessage = async (message, language = 'en') => {
    if (!isAvailable) {
      throw new Error('Gemini API is not available');
    }

    setIsLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      // System prompt for TechConnect context
      const systemPrompt = `You are TechConnect AI, an assistant for a Pakistani tech marketplace platform.

**Platform Features:**
- Connects businesses with verified tech companies in Pakistan
- Services: Web Development, Mobile Apps, Digital Marketing, UI/UX Design
- Payment: JazzCash, EasyPaisa, Bank Transfer with escrow protection
- Verification: Companies submit SECP documents, portfolio, references
- Language: ${language === 'ur' ? 'Urdu/English bilingual' : 'English/Urdu bilingual'}

**Response Guidelines:**
1. Keep responses concise (2-3 sentences maximum)
2. Be helpful and specific to TechConnect platform
3. For pricing questions, provide ranges in PKR
4. If unsure, direct to support or relevant platform section
5. ${language === 'ur' ? 'Urdu میں جواب دیں اگر صارف نے اردو میں پوچھا ہو' : 'Respond in English unless user asks in Urdu'}

**User Question:** ${message}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: systemPrompt }]
            }],
            generationConfig: {
              maxOutputTokens: 300,
              temperature: 0.7,
              topP: 0.8,
              topK: 40
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (err) {
      console.error('Gemini API call failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isAvailable, isInitialized, error, isLoading: isLoading };
};

export function Chatbot({ language }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: language === 'ur' 
        ? 'سلام! میں TechConnect AI اسسٹنٹ ہوں۔ میں آپ کی کیسے مدد کر سکتا ہوں؟'
        : 'Hello! I\'m your TechConnect AI assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  // Use Gemini API hook
  const { 
    sendMessage, 
    isAvailable, 
    isInitialized, 
    error, 
    isLoading: geminiLoading 
  } = useGeminiAPI();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fallback responses for when Gemini is unavailable
  const getFallbackResponse = (userMessage, lang) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('سلام')) {
      return lang === 'ur' 
        ? 'سلام! میں TechConnect AI اسسٹنٹ ہوں۔ میں آپ کی کیسے مدد کر سکتا ہوں؟'
        : 'Hello! I\'m your TechConnect AI assistant. How can I help you today?';
    }
    
    if (lowerMessage.includes('project') || lowerMessage.includes('post') || lowerMessage.includes('پراجیکٹ')) {
      return lang === 'ur'
        ? 'پراجیکٹ پوسٹ کرنے کے لیے، ہیڈر میں "پوسٹ پراجیکٹ" بٹن پر کلک کریں۔ پہلے سائن ان کریں اگر آپ نے پہلے نہیں کیا ہے۔'
        : 'To post a project, click the "Post Project" button in the header. You\'ll need to sign in first if you haven\'t already.';
    }
    
    if (lowerMessage.includes('company') || lowerMessage.includes('browse') || lowerMessage.includes('کمپنی')) {
      return lang === 'ur'
        ? 'تصدیق شدہ ٹیک کمپنیاں دیکھنے کے لیے، نیویگیشن مینو میں "براؤز کمپنیز" پر کلک کریں۔ زمرے، قیمت، اور مقام کے لحاظ سے فلٹر کریں۔'
        : 'To browse verified tech companies, click "Browse Companies" in the navigation menu. Filter by category, price, and location.';
    }
    
    if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('ادائیگی')) {
      return lang === 'ur'
        ? 'ہم جیز کیش، ایزی پیسا، اور بینک ٹرانسفر سپورٹ کرتے ہیں۔ تمام ادائیگیاں میل اسٹون مکمل ہونے تک اسکرو میں رکھی جاتی ہیں۔'
        : 'We support JazzCash, EasyPaisa, and bank transfers. All payments are held in escrow until milestone completion.';
    }
    
    if (lowerMessage.includes('verify') || lowerMessage.includes('verification') || lowerMessage.includes('تصدیق')) {
      return lang === 'ur'
        ? 'کمپنیاں دستاویزات کی چیک، پورٹ فولیو جائزہ، اور حوالہ کی تصدیق کے عمل سے گزرتی ہیں۔ ہرے رنگ کے تصدیق شدہ بیج کو دیکھیں!'
        : 'Companies go through a verification process including document checks, portfolio review, and reference verification. Look for the green verified badge!';
    }
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('قیمت')) {
      return lang === 'ur'
        ? 'ویب پراجیکٹس: 100k-500k PKR، موبائل ایپس: 250k-1M PKR، مارکیٹنگ: 50k-200k PKR ماہانہ۔'
        : 'Web projects: 100k-500k PKR, Mobile apps: 250k-1M PKR, Marketing: 50k-200k PKR monthly.';
    }
    
    return lang === 'ur'
      ? 'شکریہ آپ کے سوال کا! تفصیلی مدد کے لیے، براہ کرم ہماری سپورٹ ٹیم سے رابطہ کریں۔ میں آپ کی پراجیکٹ پوسٹ کرنے، کمپنیاں ڈھونڈنے، ادائیگیوں، اور دیگر سوالات میں مدد کر سکتا ہوں۔'
      : 'Thanks for your question! For detailed assistance, please contact our support team. I can help you with posting projects, finding companies, payments, and more.';
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || geminiLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');

    try {
      let botResponse;
      
      // Use Gemini API if available
      if (isAvailable) {
        botResponse = await sendMessage(currentInput, language);
      } else {
        // Use fallback responses
        botResponse = getFallbackResponse(currentInput, language);
      }
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Use fallback on error
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: getFallbackResponse(currentInput, language),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick response suggestions
  const quickResponses = language === 'ur' ? [
    'پراجیکٹ کیسے پوسٹ کریں؟',
    'کمپنیاں کیسے ڈھونڈیں؟',
    'تصدیق کا عمل کیا ہے؟',
    'ادائیگی کے طریقے کون سے ہیں؟',
    'پلیٹ فارم فیس کتنی ہے؟'
  ] : [
    'How to post a project?',
    'How to find companies?',
    'What is the verification process?',
    'What payment methods are available?',
    'What are the platform fees?'
  ];

  const handleQuickResponse = (response) => {
    setInputMessage(response);
    // Auto-send after short delay
    setTimeout(() => {
      if (!geminiLoading) {
        handleSend();
      }
    }, 100);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-[#FF8A2B] hover:bg-[#e67a1f] text-white rounded-full p-4 shadow-2xl transition-all hover:scale-110 z-50 group"
        aria-label={translate('chatWithUs', language)}
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          AI
        </span>
        <div className="absolute right-16 bottom-0 bg-white text-gray-800 text-xs px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {language === 'ur' ? 'AI اسسٹنٹ سے بات کریں' : 'Chat with AI Assistant'}
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 animate-in slide-in-from-bottom-10 duration-300">
      {/* Header with status */}
      <div className="bg-gradient-to-r from-[#FF8A2B] to-[#ff7a1b] text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">TechConnect AI</h3>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></span>
              <p className="text-xs text-white/90">
                {isAvailable 
                  ? (language === 'ur' ? 'آن لائن - Gemini AI' : 'Online - Gemini AI')
                  : (language === 'ur' ? 'بنیادی معلومات' : 'Basic Info')
                }
              </p>
              {isAvailable && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Google
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 backdrop-blur-sm ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-[#FF8A2B] to-[#ff9a3b] text-white rounded-br-sm shadow-lg'
                  : 'bg-white/90 text-gray-800 rounded-bl-sm shadow-md border border-gray-100/50'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.text}</p>
              <div className="flex items-center justify-between mt-1.5">
                <p className={`text-xs ${
                  message.sender === 'user' ? 'text-white/70' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {message.sender === 'bot' && isAvailable && (
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Secure
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {geminiLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-2 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#FF8A2B] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#FF8A2B] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[#FF8A2B] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-600">
                {language === 'ur' ? 'Gemini AI جواب تیار کر رہا ہے...' : 'Gemini AI is thinking...'}
              </span>
            </div>
          </div>
        )}
        
        {/* Service status info */}
        {!isAvailable && isInitialized && (
          <div className="bg-gradient-to-r from-yellow-50/80 to-amber-50/80 border border-yellow-200/50 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-yellow-800 font-medium">
                  {language === 'ur' 
                    ? 'Gemini AI فی الحال دستیاب نہیں ہے'
                    : 'Gemini AI is currently unavailable'}
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  {language === 'ur'
                    ? 'آپ کو بنیادی معلومات پر مبنی جوابات ملیں گے۔'
                    : 'You will receive responses based on basic information.'}
                </p>
                {error && (
                  <p className="text-xs text-yellow-600 mt-1">{error}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Quick responses - only show on first message */}
        {messages.length === 1 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2 text-center font-medium">
              {language === 'ur' ? 'تیز جوابات:' : 'Quick questions:'}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickResponses.map((response, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickResponse(response)}
                  disabled={geminiLoading}
                  className="text-xs bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-all hover:scale-105 disabled:opacity-50 border border-gray-200/50 shadow-sm"
                >
                  {response}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-200/50 bg-white/95 backdrop-blur-sm rounded-b-2xl">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={translate('askQuestion', language) || 'Type your question...'}
            disabled={geminiLoading}
            className="flex-1 border-gray-300 focus:border-[#FF8A2B] focus:ring-[#FF8A2B] bg-white"
          />
          <Button
            onClick={handleSend}
            disabled={!inputMessage.trim() || geminiLoading}
            className="bg-gradient-to-r from-[#FF8A2B] to-[#ff9a3b] hover:from-[#e67a1f] hover:to-[#f58a2f] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {geminiLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        
        {/* Info footer */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {isAvailable ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <span className="font-medium">Powered by</span>
                  <span className="text-blue-600 font-semibold">Gemini AI</span>
                </p>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <p className="text-xs text-gray-500">
                  {language === 'ur' ? 'بنیادی معلومات' : 'Basic information'}
                </p>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {language === 'ur' ? 'محفوظ' : 'Secure'}
            </span>
            <Shield className="w-3 h-3 text-gray-400" />
          </div>
        </div>
        
        {/* Clear conversation */}
        {messages.length > 2 && (
          <div className="text-center mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => setMessages([messages[0]])}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {language === 'ur' ? 'نئی بات چیت شروع کریں' : 'Start new conversation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
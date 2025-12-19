const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT access token
// In authMiddleware function, around line 15-20
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('🔍 Auth check - Headers:', {
      authorization: authHeader ? authHeader.substring(0, 30) + '...' : 'MISSING'
    }); // âœ… Debug log

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No Bearer token in Authorization header');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required. Please sign in.' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('🔑 Token extracted:', token.substring(0, 20) + '...'); // âœ… Debug

    // âœ… Verify JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('❌ FATAL: JWT_SECRET not defined in .env');
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded:', decoded); // âœ… Debug

    // âœ… Extract user ID (handles both 'id' and 'userId' in token)
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      console.log('❌ No userId in token payload');
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token. Please sign in again.' 
      });
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(401).json({ 
        success: false,
        error: 'User not found. Please sign in again.' 
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Account suspended. Contact support.'
      });
    }
    
    console.log('✅ Auth successful for user:', user.email);

    req.user = user;
    req.userId = user._id;
    req.userType = user.type;
    
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Session expired. Please sign in again.', 
        code: 'TOKEN_EXPIRED' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token. Please sign in again.' 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Authentication failed.' 
    });
  }
};

// Optional auth - doesn't fail if no token or invalid token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) return next();

    // Verify token (with expiration check)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // ✅ FIXED: Clean ID extraction
      const userId = decoded.id || decoded.userId;

      if (userId) {
        const user = await User.findById(userId).select('-password');
        
        if (user && user.status !== 'suspended') {
          req.user = user;
          req.userId = user._id;
          req.userType = user.type;
        }
      }
    } catch (tokenError) {
      // Log but don't fail for optional auth
      if (tokenError.name !== 'TokenExpiredError') {
        console.warn('Optional auth token error:', tokenError.message);
      }
    }
    
    next();
  } catch (error) {
    // Continue even if there's an error
    console.error('Optional auth error:', error);
    next();
  }
};

// Check user type (role-based access)
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required to access this resource.' 
      });
    }
    
    if (!roles.includes(req.userType)) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. You do not have permission to access this resource.' 
      });
    }
    
    next();
  };
};

// Admin only
const requireAdmin = requireRole('admin');

// Company only
const requireCompany = requireRole('company');

// Client only
const requireClient = requireRole('client');

// Check email verification status
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.type !== 'admin' && !req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required. Please verify your email address.'
    });
  }

  next();
};

// Check account status (not suspended)
const requireActiveAccount = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.status === 'suspended') {
    return res.status(403).json({
      success: false,
      error: 'Your account has been suspended. Please contact support.'
    });
  }

  next();
};

// Rate limiting for login attempts tracking
const trackLoginAttempts = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (email) {
      const user = await User.findOne({ email });
      
      if (user && user.failedLoginAttempts >= 5 && user.lockUntil) {
        const timeSinceLastAttempt = Date.now() - user.lockUntil;
        
        // If lockUntil is in the future
        if (user.lockUntil > Date.now()) {
            const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return res.status(429).json({
                success: false,
                error: `Too many failed login attempts. Account locked. Try again in ${minutesLeft} minutes.`
            });
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Login attempt tracking error:', error);
    next();
  }
};

// Password strength validation middleware
const validatePasswordStrength = (req, res, next) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({
      success: false,
      error: 'Password is required'
    });
  }

  // Check minimum length
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long'
    });
  }

  next();
};

// Email format validation middleware
const validateEmailFormat = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid email address'
    });
  }

  next();
};

// Phone number validation middleware
const validatePhoneFormat = (req, res, next) => {
  const { phone } = req.body;
  
  if (!phone) {
    return next(); // Phone is optional
  }

  const phoneRegex = /^[\d\s\+\-\(\)]+$/;
  
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid phone number'
    });
  }

  next();
};

module.exports = {
  authMiddleware,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireCompany,
  requireClient,
  requireEmailVerification,
  requireActiveAccount,
  trackLoginAttempts,
  validatePasswordStrength,
  validateEmailFormat,
  validatePhoneFormat
};
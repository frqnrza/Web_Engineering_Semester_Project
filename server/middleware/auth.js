const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT access token
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required. Please sign in.' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!process.env.JWT_SECRET) {
      console.error('FATAL: JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ FIXED: Clean ID extraction (removed redundant check)
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token structure. Please sign in again.' 
      });
    }
    
    // Get user from database
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'User not found. Please sign in again.' 
      });
    }

    // Check if user is active
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Account suspended. Please contact support.'
      });
    }
    
    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.userType = user.type;
    
    next();
  } catch (error) {
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
        error: 'Invalid authentication token. Please sign in again.' 
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Authentication failed. Please try again.' 
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
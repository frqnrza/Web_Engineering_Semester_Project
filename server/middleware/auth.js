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
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id || decoded.userId || decoded.userId).select('-password');
    
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

    // Check if email is verified (only enforce for non-admin users)
    if (user.type !== 'admin' && !user.emailVerified && process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Please verify your email address to access this feature.'
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

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token (with expiration check)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id || decoded.userId || decoded.userId).select('-password');
      
      if (user) {
        req.user = user;
        req.userId = user._id;
        req.userType = user.type;
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
      
      if (user && user.failedLoginAttempts >= 5) {
        const timeSinceLastAttempt = Date.now() - user.lockUntil;
        const minutesLeft = Math.ceil((30 * 60 * 1000 - timeSinceLastAttempt) / 60000);
        
        if (minutesLeft > 0) {
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

  // Additional password strength checks (optional)
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  
  if (process.env.NODE_ENV === 'production' && !strongPasswordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      error: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
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
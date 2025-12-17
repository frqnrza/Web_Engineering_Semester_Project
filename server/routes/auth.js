const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Company = require('../models/Company');
const { authMiddleware, validatePasswordStrength, validateEmailFormat, validatePhoneFormat } = require('../middleware/auth');
const { 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  sendWelcomeEmail 
} = require('../services/email');

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Rate limiters
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Increased to 10 requests per hour
  message: { 
    success: false,
    error: 'Too many registration attempts. Please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Increased to 15 requests per 15 minutes
  message: { 
    success: false,
    error: 'Too many login attempts. Please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Increased to 5 requests per hour
  message: { 
    success: false,
    error: 'Too many password reset requests. Please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Helper function to generate JWT tokens
const generateTokens = (userId, userType) => {
  const accessToken = jwt.sign(
    { userId, type: userType },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: userType },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Helper to check email availability
const checkEmailAvailability = async (email) => {
  try {
    const existingUser = await User.findOne({ email });
    return !existingUser; // Returns true if email is available
  } catch (error) {
    console.error('Email check error:', error);
    throw new Error('Failed to check email availability');
  }
};

// Helper to check phone availability
const checkPhoneAvailability = async (phone) => {
  try {
    if (!phone) return true; // Phone is optional
    
    const existingUser = await User.findOne({ phone });
    return !existingUser; // Returns true if phone is available
  } catch (error) {
    console.error('Phone check error:', error);
    throw new Error('Failed to check phone availability');
  }
};

// ==========================================
// CHECK EMAIL AVAILABILITY
// ==========================================
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const isAvailable = await checkEmailAvailability(email);
    
    res.json({
      success: true,
      available: isAvailable,
      message: isAvailable ? 'Email is available' : 'Email is already registered'
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check email availability'
    });
  }
});

// ==========================================
// CHECK PHONE AVAILABILITY
// ==========================================
router.post('/check-phone', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const isAvailable = await checkPhoneAvailability(phone);
    
    res.json({
      success: true,
      available: isAvailable,
      message: isAvailable ? 'Phone number is available' : 'Phone number is already registered'
    });
  } catch (error) {
    console.error('Check phone error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check phone availability'
    });
  }
});

// ==========================================
// REGISTER - Email/Password Registration with Enhanced Validation
// ==========================================
router.post('/register', 
  registerLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('type').isIn(['client', 'company']).withMessage('Type must be client or company'),
    body('companyName').if(body('type').equals('company')).notEmpty().withMessage('Company name required for company accounts'),
    body('phone').optional().matches(/^[\d\s\+\-\(\)]+$/).withMessage('Invalid phone number format')
  ],
  validateEmailFormat,
  validatePasswordStrength,
  validatePhoneFormat,
  async (req, res) => {
    try {
      // Validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: errors.array()[0].msg 
        });
      }

      const { email, password, name, type, companyName, phone } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          error: 'This email is already registered. Please use a different email or sign in.' 
        });
      }

      // Check for duplicate phone number if provided
      if (phone) {
        const existingPhone = await User.findOne({ phone: phone.trim() });
        if (existingPhone) {
          return res.status(400).json({ 
            success: false,
            error: 'This phone number is already registered. Please use a different phone number.' 
          });
        }
      }

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      // Create user
      const user = new User({
        email,
        password, // Will be hashed automatically by pre-save hook
        name,
        type,
        companyName: type === 'company' ? companyName : undefined,
        phone: phone ? phone.trim() : undefined,
        emailVerificationToken,
        emailVerificationExpires,
        emailVerified: false,
        createdAt: new Date()
      });

      await user.save();

      // Send verification email (non-blocking)
      sendVerificationEmail(email, name, emailVerificationToken)
        .then(() => {
          console.log(`Verification email sent to ${email}`);
        })
        .catch(err => console.error('Email send error:', err));

      // Send welcome email
      sendWelcomeEmail(email, name, type)
        .then(() => {
          console.log(`Welcome email sent to ${email}`);
        })
        .catch(err => console.error('Welcome email error:', err));

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user._id, user.type);

      // Store refresh token in user document
      user.refreshTokens.push({
        token: refreshToken,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      await user.save();

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // FIXED: Company creation - Only create company for company type users
      let companyId = null;
      if (type === 'company') {
        try {
          console.log('Creating company for user:', user._id);
          
          // Check if company already exists for this user
          const existingCompany = await Company.findOne({ userId: user._id });
          if (existingCompany) {
            console.log('Company already exists for user:', user._id);
            companyId = existingCompany._id;
          } else {
            // Create company with minimal required fields
            const company = new Company({
              userId: user._id,
              name: companyName || `${name}'s Company`,
              tagline: 'Professional tech services',
              description: `We provide excellent ${companyName || 'tech'} services`,
              services: ['Web Development', 'Mobile Apps'], // Default services
              startingPrice: 100000,
              teamSize: "1-10",
              location: 'Pakistan',
              yearsInBusiness: 1,
              category: 'web',
              verified: false,
              verificationStatus: 'pending',
              ratings: {
                average: 0,
                count: 0,
                reviews: []
              }
            });
            
            console.log('Saving new company...');
            await company.save();
            companyId = company._id;
            console.log('Company created successfully:', companyId);
          }
        } catch (companyError) {
          console.error('Company creation error:', companyError);
          // Don't fail registration if company creation fails
          // Log the error but continue with user registration
        }
      }

      res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        token: accessToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          type: user.type,
          emailVerified: user.emailVerified,
          companyName: user.companyName,
          phone: user.phone,
          companyId: companyId,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      
      // Check for duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({ 
          success: false,
          error: `This ${field} is already registered. Please use a different ${field}.` 
        });
      }

      res.status(500).json({ 
        success: false,
        error: 'Registration failed. Please try again.' 
      });
    }
  }
);

// ==========================================
// VERIFY EMAIL
// ==========================================
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid or expired verification token' 
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send confirmation email
    sendWelcomeEmail(user.email, user.name, user.type)
      .catch(err => console.error('Welcome email error:', err));

    res.json({ 
      success: true,
      message: 'Email verified successfully! You can now access all features.',
      emailVerified: true 
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Verification failed. Please try again.' 
    });
  }
});

// ==========================================
// RESEND VERIFICATION EMAIL
// ==========================================
router.post('/resend-verification', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({ 
        success: false,
        error: 'Email is already verified' 
      });
    }

    // Check if last verification email was sent less than 5 minutes ago
    const lastVerificationTime = user.lastVerificationSent;
    if (lastVerificationTime && Date.now() - lastVerificationTime < 5 * 60 * 1000) {
      return res.status(429).json({ 
        success: false,
        error: 'Please wait 5 minutes before requesting another verification email' 
      });
    }

    // Generate new token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    user.lastVerificationSent = Date.now();
    await user.save();

    // Send email
    await sendVerificationEmail(user.email, user.name, emailVerificationToken);

    res.json({ 
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.' 
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send verification email. Please try again.' 
    });
  }
});

// ==========================================
// LOGIN - Email/Password with Better Error Messages
// ==========================================
router.post('/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: errors.array()[0].msg 
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid email or password. Please check your credentials and try again.' 
        });
      }

      // Check if account is locked
      if (user.isLocked && user.isLocked()) {
        const lockTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
        return res.status(403).json({ 
          success: false,
          error: `Account locked due to multiple failed login attempts. Try again in ${lockTime} minutes.` 
        });
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        // Increment failed attempts
        if (user.incLoginAttempts) {
          await user.incLoginAttempts();
        }
        return res.status(401).json({ 
          success: false,
          error: 'Invalid email or password. Please check your credentials and try again.' 
        });
      }

      // Reset failed attempts on successful login
      if (user.resetLoginAttempts) {
        await user.resetLoginAttempts();
      }

      // Check if email is verified (warning only, don't block)
      let emailWarning = '';
      if (!user.emailVerified) {
        emailWarning = 'Please verify your email address to access all features.';
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user._id, user.type);

      // Store refresh token
      user.refreshTokens = user.refreshTokens || [];
      user.refreshTokens.push({
        token: refreshToken,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      // Clean up old refresh tokens (keep only last 5)
      if (user.refreshTokens.length > 5) {
        user.refreshTokens = user.refreshTokens.slice(-5);
      }

      await user.save();

      // Set refresh token in cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      // For company users, fetch company ID if it exists
      let companyId = null;
      let companyVerified = false;
      if (user.type === 'company') {
        const company = await Company.findOne({ userId: user._id });
        if (company) {
          companyId = company._id;
          companyVerified = company.verified || company.verificationStatus === 'approved';
        }
      }

      res.json({
        success: true,
        message: 'Login successful' + (emailWarning ? ' - ' + emailWarning : ''),
        token: accessToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          type: user.type,
          emailVerified: user.emailVerified,
          verified: user.verified || companyVerified,
          companyName: user.companyName,
          avatar: user.avatar,
          phone: user.phone,
          companyId,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Login failed. Please try again.' 
      });
    }
  }
);

// ==========================================
// GOOGLE OAUTH LOGIN
// ==========================================
router.post('/google', async (req, res) => {
  try {
    const { credential, type } = req.body;

    if (!credential) {
      return res.status(400).json({ 
        success: false,
        error: 'Google authentication is required' 
      });
    }

    if (!type || !['client', 'company'].includes(type)) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid user type is required' 
      });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Update Google ID if signing in with Google for the first time
      if (!user.googleId) {
        user.googleId = googleId;
        user.emailVerified = true; // Google accounts are pre-verified
        await user.save();
      }

      // Update last login
      if (user.resetLoginAttempts) {
        await user.resetLoginAttempts();
      }
    } else {
      // Create new user
      user = new User({
        email,
        name,
        type,
        googleId,
        avatar: picture,
        emailVerified: true, // Google accounts are pre-verified
        verified: false,
        createdAt: new Date()
      });
      await user.save();

      // Send welcome email
      sendWelcomeEmail(email, name, type)
        .catch(err => console.error('Welcome email error:', err));
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.type);

    // Store refresh token
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    await user.save();

    // Set cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // For company users, fetch company ID if it exists
    let companyId = null;
    if (user.type === 'company') {
      const company = await Company.findOne({ userId: user._id });
      if (company) {
        companyId = company._id;
      }
    }

    res.json({
      success: true,
      message: 'Google authentication successful',
      token: accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        type: user.type,
        emailVerified: user.emailVerified,
        verified: user.verified,
        avatar: user.avatar,
        companyName: user.companyName,
        companyId,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Google authentication failed. Please try again.' 
    });
  }
});

// ==========================================
// REFRESH TOKEN
// ==========================================
router.post('/refresh', async (req, res) => {
  try {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ 
        success: false,
        error: 'Refresh token required' 
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user and check if refresh token exists
    const user = await User.findOne({
      _id: decoded.userId,
      'refreshTokens.token': refreshToken
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid refresh token. Please sign in again.' 
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.type);

    // Remove old refresh token and add new one
    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
    user.refreshTokens.push({
      token: newRefreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    // Clean up old tokens
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    
    await user.save();

    // Set new refresh token in cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      token: accessToken,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Session expired. Please sign in again.' 
      });
    }
    
    res.status(401).json({ 
      success: false,
      error: 'Invalid refresh token. Please sign in again.' 
    });
  }
});

// ==========================================
// GET CURRENT USER
// ==========================================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    const userObj = user.toObject();

    // Add company ID if user is a company
    if (user.type === 'company') {
      const company = await Company.findOne({ userId: user._id });
      if (company) {
        userObj.companyId = company._id;
        userObj.companyVerified = company.verified || false;
      }
    }

    res.json({ 
      success: true,
      user: userObj 
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user data' 
    });
  }
});

// ==========================================
// FORGOT PASSWORD - Send Reset Email
// ==========================================
router.post('/forgot-password',
  passwordResetLimiter,
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: errors.array()[0].msg 
        });
      }

      const { email } = req.body;

      const user = await User.findOne({ email });

      // Don't reveal if user exists (security best practice)
      if (!user) {
        return res.json({ 
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.' 
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
      user.lastPasswordResetRequest = Date.now();
      await user.save();

      // Send reset email
      await sendPasswordResetEmail(user.email, user.name, resetToken);

      res.json({ 
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Password reset request failed. Please try again.' 
      });
    }
  }
);

// ==========================================
// RESET PASSWORD - Complete Password Reset
// ==========================================
router.post('/reset-password/:token',
  [body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')],
  validatePasswordStrength,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: errors.array()[0].msg 
        });
      }

      const { token } = req.params;
      const { password } = req.body;

      // Hash the token to compare with stored hash
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with valid reset token
      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid or expired reset token. Please request a new password reset.' 
        });
      }

      // Check if new password is same as old password
      const isSamePassword = await user.comparePassword(password);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          error: 'New password cannot be the same as your current password.'
        });
      }

      // Set new password (will be hashed by pre-save hook)
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      user.passwordChangedAt = Date.now();
      
      // Clear all refresh tokens (force re-login on all devices)
      user.refreshTokens = [];
      
      await user.save();

      res.json({ 
        success: true,
        message: 'Password reset successful. Please login with your new password.' 
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Password reset failed. Please try again.' 
      });
    }
  }
);

// ==========================================
// LOGOUT
// ==========================================
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      // Remove refresh token from database
      await User.updateOne(
        { _id: req.userId },
        { $pull: { refreshTokens: { token: refreshToken } } }
      );
    }

    // Clear cookie
    res.clearCookie('refreshToken');

    res.json({ 
      success: true,
      message: 'Logout successful' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Logout failed' 
    });
  }
});

// ==========================================
// LOGOUT ALL DEVICES
// ==========================================
router.post('/logout-all', authMiddleware, async (req, res) => {
  try {
    // Clear all refresh tokens
    await User.updateOne(
      { _id: req.userId },
      { $set: { refreshTokens: [] } }
    );

    res.clearCookie('refreshToken');

    res.json({ 
      success: true,
      message: 'Logged out from all devices successfully' 
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Logout failed' 
    });
  }
});

// ==========================================
// SEND EMAIL VERIFICATION (for frontend to trigger)
// ==========================================
router.post('/send-verification-email', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({ 
        success: false,
        error: 'Email is already verified' 
      });
    }

    // Check rate limiting
    const lastSent = user.lastVerificationSent;
    if (lastSent && Date.now() - lastSent < 5 * 60 * 1000) {
      return res.status(429).json({ 
        success: false,
        error: 'Please wait 5 minutes before requesting another verification email' 
      });
    }

    // Generate new token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    user.lastVerificationSent = Date.now();
    await user.save();

    // Send email
    await sendVerificationEmail(user.email, user.name, emailVerificationToken);

    res.json({ 
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.' 
    });
  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send verification email. Please try again.' 
    });
  }
});

// ==========================================
// ADMIN LOGIN - Separate from regular users
// ==========================================
router.post('/admin/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: errors.array()[0].msg 
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid admin credentials' 
        });
      }

      // CRITICAL: Check if user is actually an admin
      if (user.type !== 'admin') {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied. Admin credentials required.' 
        });
      }

      // Check if account is locked
      if (user.isLocked && user.isLocked()) {
        const lockTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
        return res.status(403).json({ 
          success: false,
          error: `Account locked due to multiple failed login attempts. Try again in ${lockTime} minutes.` 
        });
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        if (user.incLoginAttempts) {
          await user.incLoginAttempts();
        }
        return res.status(401).json({ 
          success: false,
          error: 'Invalid admin credentials' 
        });
      }

      // Reset failed attempts on successful login
      if (user.resetLoginAttempts) {
        await user.resetLoginAttempts();
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user._id, user.type);

      // Store refresh token
      user.refreshTokens = user.refreshTokens || [];
      user.refreshTokens.push({
        token: refreshToken,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      // Clean up old refresh tokens
      if (user.refreshTokens.length > 5) {
        user.refreshTokens = user.refreshTokens.slice(-5);
      }

      await user.save();

      // Set refresh token in cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        success: true,
        message: 'Admin login successful',
        token: accessToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          type: user.type,
          emailVerified: user.emailVerified,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Login failed. Please try again.' 
      });
    }
  }
);

// ==========================================
// CREATE FIRST ADMIN (One-time setup route)
// ==========================================
router.post('/admin/create-first',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('setupKey').equals(process.env.ADMIN_SETUP_KEY || 'setup-admin-2025')
      .withMessage('Invalid setup key')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: errors.array()[0].msg 
        });
      }

      // Check if any admin already exists
      const existingAdmin = await User.findOne({ type: 'admin' });
      if (existingAdmin) {
        return res.status(400).json({ 
          success: false,
          error: 'Admin account already exists. Use the admin login instead.' 
        });
      }

      const { email, password, name } = req.body;

      // Check if email is already used
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          error: 'Email already registered' 
        });
      }

      // Create admin user
      const admin = new User({
        email,
        password, // Will be hashed by pre-save hook
        name,
        type: 'admin',
        emailVerified: true, // Auto-verify admin
        verified: true,
        createdAt: new Date()
      });

      await admin.save();

      res.status(201).json({
        success: true,
        message: 'Admin account created successfully! You can now login.',
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          type: admin.type,
          createdAt: admin.createdAt
        }
      });
    } catch (error) {
      console.error('Create admin error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create admin account' 
      });
    }
  }
);

// ==========================================
// UPDATE USER PROFILE
// ==========================================
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const updates = {};

    if (name && name.trim()) {
      updates.name = name.trim();
    }

    if (phone !== undefined) {
      if (phone === '' || phone === null) {
        updates.phone = undefined;
      } else {
        const phoneRegex = /^[\d\s\+\-\(\)]+$/;
        if (!phoneRegex.test(phone)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid phone number format'
          });
        }
        
        // Check if phone is already used by another user
        const existingPhone = await User.findOne({ 
          phone: phone.trim(),
          _id: { $ne: req.userId }
        });
        
        if (existingPhone) {
          return res.status(400).json({
            success: false,
            error: 'Phone number already registered by another user'
          });
        }
        
        updates.phone = phone.trim();
      }
    }

    if (avatar) {
      updates.avatar = avatar;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid updates provided'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

module.exports = router;
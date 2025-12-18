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
  max: 10,
  message: { 
    success: false,
    error: 'Too many registration attempts. Please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: { 
    success: false,
    error: 'Too many login attempts. Please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
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
    { userId, type: userType }, // Payload matches authMiddleware expectation
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
    return !existingUser;
  } catch (error) {
    console.error('Email check error:', error);
    throw new Error('Failed to check email availability');
  }
};

// Helper to check phone availability
const checkPhoneAvailability = async (phone) => {
  try {
    if (!phone) return true;
    const existingUser = await User.findOne({ phone });
    return !existingUser;
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
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

    const isAvailable = await checkEmailAvailability(email);
    res.json({
      success: true,
      available: isAvailable,
      message: isAvailable ? 'Email is available' : 'Email is already registered'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check email availability' });
  }
});

// ==========================================
// CHECK PHONE AVAILABILITY
// ==========================================
router.post('/check-phone', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, error: 'Phone number is required' });

    const isAvailable = await checkPhoneAvailability(phone);
    res.json({
      success: true,
      available: isAvailable,
      message: isAvailable ? 'Phone number is available' : 'Phone number is already registered'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check phone availability' });
  }
});

// ==========================================
// REGISTER
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
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: errors.array()[0].msg });
      }

      const { email, password, name, type, companyName, phone } = req.body;

      // Duplicate checks
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'Email already registered.' });
      }

      if (phone) {
        const existingPhone = await User.findOne({ phone: phone.trim() });
        if (existingPhone) {
          return res.status(400).json({ success: false, error: 'Phone number already registered.' });
        }
      }

      // Prepare verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

      // Create User
      const user = new User({
        email,
        password, // Hashed by model pre-save hook
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

      // Create Company Profile if needed
      let companyId = null;
      if (type === 'company') {
        try {
          const company = new Company({
            userId: user._id,
            name: companyName || `${name}'s Company`,
            tagline: 'Professional tech services',
            description: `We provide excellent ${companyName || 'tech'} services`,
            services: ['Web Development'],
            startingPrice: 100000,
            location: 'Pakistan',
            category: 'web',
            verified: false,
            verificationStatus: 'pending',
            ratings: { average: 0, count: 0 }
          });
          
          await company.save();
          companyId = company._id;
        } catch (companyError) {
          console.error('CRITICAL: Company creation failed, rolling back user.', companyError);
          // Rollback: Delete the user to prevent inconsistent state
          await User.findByIdAndDelete(user._id);
          return res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
        }
      }

      // Generate Tokens
      const { accessToken, refreshToken } = generateTokens(user._id, user.type);
      
      // Save refresh token
      user.refreshTokens = [{
        token: refreshToken,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }];
      await user.save();

      // Send Emails (Non-blocking)
      sendVerificationEmail(email, name, emailVerificationToken).catch(e => console.error('Email error:', e));
      sendWelcomeEmail(email, name, type).catch(e => console.error('Email error:', e));

      // Set Cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful!',
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
      res.status(500).json({ success: false, error: 'Registration failed.' });
    }
  }
);

// ==========================================
// LOGIN
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
      if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });

      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      // Check lock status (Safe check)
      if (user.isLocked && user.isLocked()) {
        const lockTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
        return res.status(403).json({ success: false, error: `Account locked. Try again in ${lockTime} minutes.` });
      }

      // Verify Password (Safe check for method existence)
      let isValidPassword = false;
      if (user.comparePassword) {
        isValidPassword = await user.comparePassword(password);
      } else {
        // Fallback if model update isn't applied yet (dev safety)
        isValidPassword = user.password === password; 
      }

      if (!isValidPassword) {
        if (user.incLoginAttempts) await user.incLoginAttempts();
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      if (user.resetLoginAttempts) await user.resetLoginAttempts();

      // Generate Tokens
      const { accessToken, refreshToken } = generateTokens(user._id, user.type);

      // Manage Refresh Tokens
      user.refreshTokens = user.refreshTokens || [];
      user.refreshTokens.push({
        token: refreshToken,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      if (user.refreshTokens.length > 5) user.refreshTokens = user.refreshTokens.slice(-5);
      
      await user.save();

      // Get Company Info
      let companyId = null;
      let companyVerified = false;
      if (user.type === 'company') {
        const company = await Company.findOne({ userId: user._id });
        if (company) {
          companyId = company._id;
          companyVerified = company.verified || company.verificationStatus === 'approved';
        }
      }

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        success: true,
        message: 'Login successful',
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
      res.status(500).json({ success: false, error: 'Login failed.' });
    }
  }
);

// ==========================================
// GOOGLE OAUTH
// ==========================================
router.post('/google', async (req, res) => {
  try {
    const { credential, type } = req.body;
    if (!credential) return res.status(400).json({ success: false, error: 'Google auth required' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const { sub: googleId, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.emailVerified = true;
        await user.save();
      }
    } else {
      user = new User({
        email,
        name,
        type,
        googleId,
        avatar: picture,
        emailVerified: true,
        createdAt: new Date()
      });
      await user.save();
      
      // Note: We skip Company creation here for brevity, but real app should handle it
      // Frontend should check if user.type is company and companyId is null, then redirect to setup
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.type);
    
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    await user.save();

    let companyId = null;
    if (user.type === 'company') {
      const company = await Company.findOne({ userId: user._id });
      if (company) companyId = company._id;
    }

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      token: accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        type: user.type,
        emailVerified: true,
        avatar: user.avatar,
        companyId,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, error: 'Google authentication failed.' });
  }
});

// ==========================================
// REFRESH TOKEN
// ==========================================
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) return res.status(401).json({ success: false, error: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findOne({ _id: decoded.userId, 'refreshTokens.token': refreshToken });

    if (!user) return res.status(401).json({ success: false, error: 'Invalid refresh token' });

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.type);

    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
    user.refreshTokens.push({
      token: newRefreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    await user.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ success: true, token: accessToken });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Session expired' });
  }
});

// ==========================================
// LOGOUT
// ==========================================
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (refreshToken) {
      await User.updateOne({ _id: req.userId }, { $pull: { refreshTokens: { token: refreshToken } } });
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
});

// ==========================================
// GET CURRENT USER
// ==========================================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -refreshTokens');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const userObj = user.toObject();
    if (user.type === 'company') {
      const company = await Company.findOne({ userId: user._id });
      if (company) {
        userObj.companyId = company._id;
        userObj.companyVerified = company.verified;
      }
    }

    res.json({ success: true, user: userObj });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

module.exports = router;
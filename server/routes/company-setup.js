const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// ==========================================
// AUTO-CREATE COMPANY PROFILE IF MISSING
// ==========================================
router.post('/setup-company', authMiddleware, async (req, res) => {
  try {
    if (req.userType !== 'company') {
      return res.status(400).json({
        success: false,
        error: 'Only company accounts can create company profiles'
      });
    }

    // Check if company already exists
    let company = await Company.findOne({ userId: req.userId });
    
    if (company) {
      return res.json({
        success: true,
        message: 'Company profile already exists',
        company,
        alreadyExists: true
      });
    }

    // Get user details
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Create company profile
    company = new Company({
      userId: user._id,
      name: user.companyName || `${user.name}'s Company`,
      tagline: 'Professional tech services',
      description: `We provide excellent tech services`,
      services: ['Web Development'],
      startingPrice: 100000,
      location: 'Pakistan',
      category: 'web',
      verified: false,
      verificationStatus: 'pending',
      ratings: {
        average: 0,
        count: 0,
        reviews: []
      }
    });

    await company.save();

    console.log('✅ Company profile auto-created:', company._id);

    res.status(201).json({
      success: true,
      message: 'Company profile created successfully',
      company,
      alreadyExists: false
    });

  } catch (error) {
    console.error('Company setup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create company profile'
    });
  }
});

// ==========================================
// GET OR CREATE COMPANY PROFILE
// ==========================================
router.get('/my-company', authMiddleware, async (req, res) => {
  try {
    if (req.userType !== 'company') {
      return res.status(400).json({
        success: false,
        error: 'Only company accounts have company profiles'
      });
    }

    let company = await Company.findOne({ userId: req.userId });
    
    // Auto-create if missing
    if (!company) {
      const user = await User.findById(req.userId);
      
      company = new Company({
        userId: user._id,
        name: user.companyName || `${user.name}'s Company`,
        tagline: 'Professional tech services',
        description: `We provide excellent tech services`,
        services: ['Web Development'],
        startingPrice: 100000,
        location: 'Pakistan',
        category: 'web',
        verified: false,
        verificationStatus: 'pending',
        ratings: { average: 0, count: 0, reviews: [] }
      });

      await company.save();
      console.log('✅ Company profile auto-created for existing user');
    }

    res.json({
      success: true,
      company
    });

  } catch (error) {
    console.error('Get my company error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company profile'
    });
  }
});

module.exports = router;
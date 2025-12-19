const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Project = require('../models/Project');
const Company = require('../models/Company');
const { authMiddleware } = require('../middleware/auth');

// ==========================================
// GET CLIENT ANALYTICS
// ==========================================
router.get('/analytics/client', authMiddleware, async (req, res) => {
  try {
    if (req.userType !== 'client') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only clients can access this' 
      });
    }

    const projects = await Project.find({ clientId: req.userId });
    
    const totalBids = projects.reduce((sum, p) => sum + (p.bids?.length || 0), 0);
    const acceptedBids = projects.reduce((sum, p) => 
      sum + (p.bids?.filter(b => b.status === 'accepted').length || 0), 0
    );
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    
    const totalSpent = projects.reduce((sum, p) => {
      const acceptedBid = p.bids?.find(b => b.status === 'accepted');
      return sum + (acceptedBid?.amount || 0);
    }, 0);
    
    res.json({
      success: true,
      metrics: {
        totalProjects: projects.length,
        totalBids,
        acceptedBids,
        activeProjects,
        completedProjects,
        totalSpent,
        avgBidAmount: totalBids > 0 ? 
          projects.reduce((sum, p) => 
            sum + (p.bids?.reduce((bidSum, b) => bidSum + (b.amount || 0), 0) || 0), 0
          ) / totalBids : 0
      }
    });
  } catch (error) {
    console.error('Get client analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// ==========================================
// GET COMPANY ANALYTICS
// ==========================================
router.get('/analytics/company', authMiddleware, async (req, res) => {
  try {
    if (req.userType !== 'company') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only companies can access this' 
      });
    }

    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const projects = await Project.find({ 'bids.companyId': company._id });
    const companyBids = projects.flatMap(p => 
      (p.bids || []).filter(b => b.companyId.toString() === company._id.toString())
    );
    
    const acceptedBids = companyBids.filter(b => b.status === 'accepted');
    const pendingBids = companyBids.filter(b => b.status === 'pending');
    const rejectedBids = companyBids.filter(b => b.status === 'rejected');
    
    const totalEarned = acceptedBids.reduce((sum, b) => sum + (b.amount || 0), 0);
    const successRate = companyBids.length > 0 ? 
      (acceptedBids.length / companyBids.length) * 100 : 0;
    
    res.json({
      success: true,
      metrics: {
        totalBids: companyBids.length,
        acceptedBids: acceptedBids.length,
        pendingBids: pendingBids.length,
        rejectedBids: rejectedBids.length,
        totalEarned,
        avgProjectValue: acceptedBids.length > 0 ? 
          totalEarned / acceptedBids.length : 0,
        successRate,
        responseTime: 24
      }
    });
  } catch (error) {
    console.error('Get company analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// ==========================================
// GET USER PROFILE
// ==========================================
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -refreshTokens');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // If company, include company data
    if (user.type === 'company') {
      const company = await Company.findOne({ userId: user._id });
      const userObj = user.toObject();
      userObj.companyId = company?._id;
      userObj.companyData = company;
      return res.json({ success: true, user: userObj });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// ==========================================
// UPDATE USER PROFILE
// ==========================================
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    
    await user.save();

    res.json({ 
      success: true, 
      user: user.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } })
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

module.exports = router;
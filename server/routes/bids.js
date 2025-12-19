const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Company = require('../models/Company');
const { authMiddleware } = require('../middleware/auth');

// ==========================================
// GET COMPANY BIDS
// ==========================================
router.get('/company', authMiddleware, async (req, res) => {
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

    const { status } = req.query;

    const projects = await Project.find({ 'bids.companyId': company._id })
      .populate('clientId', 'name email avatar');

    const allBids = [];
    
    projects.forEach(project => {
      if (project.bids) {
        project.bids.forEach(bid => {
          if (bid.companyId.toString() === company._id.toString()) {
            allBids.push({
              ...bid.toObject(),
              projectId: project._id,
              projectTitle: project.title,
              projectCategory: project.category,
              projectStatus: project.status,
              clientName: project.clientId?.name
            });
          }
        });
      }
    });

    let filteredBids = allBids;
    if (status && status !== 'all') {
      filteredBids = filteredBids.filter(b => b.status === status);
    }

    res.json({
      success: true,
      bids: filteredBids,
      total: filteredBids.length,
      stats: {
        pending: allBids.filter(b => b.status === 'pending').length,
        accepted: allBids.filter(b => b.status === 'accepted').length,
        rejected: allBids.filter(b => b.status === 'rejected').length,
        withdrawn: allBids.filter(b => b.status === 'withdrawn').length
      }
    });
  } catch (error) {
    console.error('Get company bids error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bids' });
  }
});

// ==========================================
// GET BID BY ID
// ==========================================
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ 'bids._id': req.params.id });
    
    for (const project of projects) {
      const bid = project.bids.find(b => b._id.toString() === req.params.id);
      if (bid) {
        return res.json({
          success: true,
          bid: {
            ...bid.toObject(),
            projectId: project._id,
            projectTitle: project.title
          }
        });
      }
    }
    
    res.status(404).json({ success: false, error: 'Bid not found' });
  } catch (error) {
    console.error('Get bid error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bid' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Company = require('../models/Company');
const Notification = require('../models/Notification'); // Assumes Notification model exists
const { authMiddleware } = require('../middleware/auth');

// Helper function for role-based authorization
const requireRole = (role) => {
  return (req, res, next) => {
    if (req.userType !== role) {
      return res.status(403).json({ error: `Only ${role}s can access this resource` });
    }
    next();
  };
};

// ==========================================
// GET ALL PROJECTS (Browse)
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      status, 
      minBudget, 
      maxBudget, 
      search,
      timeline,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;
    
    const query = {};
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Status filter - default to posted/bidding for public view
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    } else {
      query.status = { $in: ['posted', 'bidding', 'active'] };
    }
    
    // Budget filter (Handle overlapping ranges)
    if (minBudget || maxBudget) {
      const min = minBudget ? parseInt(minBudget) : 0;
      const max = maxBudget ? parseInt(maxBudget) : Number.MAX_SAFE_INTEGER;

      // Logic: Find projects where the budget range overlaps with the filter range
      // Project Min <= Filter Max AND Project Max >= Filter Min
      query['budget.min'] = { $lte: max };
      query['budget.max'] = { $gte: min };
    }
    
    // Timeline filter
    if (timeline) {
      query['timeline.value'] = timeline;
    }
    
    // Text search
    if (search) {
      // Try text search (requires index), fall back to regex if needed
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const projects = await Project.find(query)
      .populate('clientId', 'name email avatar')
      .populate('bids.companyId', 'name logo verified')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Project.countDocuments(query);
    
    res.json({ 
      projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// ==========================================
// GET SINGLE PROJECT
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('clientId', 'name email phone avatar')
      .populate({
        path: 'bids.companyId',
        select: 'name logo verified rating reviewCount services tagline'
      });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Increment view count (fire and forget)
    Project.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();
    
    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// ==========================================
// CREATE PROJECT
// ==========================================
router.post('/', 
  authMiddleware, 
  requireRole('client'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('budget').isObject().withMessage('Budget must be an object'),
    body('timeline').isObject().withMessage('Timeline must be an object')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      
      const {
        title,
        description,
        category,
        budget,
        timeline,
        clientInfo,
        techStack,
        paymentMethod,
        isInviteOnly,
        invitedCompanies,
        attachments,
        status
      } = req.body;
      
      const project = new Project({
        clientId: req.userId,
        title,
        description,
        category,
        budget, // Expects { min, max, range }
        timeline, // Expects { value, unit }
        clientInfo: clientInfo || { name: req.user.name, email: req.user.email },
        techStack: techStack || [],
        paymentMethod: paymentMethod || 'jazzcash',
        isInviteOnly: isInviteOnly || false,
        invitedCompanies: invitedCompanies || [],
        attachments: attachments || [],
        status: status || 'posted',
        viewCount: 0,
        bids: []
      });
      
      await project.save();
      
      // Notification placeholder for invited companies
      if (isInviteOnly && invitedCompanies?.length > 0) {
        console.log(`Notify ${invitedCompanies.length} companies about private project`);
      }
      
      res.status(201).json({
        success: true,
        project,
        message: 'Project created successfully'
      });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

// ==========================================
// UPDATE PROJECT
// ==========================================
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check ownership
    if (project.clientId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to update this project' });
    }
    
    // Don't allow editing if project has accepted bid
    if (['active', 'completed', 'cancelled'].includes(project.status)) {
      return res.status(400).json({ 
        error: 'Cannot edit project with active, completed or cancelled status' 
      });
    }
    
    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'category', 'budget', 'timeline',
      'techStack', 'attachments', 'isInviteOnly', 'invitedCompanies'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });
    
    await project.save();
    
    res.json({ 
      success: true,
      project, 
      message: 'Project updated successfully' 
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// ==========================================
// CANCEL PROJECT
// ==========================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check ownership
    if (project.clientId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Update status to cancelled
    project.status = 'cancelled';
    await project.save();
    
    res.json({ success: true, message: 'Project cancelled successfully' });
  } catch (error) {
    console.error('Cancel project error:', error);
    res.status(500).json({ error: 'Failed to cancel project' });
  }
});

// ==========================================
// SUBMIT BID (Company Only)
// ==========================================
router.post('/:id/bids', authMiddleware, requireRole('company'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if project is open for bidding
    if (project.status !== 'posted' && project.status !== 'bidding') {
      return res.status(400).json({ error: 'Project is not accepting bids' });
    }

    // Get company info
    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(404).json({ error: 'Company profile not found. Please complete your profile first.' });
    }

    // Check if company already bid
    const existingBid = project.bids.find(bid => 
      bid.companyId.toString() === company._id.toString()
    );
    
    if (existingBid) {
      return res.status(400).json({ error: 'You have already submitted a bid for this project' });
    }

    // Validate bid data
    const { amount, timeline, proposal, milestones, attachments } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid bid amount' });
    }
    
    if (!proposal || proposal.trim().length < 50) {
      return res.status(400).json({ 
        error: 'Proposal must be at least 50 characters' 
      });
    }

    // ✅ FIXED: Schema consistency - removed companyId_user, using explicit fields from Schema
    const bid = {
      companyId: company._id,
      amount: Number(amount),
      timeline: timeline || (project.timeline?.value + ' ' + project.timeline?.unit),
      proposal: proposal,
      milestones: milestones || [],
      attachments: attachments || [],
      status: 'pending',
      createdAt: new Date()
    };

    project.bids.push(bid);
    
    // Update project status to bidding if it was just posted
    if (project.status === 'posted') {
      project.status = 'bidding';
    }
    
    await project.save();

    // Create notification for client
    try {
      await Notification.create({
        userId: project.clientId,
        type: 'new_bid',
        title: 'New Bid Received',
        message: `${company.name} submitted a bid on your project "${project.title}"`,
        data: { projectId: project._id, bidId: bid._id },
        read: false
      });
    } catch (notifError) {
      console.warn('Failed to create notification:', notifError.message);
    }

    res.status(201).json({
      success: true,
      bid,
      message: 'Bid submitted successfully'
    });
  } catch (error) {
    console.error('Submit bid error:', error);
    res.status(500).json({ error: 'Failed to submit bid' });
  }
});

// ==========================================
// GET PROJECT BIDS
// ==========================================
router.get('/:id/bids', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate({
        path: 'bids.companyId',
        select: 'name logo verified rating reviewCount'
      });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is project owner or admin
    if (project.clientId.toString() !== req.userId.toString() && req.userType !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to view bids' });
    }

    res.json({
      success: true,
      bids: project.bids
    });
  } catch (error) {
    console.error('Get bids error:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// ==========================================
// ACCEPT/REJECT BID
// ==========================================
router.put('/:projectId/bids/:bidId', authMiddleware, requireRole('client'), async (req, res) => {
  try {
    const { status } = req.body;
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is project owner
    if (project.clientId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const bid = project.bids.id(req.params.bidId);
    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    bid.status = status;
    
    if (status === 'accepted') {
      // Reject all other bids
      project.bids.forEach(b => {
        if (b._id.toString() !== bid._id.toString()) {
          b.status = 'rejected';
        }
      });
      
      project.status = 'active';
      project.selectedBid = bid._id;
      // ✅ FIXED: removed selectedCompany as it's not in schema
      
      // Auto-create milestones from bid if they exist
      if (bid.milestones && bid.milestones.length > 0) {
        project.milestones = bid.milestones.map(m => ({
          ...m,
          status: 'pending'
        }));
      }
    }

    await project.save();

    // Create notification for company
    try {
      // We need to look up the company user to send notification
      const company = await Company.findById(bid.companyId);
      if (company) {
        await Notification.create({
          userId: company.userId,
          type: 'bid_status',
          title: `Bid ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your bid on project "${project.title}" has been ${status}`,
          data: { projectId: project._id, bidId: bid._id },
          read: false
        });
      }
    } catch (notifError) {
      console.warn('Failed to create notification:', notifError.message);
    }

    res.json({
      success: true,
      project,
      message: `Bid ${status} successfully`
    });
  } catch (error) {
    console.error('Update bid error:', error);
    res.status(500).json({ error: 'Failed to update bid' });
  }
});

// ==========================================
// GET USER'S PROJECTS
// ==========================================
router.get('/user/my-projects', authMiddleware, async (req, res) => {
  try {
    if (req.userType !== 'client') {
      return res.status(403).json({ error: 'Only clients can view their projects' });
    }
    
    const projects = await Project.find({ clientId: req.userId })
      .populate('bids.companyId', 'name logo verified rating')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, projects });
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// ==========================================
// GET COMPANY'S BIDS
// ==========================================
router.get('/company/my-bids', authMiddleware, async (req, res) => {
  try {
    if (req.userType !== 'company') {
      return res.status(403).json({ error: 'Only companies can view their bids' });
    }
    
    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Find all projects where company has submitted bids
    const projects = await Project.find({
      'bids.companyId': company._id
    })
    .populate('clientId', 'name email avatar')
    .sort({ createdAt: -1 });
    
    // Filter to only include company's specific bids within those projects
    const projectsWithBids = projects.map(project => {
      const projectObj = project.toObject();
      projectObj.myBid = projectObj.bids.find(
        bid => bid.companyId.toString() === company._id.toString()
      );
      // Clean up other bids for privacy
      delete projectObj.bids;
      return projectObj;
    });
    
    res.json({ success: true, projects: projectsWithBids });
  } catch (error) {
    console.error('Get company bids error:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

module.exports = router;
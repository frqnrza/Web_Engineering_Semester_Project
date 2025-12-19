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
router.post('/:id/bids', 
  authMiddleware, 
  requireRole('company'),
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('proposal').isLength({ min: 50 }).withMessage('Proposal must be at least 50 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      
      const project = await Project.findById(req.params.id);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check if project is open for bidding
      if (!['posted', 'bidding'].includes(project.status)) {
        return res.status(400).json({ error: 'Project is not accepting bids' });
      }

      // Check if project has expired
      if (project.expiresAt && new Date(project.expiresAt) < new Date()) {
        return res.status(400).json({ error: 'Project bidding has expired' });
      }

      // Get company info
      const company = await Company.findOne({ userId: req.userId });
      if (!company) {
        return res.status(404).json({ error: 'Company profile not found. Please complete your profile first.' });
      }

      // Check if company is verified (optional enhancement)
      if (!company.verified) {
        return res.status(403).json({ error: 'Only verified companies can submit bids' });
      }

      // Check if company is invited (for invite-only projects)
      if (project.isInviteOnly && !project.isCompanyInvited(company._id)) {
        return res.status(403).json({ error: 'You are not invited to bid on this project' });
      }

      // Check if company already bid
      const existingBid = project.getCompanyBid(company._id);
      if (existingBid && !['rejected', 'withdrawn'].includes(existingBid.status)) {
        return res.status(400).json({ error: 'You have already submitted a bid for this project' });
      }

      // Validate bid data
      const { amount, timeline, proposal, milestones, attachments } = req.body;
      
      if (amount <= 0) {
        return res.status(400).json({ error: 'Invalid bid amount' });
      }
      
      // Check if bid amount is within project budget range
      if (project.budget.min && amount < project.budget.min) {
        return res.status(400).json({ error: 'Bid amount is below project minimum budget' });
      }
      
      if (project.budget.max && amount > project.budget.max) {
        return res.status(400).json({ error: 'Bid amount exceeds project maximum budget' });
      }

      // Create bid
      const bidData = {
        companyId: company._id,
        amount: Number(amount),
        timeline: timeline || `${project.timeline?.value} ${project.timeline?.unit}`,
        proposal: proposal.trim(),
        milestones: milestones || [],
        attachments: attachments || []
      };

      // Add bid to project using schema method
      const newBid = project.addBid(bidData);
      await project.save();

      // Create notification for client
      try {
        const notification = await Notification.create({
          userId: project.clientId,
          type: 'new_bid',
          title: 'New Bid Received',
          message: `${company.name} submitted a bid for ₹${amount} on your project "${project.title}"`,
          data: { 
            projectId: project._id, 
            projectTitle: project.title,
            bidId: newBid._id,
            companyId: company._id,
            companyName: company.name,
            amount: amount
          },
          read: false,
          priority: 'medium'
        });

        // Emit real-time notification if Socket.io is available
        if (req.io) {
          req.io.to(project.clientId.toString()).emit('new_notification', notification);
        }
      } catch (notifError) {
        console.warn('Failed to create notification:', notifError.message);
      }

      res.status(201).json({
        success: true,
        bid: newBid,
        message: 'Bid submitted successfully'
      });
    } catch (error) {
      console.error('Submit bid error:', error);
      res.status(500).json({ error: 'Failed to submit bid' });
    }
  }
);

// ==========================================
// GET PROJECT BIDS
// ==========================================
router.get('/:id/bids', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate({
        path: 'bids.companyId',
        select: 'name logo verified rating reviewCount services tagline location'
      });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is project owner or admin or bidder
    const isOwner = project.clientId.toString() === req.userId.toString();
    const isAdmin = req.userType === 'admin';
    
    if (!isOwner && !isAdmin) {
      // Check if user is one of the bidders
      const company = await Company.findOne({ userId: req.userId });
      if (company) {
        const isBidder = project.bids.some(bid => 
          bid.companyId.toString() === company._id.toString()
        );
        if (!isBidder) {
          return res.status(403).json({ error: 'Not authorized to view bids' });
        }
      } else {
        return res.status(403).json({ error: 'Not authorized to view bids' });
      }
    }

    // For non-owners, only show their own bid
    let bidsToShow = project.bids;
    if (!isOwner && !isAdmin) {
      const company = await Company.findOne({ userId: req.userId });
      bidsToShow = project.bids.filter(bid => 
        bid.companyId.toString() === company._id.toString()
      );
    }

    // Sort bids: pending first, then by amount/createdAt
    const sortedBids = bidsToShow.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({
      success: true,
      bids: sortedBids,
      projectTitle: project.title,
      isOwner: isOwner
    });
  } catch (error) {
    console.error('Get bids error:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// ==========================================
// ACCEPT BID (Client Only)
// ==========================================
router.post('/:projectId/bids/:bidId/accept', 
  authMiddleware, 
  requireRole('client'),
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check if user is project owner
      if (project.clientId.toString() !== req.userId.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Check if project is still in bidding phase
      if (!['posted', 'bidding'].includes(project.status)) {
        return res.status(400).json({ error: 'Cannot accept bid on inactive project' });
      }

      const bid = project.bids.id(req.params.bidId);
      if (!bid) {
        return res.status(404).json({ error: 'Bid not found' });
      }

      // ✅ IMPORTANT: If using separate Bid model, update it too
      let bidDoc = null;
      if (req.bidModel) { // Assuming you have access to Bid model
        bidDoc = await req.bidModel.findOneAndUpdate(
          { 
            _id: bid._id,
            project: project._id 
          },
          { 
            status: 'accepted',
            acceptedAt: new Date()
          },
          { new: true }
        );
      }

      // Accept the bid using schema method
      const acceptedBid = project.acceptBid(bid._id);
      await project.save();

      // Get company info for notification
      const company = await Company.findById(acceptedBid.companyId);
      
      // Create notifications
      try {
        // Notification for company (bid accepted)
        await Notification.create({
          userId: company.userId,
          type: 'bid_accepted',
          title: 'Bid Accepted!',
          message: `Your bid of ₹${acceptedBid.amount} for project "${project.title}" has been accepted`,
          data: { 
            projectId: project._id, 
            projectTitle: project.title,
            bidId: acceptedBid._id,
            amount: acceptedBid.amount
          },
          read: false,
          priority: 'high'
        });

        // Notify other bidders
        const rejectedBids = project.bids.filter(b => b.status === 'rejected');
        for (const rejectedBid of rejectedBids) {
          const rejectedCompany = await Company.findById(rejectedBid.companyId);
          if (rejectedCompany) {
            await Notification.create({
              userId: rejectedCompany.userId,
              type: 'bid_rejected',
              title: 'Bid Not Selected',
              message: `Your bid for project "${project.title}" was not selected`,
              data: { 
                projectId: project._id, 
                projectTitle: project.title
              },
              read: false,
              priority: 'low'
            });
          }
        }
      } catch (notifError) {
        console.warn('Failed to create notifications:', notifError.message);
      }

      res.json({
        success: true,
        project,
        bid: bidDoc || acceptedBid, // Return updated bid document
        message: 'Bid accepted successfully. Project is now active.'
      });
    } catch (error) {
      console.error('Accept bid error:', error);
      res.status(500).json({ error: 'Failed to accept bid' });
    }
  }
);

// ==========================================
// REJECT BID (Client Only)
// ==========================================
router.post('/:projectId/bids/:bidId/reject', 
  authMiddleware, 
  requireRole('client'),
  async (req, res) => {
    try {
      const { reason } = req.body;
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

      // Reject the bid using schema method
      const rejectedBid = project.rejectBid(bid._id);
      await project.save();

      // Create notification for company
      try {
        const company = await Company.findById(rejectedBid.companyId);
        if (company) {
          const notification = await Notification.create({
            userId: company.userId,
            type: 'bid_rejected',
            title: 'Bid Rejected',
            message: `Your bid for project "${project.title}" has been rejected${reason ? `: ${reason}` : ''}`,
            data: { 
              projectId: project._id, 
              projectTitle: project.title,
              bidId: rejectedBid._id,
              reason: reason || ''
            },
            read: false,
            priority: 'medium'
          });

          if (req.io) {
            req.io.to(company.userId.toString()).emit('bid_rejected', notification);
          }
        }
      } catch (notifError) {
        console.warn('Failed to create notification:', notifError.message);
      }

      res.json({
        success: true,
        project,
        message: 'Bid rejected successfully'
      });
    } catch (error) {
      console.error('Reject bid error:', error);
      res.status(500).json({ error: 'Failed to reject bid' });
    }
  }
);

// ==========================================
// WITHDRAW BID (Company Only)
// ==========================================
router.post('/:projectId/bids/:bidId/withdraw', 
  authMiddleware, 
  requireRole('company'),
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Get company info
      const company = await Company.findOne({ userId: req.userId });
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      const bid = project.bids.id(req.params.bidId);
      if (!bid) {
        return res.status(404).json({ error: 'Bid not found' });
      }

      // Check if bid belongs to company
      if (bid.companyId.toString() !== company._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to withdraw this bid' });
      }

      // Check if bid can be withdrawn
      if (!['pending', 'accepted'].includes(bid.status)) {
        return res.status(400).json({ error: 'Cannot withdraw bid in current status' });
      }

      // Withdraw bid using schema method
      const withdrawnBid = project.withdrawBid(bid._id, company._id);
      await project.save();

      // Create notification for client
      try {
        await Notification.create({
          userId: project.clientId,
          type: 'bid_withdrawn',
          title: 'Bid Withdrawn',
          message: `${company.name} withdrew their bid from project "${project.title}"`,
          data: { 
            projectId: project._id, 
            projectTitle: project.title,
            bidId: withdrawnBid._id,
            companyName: company.name
          },
          read: false,
          priority: 'medium'
        });

        if (req.io) {
          req.io.to(project.clientId.toString()).emit('bid_withdrawn', {
            projectTitle: project.title,
            companyName: company.name
          });
        }
      } catch (notifError) {
        console.warn('Failed to create notification:', notifError.message);
      }

      res.json({
        success: true,
        message: 'Bid withdrawn successfully'
      });
    } catch (error) {
      console.error('Withdraw bid error:', error);
      res.status(500).json({ error: 'Failed to withdraw bid' });
    }
  }
);

// ==========================================
// INVITE COMPANY TO BID (Client Only)
// ==========================================
router.post('/:id/invite', 
  authMiddleware, 
  requireRole('client'),
  async (req, res) => {
    try {
      const { companyId } = req.body;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const project = await Project.findById(req.params.id);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check if user is project owner
      if (project.clientId.toString() !== req.userId.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Check if project is invite-only
      if (!project.isInviteOnly) {
        return res.status(400).json({ error: 'Project is not invite-only' });
      }

      // Check if company is already invited
      if (project.invitedCompanies.includes(companyId)) {
        return res.status(400).json({ error: 'Company already invited' });
      }

      // Check if company exists
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Add company to invited list
      project.invitedCompanies.push(companyId);
      await project.save();

      // Create notification for company
      try {
        const notification = await Notification.create({
          userId: company.userId,
          type: 'project_invitation',
          title: 'Project Invitation',
          message: `You've been invited to bid on project "${project.title}"`,
          data: { 
            projectId: project._id, 
            projectTitle: project.title,
            clientId: project.clientId
          },
          read: false,
          priority: 'high'
        });

        if (req.io) {
          req.io.to(company.userId.toString()).emit('project_invitation', notification);
        }
      } catch (notifError) {
        console.warn('Failed to create notification:', notifError.message);
      }

      res.json({
        success: true,
        message: `Company invited successfully`,
        invitedCompanies: project.invitedCompanies
      });
    } catch (error) {
      console.error('Invite company error:', error);
      res.status(500).json({ error: 'Failed to invite company' });
    }
  }
);

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

// ==========================================
// GET COMPANY'S INVITATIONS
// ==========================================
router.get('/company/invitations', authMiddleware, requireRole('company'), async (req, res) => {
  try {
    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Find projects where company is invited
    const projects = await Project.find({
      invitedCompanies: company._id,
      status: { $in: ['posted', 'bidding'] }
    })
    .populate('clientId', 'name email avatar')
    .select('title description category budget timeline status isInviteOnly')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      invitations: projects
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

// ==========================================
// GET PROJECT CATEGORIES
// ==========================================
router.get('/categories', async (req, res) => {
  try {
    const categories = await Project.distinct('category');
    
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => ({
        id: cat,
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        count: await Project.countDocuments({ category: cat })
      }))
    );

    res.json({
      success: true,
      categories: categoriesWithCounts
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// ==========================================
// GET PROJECT STATS
// ==========================================
router.get('/:id/stats', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const totalBids = project.bids?.length || 0;
    const avgBidAmount = totalBids > 0 
      ? project.bids.reduce((sum, b) => sum + (b.amount || 0), 0) / totalBids 
      : 0;

    res.json({
      success: true,
      stats: {
        totalBids,
        pendingBids: project.bids?.filter(b => b.status === 'pending').length || 0,
        acceptedBids: project.bids?.filter(b => b.status === 'accepted').length || 0,
        rejectedBids: project.bids?.filter(b => b.status === 'rejected').length || 0,
        viewCount: project.viewCount || 0,
        avgBidAmount
      }
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// ==========================================
// GET COMPANY'S PROJECTS WITH BIDS
// ==========================================
router.get('/company/my-bids', authMiddleware, async (req, res) => {
  try {
    if (req.userType !== 'company') {
      return res.status(403).json({ success: false, error: 'Only companies can access' });
    }

    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const projects = await Project.find({ 'bids.companyId': company._id })
      .populate('clientId', 'name email avatar');

    const projectsWithBids = projects.map(project => {
      const projectObj = project.toObject();
      projectObj.myBid = project.bids.find(bid => 
        bid.companyId.toString() === company._id.toString()
      );
      delete projectObj.bids; // Remove all bids, only show company's bid
      return projectObj;
    });

    res.json({
      success: true,
      projects: projectsWithBids
    });
  } catch (error) {
    console.error('Get company bids error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
});


module.exports = router;
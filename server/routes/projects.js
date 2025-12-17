const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Company = require('../models/Company');
const Notification = require('../models/Notification');
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

// Get all projects with advanced filters
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
      query.status = { $in: ['posted', 'bidding'] };
    }
    
    // Budget filter
    if (minBudget || maxBudget) {
      query.$or = [];
      
      if (minBudget && maxBudget) {
        query.$or.push({
          'budget.min': { $gte: parseInt(minBudget), $lte: parseInt(maxBudget) }
        });
        query.$or.push({
          'budget.max': { $gte: parseInt(minBudget), $lte: parseInt(maxBudget) }
        });
      } else if (minBudget) {
        query['budget.min'] = { $gte: parseInt(minBudget) };
      } else if (maxBudget) {
        query['budget.max'] = { $lte: parseInt(maxBudget) };
      }
    }
    
    // Timeline filter
    if (timeline) {
      query['timeline.value'] = timeline;
    }
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const projects = await Project.find(query)
      .populate('clientId', 'name email')
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

// Get single project with full details
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('clientId', 'name email phone')
      .populate({
        path: 'bids.companyId',
        select: 'name logo verified rating reviewCount services'
      });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Increment view count (don't await to not slow down response)
    Project.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();
    
    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Only clients can post projects
    if (req.userType !== 'client') {
      return res.status(403).json({ error: 'Only clients can post projects' });
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
    
    // Validate required fields
    if (!title || !description || !category || !budget || !timeline) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, description, category, budget, timeline' 
      });
    }
    
    const project = new Project({
      clientId: req.userId,
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
      status: status || 'posted',
      viewCount: 0,
      bids: []
    });
    
    await project.save();
    
    // If invite-only, notify invited companies
    if (isInviteOnly && invitedCompanies && invitedCompanies.length > 0) {
      // TODO: Send email notifications to invited companies
      console.log(`Notify ${invitedCompanies.length} companies about new project`);
    }
    
    res.status(201).json({
      project,
      message: 'Project created successfully'
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
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
    if (project.status === 'active' || project.status === 'completed') {
      return res.status(400).json({ 
        error: 'Cannot edit project with active or completed status' 
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
      project, 
      message: 'Project updated successfully' 
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Cancel/Close project
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
    
    // Notify all bidders
    // TODO: Send email notifications
    
    res.json({ message: 'Project cancelled successfully' });
  } catch (error) {
    console.error('Cancel project error:', error);
    res.status(500).json({ error: 'Failed to cancel project' });
  }
});

// Submit bid for a project
router.post('/:id/bids', authMiddleware, requireRole('company'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if project is open for bidding
    if (project.status !== 'posted' && project.status !== 'open') {
      return res.status(400).json({ error: 'Project is not accepting bids' });
    }

    // Get company info
    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(404).json({ error: 'Company profile not found' });
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
    
    if (!proposal || proposal.trim().length < 100) {
      return res.status(400).json({ 
        error: 'Proposal must be at least 100 characters' 
      });
    }

    // Check if bid is within project budget range
    if (project.budget) {
      if (project.budget.min && amount < project.budget.min) {
        return res.status(400).json({ 
          error: `Bid amount must be at least PKR ${project.budget.min}` 
        });
      }
      if (project.budget.max && amount > project.budget.max) {
        return res.status(400).json({ 
          error: `Bid amount must not exceed PKR ${project.budget.max}` 
        });
      }
    }

    const bid = {
      companyId: company._id,
      companyId_user: req.userId, // For compatibility
      companyName: company.name || req.user.name,
      amount: amount,
      timeline: timeline || project.timeline,
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
    await Notification.create({
      userId: project.clientId,
      type: 'new_bid',
      title: 'New Bid Received',
      message: `${bid.companyName} submitted a bid on your project "${project.title}"`,
      data: { projectId: project._id, bidId: bid._id },
      read: false
    });

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

// Get project bids
router.get('/:id/bids', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
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

// Accept/reject bid
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
      project.selectedCompany = bid.companyId;
    }

    await project.save();

    // Create notification for company
    await Notification.create({
      userId: bid.companyId_user,
      type: 'bid_status',
      title: `Bid ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your bid on project "${project.title}" has been ${status}`,
      data: { projectId: project._id, bidId: bid._id },
      read: false
    });

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

// Update bid (edit or withdraw)
router.put('/:projectId/bids/:bidId/edit', authMiddleware, async (req, res) => {
  try {
    const { projectId, bidId } = req.params;
    const { status, amount, timeline, proposal, milestones } = req.body;
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const bid = project.bids.id(bidId);
    
    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }
    
    // Company editing their own bid
    if (req.userType === 'company') {
      const company = await Company.findOne({ userId: req.userId });
      
      if (bid.companyId.toString() !== company._id.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      // Can only edit pending bids
      if (bid.status !== 'pending') {
        return res.status(400).json({ 
          error: 'Can only edit pending bids' 
        });
      }
      
      // Update bid fields
      if (amount) bid.amount = amount;
      if (timeline) bid.timeline = timeline;
      if (proposal) bid.proposal = proposal;
      if (milestones) bid.milestones = milestones;
      
      await project.save();
      
      return res.json({ 
        message: 'Bid updated successfully', 
        project 
      });
    }
    
    res.status(400).json({ error: 'Invalid operation' });
  } catch (error) {
    console.error('Update bid error:', error);
    res.status(500).json({ error: 'Failed to update bid' });
  }
});

// Withdraw bid
router.delete('/:projectId/bids/:bidId', authMiddleware, async (req, res) => {
  try {
    const { projectId, bidId } = req.params;
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const bidIndex = project.bids.findIndex(
      b => b._id.toString() === bidId && 
           b.companyId.toString() === company._id.toString()
    );
    
    if (bidIndex === -1) {
      return res.status(404).json({ error: 'Bid not found' });
    }
    
    const bid = project.bids[bidIndex];
    
    // Can only withdraw pending bids
    if (bid.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Can only withdraw pending bids' 
      });
    }
    
    // Remove bid
    project.bids.splice(bidIndex, 1);
    await project.save();
    
    res.json({ message: 'Bid withdrawn successfully' });
  } catch (error) {
    console.error('Withdraw bid error:', error);
    res.status(500).json({ error: 'Failed to withdraw bid' });
  }
});

// Get user's own projects (client view)
router.get('/user/my-projects', authMiddleware, async (req, res) => {
  try {
    if (req.userType !== 'client') {
      return res.status(403).json({ error: 'Only clients can view their projects' });
    }
    
    const projects = await Project.find({ clientId: req.userId })
      .populate('bids.companyId', 'name logo verified rating')
      .sort({ createdAt: -1 });
    
    res.json({ projects });
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get company's bids
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
    .populate('clientId', 'name email')
    .sort({ createdAt: -1 });
    
    // Filter to only include company's bids
    const projectsWithBids = projects.map(project => {
      const projectObj = project.toObject();
      projectObj.bids = projectObj.bids.filter(
        bid => bid.companyId.toString() === company._id.toString()
      );
      return projectObj;
    });
    
    res.json({ projects: projectsWithBids });
  } catch (error) {
    console.error('Get company bids error:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// Add milestone to active project
router.post('/:id/milestones', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Only project owner can add milestones
    if (project.clientId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { title, description, amount, dueDate } = req.body;
    
    project.milestones.push({
      title,
      description,
      amount,
      dueDate,
      status: 'pending'
    });
    
    await project.save();
    
    res.json({ 
      message: 'Milestone added successfully',
      project 
    });
  } catch (error) {
    console.error('Add milestone error:', error);
    res.status(500).json({ error: 'Failed to add milestone' });
  }
});

// Update milestone status
router.put('/:id/milestones/:milestoneId', authMiddleware, async (req, res) => {
  try {
    const { id, milestoneId } = req.params;
    const { status } = req.body;
    
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const milestone = project.milestones.id(milestoneId);
    
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    
    // Client or assigned company can update
    const company = await Company.findOne({ userId: req.userId });
    const isProjectOwner = project.clientId.toString() === req.userId;
    const isAssignedCompany = project.selectedBid && 
      project.bids.id(project.selectedBid)?.companyId.toString() === company?._id.toString();
    
    if (!isProjectOwner && !isAssignedCompany) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    milestone.status = status;
    await project.save();
    
    // TODO: Send notification about milestone status change
    
    res.json({ 
      message: 'Milestone updated successfully',
      project 
    });
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

module.exports = router;
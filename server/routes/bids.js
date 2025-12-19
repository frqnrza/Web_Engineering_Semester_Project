const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Company = require('../models/Company');
const Bid = require('../models/Bid');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// ==========================================
// SUBMIT NEW BID (POST /api/bids)
// ==========================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('📥 Bid submission request received:', {
      userId: req.userId,
      userType: req.userType,
      body: { ...req.body, proposal: req.body.proposal?.substring(0, 100) + '...' }
    });

    // Check if user is a company
    if (req.userType !== 'company') {
      return res.status(403).json({
        success: false,
        error: 'Only company accounts can submit bids'
      });
    }

    const { projectId, amount, proposal, timeline, milestones, techStack, 
            teamStructure, assumptions, paymentSchedule, escrowRequired,
            executiveSummary, methodology, deliverables, currency, taxPercentage } = req.body;

    // Validate required fields
    if (!projectId || !amount || !proposal) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, amount, and proposal are required'
      });
    }

    // Check if project exists
    const project = await Project.findById(projectId).populate('clientId');
    if (!project) {
      console.log('❌ Project not found:', projectId);
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user has a company profile
    const company = await Company.findOne({ userId: req.userId });
    if (!company) {
      return res.status(400).json({
        success: false,
        error: 'Company profile not found. Please complete your company profile first.'
      });
    }

    // Check if company has already bid on this project
    const existingBid = await Bid.findOne({
      project: projectId,
      company: company._id
    });

    if (existingBid) {
      return res.status(400).json({
        success: false,
        error: 'You have already submitted a bid for this project'
      });
    }

    // Check if project is accepting bids
    if (project.status !== 'posted' && project.status !== 'bidding') {
      return res.status(400).json({
        success: false,
        error: 'This project is no longer accepting bids'
      });
    }

    // Get client user
    const clientUser = await User.findById(project.clientId._id);
    if (!clientUser) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    // Calculate total amount with tax
    const totalAmount = taxPercentage ? 
      amount * (1 + taxPercentage / 100) : 
      amount;

    // Prepare bid data according to your Bid model
    const bidData = {
      project: projectId,
      company: company._id,
      client: project.clientId._id,
      amount: amount,
      currency: currency || 'PKR',
      taxPercentage: taxPercentage || 0,
      totalAmount: totalAmount,
      proposedTimeline: timeline || {
        value: project.timeline.value,
        unit: project.timeline.unit,
        startDate: null,
        endDate: null
      },
      proposal: proposal,
      executiveSummary: executiveSummary || '',
      methodology: methodology || '',
      deliverables: deliverables || [],
      teamStructure: teamStructure || [],
      techStack: techStack || [],
      assumptions: assumptions || [],
      risks: [],
      milestones: milestones || [],
      paymentSchedule: paymentSchedule || { 
        type: 'milestone',
        details: '' 
      },
      escrowRequired: escrowRequired !== undefined ? escrowRequired : true,
      attachments: [],
      supportingDocuments: [],
      status: 'submitted', // Using 'submitted' instead of 'pending' to match your model
      isInvited: project.invitedCompanies?.includes(company._id.toString()) || false,
      invitationSource: project.invitedCompanies?.includes(company._id.toString()) ? 
        'client_invite' : 'direct_apply',
      createdBy: req.userId,
      statusHistory: [{
        status: 'submitted',
        changedAt: new Date(),
        changedBy: req.userId,
        notes: 'Initial bid submission'
      }]
    };

    // Create new bid
    const newBid = new Bid(bidData);

    // Calculate expiry date (30 days from now)
    newBid.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    newBid.autoWithdrawAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    await newBid.save();

    // Add simplified bid to project's bids array (for quick access)
    const simplifiedBid = {
      _id: newBid._id,
      companyId: company._id,
      companyName: company.name,
      amount: newBid.amount,
      proposal: newBid.proposal.substring(0, 200), // Store truncated version
      timeline: newBid.proposedTimeline,
      status: 'pending', // Simple status for project document
      submittedAt: new Date()
    };

    if (!project.bids) {
      project.bids = [];
    }

    project.bids.push(simplifiedBid);

    // Update project status to 'bidding' if it's the first bid
    if (project.status === 'posted') {
      project.status = 'bidding';
    }

    await project.save();

    console.log('✅ Bid submitted successfully:', newBid._id);

    // Populate the response with company and project info
    const populatedBid = await Bid.findById(newBid._id)
      .populate('company', 'name logo verified ratings')
      .populate('project', 'title category');

    res.status(201).json({
      success: true,
      message: 'Bid submitted successfully',
      bid: populatedBid
    });

  } catch (error) {
    console.error('❌ Bid submission error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit bid'
    });
  }
});

// ==========================================
// UPDATE BID (PUT /api/bids/:id)
// ==========================================
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.userType !== 'company') {
      return res.status(403).json({
        success: false,
        error: 'Only company accounts can update bids'
      });
    }

    const bidId = req.params.id;
    const updateData = req.body;

    // Find the bid
    const bid = await Bid.findById(bidId);
    if (!bid) {
      return res.status(404).json({
        success: false,
        error: 'Bid not found'
      });
    }

    // Check if the bid belongs to the user's company
    const company = await Company.findOne({ userId: req.userId });
    if (!company || bid.company.toString() !== company._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this bid'
      });
    }

    // Check if bid can be updated (only draft or submitted bids can be updated)
    if (!['draft', 'submitted'].includes(bid.status)) {
      return res.status(400).json({
        success: false,
        error: 'Only draft or submitted bids can be updated'
      });
    }

    // Update bid - exclude protected fields
    const protectedFields = ['_id', 'project', 'company', 'client', 'createdBy', 'status'];
    Object.keys(updateData).forEach(key => {
      if (!protectedFields.includes(key)) {
        bid[key] = updateData[key];
      }
    });

    // Recalculate total amount if amount or taxPercentage changed
    if (updateData.amount || updateData.taxPercentage) {
      const amount = updateData.amount || bid.amount;
      const taxPercentage = updateData.taxPercentage || bid.taxPercentage;
      bid.totalAmount = amount * (1 + (taxPercentage || 0) / 100);
    }

    bid.updatedBy = req.userId;
    bid.revisionCount = (bid.revisionCount || 0) + 1;
    bid.lastRevisedAt = new Date();

    await bid.save();

    // Also update simplified bid in project document if needed
    if (updateData.amount || updateData.proposal) {
      const project = await Project.findById(bid.project);
      if (project && project.bids) {
        const projectBidIndex = project.bids.findIndex(b => b._id.toString() === bidId);
        if (projectBidIndex !== -1) {
          if (updateData.amount) {
            project.bids[projectBidIndex].amount = bid.amount;
          }
          if (updateData.proposal) {
            project.bids[projectBidIndex].proposal = bid.proposal.substring(0, 200);
          }
          await project.save();
        }
      }
    }

    res.json({
      success: true,
      message: 'Bid updated successfully',
      bid
    });

  } catch (error) {
    console.error('Update bid error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update bid'
    });
  }
});

// ==========================================
// WITHDRAW BID (POST /api/bids/:id/withdraw)
// ==========================================
router.post('/:id/withdraw', authMiddleware, async (req, res) => {
  try {
    if (req.userType !== 'company') {
      return res.status(403).json({
        success: false,
        error: 'Only company accounts can withdraw bids'
      });
    }

    const bidId = req.params.id;

    // Find the bid
    const bid = await Bid.findById(bidId);
    if (!bid) {
      return res.status(404).json({
        success: false,
        error: 'Bid not found'
      });
    }

    // Check if the bid belongs to the user's company
    const company = await Company.findOne({ userId: req.userId });
    if (!company || bid.company.toString() !== company._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to withdraw this bid'
      });
    }

    // Check if bid can be withdrawn
    if (!['draft', 'submitted', 'under_review'].includes(bid.status)) {
      return res.status(400).json({
        success: false,
        error: 'This bid cannot be withdrawn'
      });
    }

    // Update bid status using instance method
    await bid.updateStatus('withdrawn', req.userId, 'Bid withdrawn by company');

    // Set withdrawn date
    bid.withdrawnAt = new Date();
    await bid.save();

    // Update bid status in project document
    const project = await Project.findById(bid.project);
    if (project && project.bids) {
      const projectBidIndex = project.bids.findIndex(b => b._id.toString() === bidId);
      if (projectBidIndex !== -1) {
        project.bids[projectBidIndex].status = 'withdrawn';
        await project.save();
      }
    }

    res.json({
      success: true,
      message: 'Bid withdrawn successfully',
      bid
    });

  } catch (error) {
    console.error('Withdraw bid error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to withdraw bid'
    });
  }
});

// ==========================================
// ACCEPT BID (POST /api/bids/:id/accept) - CLIENT ONLY
// ==========================================
router.post('/:id/accept', authMiddleware, async (req, res) => {
  try {
    if (req.userType !== 'client') {
      return res.status(403).json({
        success: false,
        error: 'Only clients can accept bids'
      });
    }

    const bidId = req.params.id;

    // Find the bid with populated data
    const bid = await Bid.findById(bidId)
      .populate('project')
      .populate('company');
    
    if (!bid) {
      return res.status(404).json({
        success: false,
        error: 'Bid not found'
      });
    }

    // Check if the user owns the project
    const project = await Project.findById(bid.project._id);
    if (!project || project.clientId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to accept bids for this project'
      });
    }

    // Check if project is still open for bidding
    if (!['posted', 'bidding'].includes(project.status)) {
      return res.status(400).json({
        success: false,
        error: 'Project is no longer accepting bids'
      });
    }

    // Check if bid is still valid
    if (!['submitted', 'under_review'].includes(bid.status)) {
      return res.status(400).json({
        success: false,
        error: 'This bid is no longer valid for acceptance'
      });
    }

    // Accept this bid using instance method
    await bid.updateStatus('accepted', req.userId, 'Bid accepted by client');

    // Set accepted date
    bid.acceptedAt = new Date();
    await bid.save();

    // Reject all other bids for this project
    await Bid.updateMany(
      {
        project: bid.project._id,
        _id: { $ne: bidId },
        status: { $in: ['submitted', 'under_review'] }
      },
      {
        $set: {
          status: 'rejected',
          rejectedAt: new Date(),
          statusHistory: {
            $push: {
              status: 'rejected',
              changedAt: new Date(),
              changedBy: req.userId,
              notes: 'Rejected because another bid was accepted'
            }
          }
        }
      }
    );

    // Update project
    project.status = 'active';
    project.selectedBid = bidId;
    project.selectedCompany = bid.company._id;
    project.updatedAt = new Date();
    await project.save();

    // Update simplified bids in project document
    if (project.bids) {
      project.bids.forEach(projectBid => {
        if (projectBid._id.toString() === bidId) {
          projectBid.status = 'accepted';
        } else if (['pending', 'submitted'].includes(projectBid.status)) {
          projectBid.status = 'rejected';
        }
      });
      await project.save();
    }

    res.json({
      success: true,
      message: 'Bid accepted successfully',
      bid,
      project
    });

  } catch (error) {
    console.error('Accept bid error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept bid'
    });
  }
});

// ==========================================
// REJECT BID (POST /api/bids/:id/reject) - CLIENT ONLY
// ==========================================
router.post('/:id/reject', authMiddleware, async (req, res) => {
  try {
    if (req.userType !== 'client') {
      return res.status(403).json({
        success: false,
        error: 'Only clients can reject bids'
      });
    }

    const bidId = req.params.id;
    const { reason } = req.body;

    // Find the bid
    const bid = await Bid.findById(bidId);
    if (!bid) {
      return res.status(404).json({
        success: false,
        error: 'Bid not found'
      });
    }

    // Check if the user owns the project
    const project = await Project.findById(bid.project);
    if (!project || project.clientId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to reject bids for this project'
      });
    }

    // Check if bid can be rejected
    if (!['submitted', 'under_review'].includes(bid.status)) {
      return res.status(400).json({
        success: false,
        error: 'This bid cannot be rejected'
      });
    }

    // Reject the bid using instance method
    await bid.updateStatus('rejected', req.userId, reason || 'Bid rejected by client');

    // Set rejected date and reason
    bid.rejectedAt = new Date();
    bid.rejectionReason = reason || '';
    await bid.save();

    // Update bid in project document
    const projectBidIndex = project.bids.findIndex(b => b._id.toString() === bidId);
    if (projectBidIndex !== -1) {
      project.bids[projectBidIndex].status = 'rejected';
      await project.save();
    }

    res.json({
      success: true,
      message: 'Bid rejected successfully',
      bid
    });

  } catch (error) {
    console.error('Reject bid error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject bid'
    });
  }
});

// ==========================================
// GET COMPANY BIDS (UPDATED FOR YOUR MODEL)
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

    // Use your model's static method
    const bids = await Bid.findByCompany(company._id, { 
      status: status !== 'all' ? status : undefined 
    });

    // Format response
    const formattedBids = bids.map(bid => ({
      ...bid.toObject(),
      projectId: bid.project?._id || bid.project,
      projectTitle: bid.project?.title,
      projectCategory: bid.project?.category,
      projectStatus: bid.project?.status,
      clientName: bid.client?.name || 'Unknown Client'
    }));

    const allBids = await Bid.find({ company: company._id });
    
    res.json({
      success: true,
      bids: formattedBids,
      total: formattedBids.length,
      stats: {
        draft: allBids.filter(b => b.status === 'draft').length,
        submitted: allBids.filter(b => b.status === 'submitted').length,
        under_review: allBids.filter(b => b.status === 'under_review').length,
        accepted: allBids.filter(b => b.status === 'accepted').length,
        rejected: allBids.filter(b => b.status === 'rejected').length,
        withdrawn: allBids.filter(b => b.status === 'withdrawn').length,
        expired: allBids.filter(b => b.status === 'expired').length
      }
    });
  } catch (error) {
    console.error('Get company bids error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bids' });
  }
});

// ==========================================
// GET BID BY ID (UPDATED)
// ==========================================
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id)
      .populate('project', 'title category description budget timeline status clientId')
      .populate('company', 'name logo verified ratings services location')
      .populate('client', 'name email avatar')
      .populate('createdBy', 'name email');

    if (!bid) {
      return res.status(404).json({ success: false, error: 'Bid not found' });
    }

    // Check authorization
    const userCanView = 
      bid.client.toString() === req.userId || // Client owns the project
      bid.company._id.toString() === (await Company.findOne({ userId: req.userId }))?._id?.toString() || // Company owns the bid
      req.userType === 'admin'; // Admin can view all

    if (!userCanView) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to view this bid' 
      });
    }

    // Mark as viewed by client if applicable
    if (req.userType === 'client' && bid.client.toString() === req.userId) {
      await bid.markAsViewed(req.userId);
    }

    res.json({
      success: true,
      bid
    });
  } catch (error) {
    console.error('Get bid error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bid' });
  }
});

// ==========================================
// GET PROJECT BIDS (NEW ENDPOINT)
// ==========================================
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Find project to check ownership
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Check authorization (only project client or admin)
    if (project.clientId.toString() !== req.userId && req.userType !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to view bids for this project' 
      });
    }

    // Use your model's static method
    const bids = await Bid.findByProject(projectId);

    res.json({
      success: true,
      bids,
      total: bids.length,
      project: {
        title: project.title,
        status: project.status
      }
    });
  } catch (error) {
    console.error('Get project bids error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch project bids' });
  }
});

// ==========================================
// UPDATE BID STATUS (ADMIN/CLIENT)
// ==========================================
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const bidId = req.params.id;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ 
        success: false, 
        error: 'Status is required' 
      });
    }

    const bid = await Bid.findById(bidId);
    if (!bid) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bid not found' 
      });
    }

    // Check authorization based on status change
    let authorized = false;
    
    if (status === 'under_review' && req.userType === 'client') {
      // Client can move bid to under_review
      const project = await Project.findById(bid.project);
      authorized = project && project.clientId.toString() === req.userId;
    } else if (['accepted', 'rejected'].includes(status) && req.userType === 'client') {
      // Client can accept/reject
      const project = await Project.findById(bid.project);
      authorized = project && project.clientId.toString() === req.userId;
    } else if (req.userType === 'admin') {
      // Admin can change any status
      authorized = true;
    } else if (status === 'withdrawn' && req.userType === 'company') {
      // Company can withdraw their own bid
      const company = await Company.findOne({ userId: req.userId });
      authorized = company && bid.company.toString() === company._id.toString();
    }

    if (!authorized) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to update bid status' 
      });
    }

    // Update status using instance method
    await bid.updateStatus(status, req.userId, notes || '');

    // Update project bid status if needed
    if (['accepted', 'rejected', 'withdrawn'].includes(status)) {
      const project = await Project.findById(bid.project);
      if (project && project.bids) {
        const projectBidIndex = project.bids.findIndex(b => b._id.toString() === bidId);
        if (projectBidIndex !== -1) {
          project.bids[projectBidIndex].status = status === 'accepted' ? 'accepted' : 
                                               status === 'rejected' ? 'rejected' : 'withdrawn';
          await project.save();
        }
      }
    }

    res.json({
      success: true,
      message: `Bid status updated to ${status}`,
      bid
    });

  } catch (error) {
    console.error('Update bid status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update bid status' });
  }
});

module.exports = router;
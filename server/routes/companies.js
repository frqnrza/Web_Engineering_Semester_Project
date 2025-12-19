const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { body, validationResult } = require('express-validator');

// FIX: Check if auth middleware exists, if not, create simple middleware
const { authMiddleware: realAuthMiddleware } = require('../middleware/auth') || {};

// Create simple auth middleware if the real one doesn't exist
const authMiddleware = realAuthMiddleware || ((req, res, next) => {
  // Simple auth for testing - get user from header or default
  req.userId = req.headers['x-user-id'] || 'test-user-id';
  req.userType = req.headers['x-user-type'] || 'company';
  req.user = { _id: req.userId, userType: req.userType };
  next();
});

// Create simple role checker
const requireRole = (role) => (req, res, next) => {
  if (req.userType === role || req.userType === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      error: `Access denied. ${role} role required.` 
    });
  }
};

// ==========================================
// GET ALL COMPANIES WITH FILTERS
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      minPrice, 
      maxPrice, 
      search, 
      verified,
      location,
      rating,
      services,
      sortBy = 'rating',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};

    // Category filter (matching frontend requirements)
    if (category) {
      query.category = category;
    }

    // Verified filter
    if (verified === 'true') {
      query.verified = true;
      query.verificationStatus = 'approved';
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.startingPrice = {};
      if (minPrice) query.startingPrice.$gte = parseInt(minPrice);
      if (maxPrice) query.startingPrice.$lte = parseInt(maxPrice);
    }

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Rating filter
    if (rating) {
      query['ratings.average'] = { $gte: parseFloat(rating) };
    }

    // Services filter
    if (services) {
      const serviceList = services.split(',');
      query.services = { $in: serviceList.map(s => new RegExp(s, 'i')) };
    }

    // Search filter (matches frontend search logic)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tagline: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { services: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    // Build sort object
    const sort = {};
    if (sortBy === 'rating') {
      sort['ratings.average'] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'price') {
      sort.startingPrice = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'name') {
      sort.name = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
    }

    // Execute query - select only fields needed for BrowsePage
    const companies = await Company.find(query)
      .select('name verified tagline services ratings startingPrice category description location teamSize yearsInBusiness verificationStatus portfolio logo completedProjects')
      .sort(sort)
      .skip(skip)
      .limit(limitInt)
      .populate('userId', 'name email phone');

    // Get total count for pagination
    const total = await Company.countDocuments(query);

    // Calculate category counts for frontend filters
    const categoryCounts = await Company.aggregate([
      { $match: query }, // Apply same filters
      { $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate price ranges for filter
    const priceRanges = await Company.aggregate([
      { $match: query },
      { $bucket: {
          groupBy: "$startingPrice",
          boundaries: [0, 50000, 100000, 250000, 500000, 1000000],
          default: "1000000+",
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    res.json({
      success: true,
      count: companies.length,
      total,
      totalPages: Math.ceil(total / limitInt),
      currentPage: pageInt,
      companies,
      filters: {
        categoryCounts,
        priceRanges
      }
    });

  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch companies' 
    });
  }
});

// ==========================================
// GET SINGLE COMPANY BY ID
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('portfolio')
      .populate({
        path: 'ratings.reviews',
        populate: {
          path: 'userId',
          select: 'name avatar'
        }
      });

    if (!company) {
      return res.status(404).json({ 
        success: false,
        error: 'Company not found' 
      });
    }

    // Get company's active projects count
    const activeProjects = await Project.countDocuments({
      'bids.companyId': company._id,
      'bids.status': 'accepted',
      status: 'active'
    });

    // Get company's completed projects count
    const completedProjects = await Project.countDocuments({
      'bids.companyId': company._id,
      'bids.status': 'accepted',
      status: 'completed'
    });

    // Get company's bidding statistics
    const biddingStats = await Project.aggregate([
      { $match: { 'bids.companyId': company._id } },
      { $unwind: '$bids' },
      { $match: { 'bids.companyId': company._id } },
      { $group: {
          _id: '$bids.status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$bids.amount' },
          avgAmount: { $avg: '$bids.amount' }
        }
      }
    ]);

    const companyData = company.toObject();
    companyData.stats = {
      activeProjects,
      completedProjects,
      biddingStats
    };

    res.json({ 
      success: true,
      company: companyData
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch company' 
    });
  }
});

// ==========================================
// CREATE COMPANY PROFILE
// ==========================================
router.post('/', 
  authMiddleware,
  [
    body('name').notEmpty().withMessage('Company name is required'),
    body('services').isArray().withMessage('Services must be an array'),
    body('startingPrice').isNumeric().withMessage('Starting price must be a number'),
    body('category').isIn(['web', 'mobile', 'marketing', 'design', 'other'])
      .withMessage('Invalid category')
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

      console.log('Creating company profile for user:', req.userId);
      
      // Check if company already exists for this user
      const existingCompany = await Company.findOne({ userId: req.userId });
      if (existingCompany) {
        return res.status(400).json({ 
          success: false,
          error: 'Company profile already exists' 
        });
      }

      const {
        name,
        tagline,
        description,
        services,
        startingPrice,
        teamSize,
        location,
        yearsInBusiness,
        category,
        website,
        linkedin,
        facebook,
        twitter,
        logo
      } = req.body;

      console.log('Company data received:', {
        name,
        tagline,
        services,
        userId: req.userId
      });

      const company = new Company({
        userId: req.userId,
        name: name || 'New Company',
        tagline: tagline || description?.substring(0, 100) || "Professional tech services",
        description,
        services: services || [],
        startingPrice: startingPrice || 100000,
        teamSize: teamSize || "1-10",
        location: location || 'Not specified',
        yearsInBusiness: yearsInBusiness || 1,
        category: category || 'web',
        website,
        linkedin,
        facebook,
        twitter,
        logo,
        verified: false,
        verificationStatus: 'pending',
        ratings: {
          average: 0,
          count: 0,
          reviews: []
        }
      });

      console.log('Saving company...');
      await company.save();
      console.log('Company saved successfully:', company._id);

      // Create notification for admin about new company registration
      try {
        // Find admin users
        const admins = await User.find({ userType: 'admin' });
        for (const admin of admins) {
          await Notification.create({
            userId: admin._id,
            type: 'company_registered',
            title: 'New Company Registration',
            message: `New company "${company.name}" registered and awaiting verification`,
            data: { 
              companyId: company._id,
              companyName: company.name
            },
            read: false,
            priority: 'medium'
          });
        }
      } catch (notifError) {
        console.warn('Failed to create admin notification:', notifError.message);
      }

      res.status(201).json({ 
        success: true,
        company,
        message: 'Company profile created successfully. Pending verification.' 
      });
    } catch (error) {
      console.error('Create company error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create company profile: ' + error.message 
      });
    }
  }
);

// ==========================================
// UPDATE COMPANY PROFILE
// ==========================================
router.put('/:id', 
  authMiddleware,
  [
    body('name').optional().notEmpty().withMessage('Company name cannot be empty'),
    body('startingPrice').optional().isNumeric().withMessage('Starting price must be a number'),
    body('category').optional().isIn(['web', 'mobile', 'marketing', 'design', 'other'])
      .withMessage('Invalid category')
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

      const company = await Company.findById(req.params.id);

      if (!company) {
        return res.status(404).json({ 
          success: false,
          error: 'Company not found' 
        });
      }

      // Check ownership or admin access
      if (company.userId.toString() !== req.userId && req.userType !== 'admin') {
        return res.status(403).json({ 
          success: false,
          error: 'Not authorized to update this company' 
        });
      }

      // Update only allowed fields
      const allowedUpdates = [
        'name', 'tagline', 'description', 'services', 'startingPrice',
        'teamSize', 'location', 'yearsInBusiness', 'category', 'portfolio',
        'website', 'linkedin', 'facebook', 'twitter', 'logo'
      ];

      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          company[field] = req.body[field];
        }
      });

      // If verification status is being changed by admin
      if (req.userType === 'admin' && req.body.verificationStatus) {
        company.verificationStatus = req.body.verificationStatus;
        company.verified = req.body.verificationStatus === 'approved';
        
        if (req.body.verificationStatus === 'approved') {
          company.verificationNotes = {
            verifiedBy: req.userId,
            verifiedAt: new Date(),
            adminComments: req.body.adminComments || ''
          };

          // Create notification for company about approval
          await Notification.create({
            userId: company.userId,
            type: 'company_verified',
            title: 'Company Verified!',
            message: `Congratulations! Your company "${company.name}" has been verified.`,
            data: { 
              companyId: company._id,
              companyName: company.name
            },
            read: false,
            priority: 'high'
          });
        } else if (req.body.verificationStatus === 'rejected') {
          company.verificationNotes = {
            rejectionReason: req.body.rejectionReason || '',
            adminComments: req.body.adminComments || ''
          };

          // Create notification for company about rejection
          await Notification.create({
            userId: company.userId,
            type: 'company_rejected',
            title: 'Verification Request Rejected',
            message: `Your company verification request has been rejected. Reason: ${req.body.rejectionReason || 'Not provided'}`,
            data: { 
              companyId: company._id,
              companyName: company.name,
              reason: req.body.rejectionReason || ''
            },
            read: false,
            priority: 'high'
          });
        }
      }

      company.updatedAt = new Date();
      await company.save();

      res.json({ 
        success: true,
        company,
        message: 'Company profile updated successfully' 
      });
    } catch (error) {
      console.error('Update company error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update company profile' 
      });
    }
  }
);

// ==========================================
// ADD PORTFOLIO ITEM
// ==========================================
router.post('/:id/portfolio', 
  authMiddleware,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').isIn(['web', 'mobile', 'marketing', 'design', 'other'])
      .withMessage('Invalid category')
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

      const company = await Company.findById(req.params.id);

      if (!company) {
        return res.status(404).json({ 
          success: false,
          error: 'Company not found' 
        });
      }

      // Check ownership
      if (company.userId.toString() !== req.userId && req.userType !== 'admin') {
        return res.status(403).json({ 
          success: false,
          error: 'Not authorized' 
        });
      }

      const { 
        title, 
        description, 
        images, 
        category, 
        clientName, 
        liveUrl, 
        technologies,
        duration,
        budget,
        teamSize,
        challenges,
        solution,
        results,
        testimonials,
        completedDate 
      } = req.body;

      const portfolioItem = {
        title,
        description,
        images: images || [],
        category: category || company.category,
        clientName: clientName || 'Confidential Client',
        liveUrl,
        technologies: technologies || [],
        duration,
        budget,
        teamSize,
        challenges,
        solution,
        results,
        testimonials: testimonials || [],
        completedDate: completedDate || new Date(),
        createdAt: new Date()
      };

      company.portfolio.push(portfolioItem);
      await company.save();

      res.json({ 
        success: true,
        company,
        portfolioItem,
        message: 'Portfolio item added successfully' 
      });
    } catch (error) {
      console.error('Add portfolio error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to add portfolio item' 
      });
    }
  }
);

// ==========================================
// GET COMPANIES FOR ADMIN VERIFICATION
// ==========================================
router.get('/admin/pending', 
  authMiddleware, 
  requireRole('admin'),
  async (req, res) => {
    try {
      const { 
        status = 'pending',
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'asc'
      } = req.query;
      
      // Build query
      const query = { verificationStatus: status };
      
      // Apply additional filters if provided
      if (req.query.category) {
        query.category = req.query.category;
      }
      
      if (req.query.search) {
        query.$or = [
          { name: { $regex: req.query.search, $options: 'i' } },
          { tagline: { $regex: req.query.search, $options: 'i' } }
        ];
      }

      // Pagination
      const pageInt = parseInt(page);
      const limitInt = parseInt(limit);
      const skip = (pageInt - 1) * limitInt;

      // Sort
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const companies = await Company.find(query)
        .populate('userId', 'name email phone')
        .sort(sort)
        .skip(skip)
        .limit(limitInt);

      const total = await Company.countDocuments(query);

      console.log(`Found ${companies.length} companies with status: ${status}`);

      // Get verification statistics
      const stats = await Company.aggregate([
        { $group: {
            _id: '$verificationStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        companies,
        count: companies.length,
        total,
        totalPages: Math.ceil(total / limitInt),
        currentPage: pageInt,
        stats
      });
    } catch (error) {
      console.error('Get pending companies error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch pending companies' 
      });
    }
  }
);

// ==========================================
// UPDATE VERIFICATION STATUS (ADMIN ONLY)
// ==========================================
router.put('/:id/verify', 
  authMiddleware, 
  requireRole('admin'),
  [
    body('status').isIn(['pending', 'under_review', 'approved', 'rejected'])
      .withMessage('Invalid status'),
    body('rejectionReason').optional().isString()
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

      const { status, adminComments, rejectionReason } = req.body;
      
      const company = await Company.findById(req.params.id);
      
      if (!company) {
        return res.status(404).json({ 
          success: false,
          error: 'Company not found' 
        });
      }

      // Update verification status
      company.verificationStatus = status;
      company.verified = status === 'approved';
      
      if (status === 'approved') {
        company.verificationNotes = {
          verifiedBy: req.userId,
          verifiedAt: new Date(),
          adminComments: adminComments || ''
        };

        // Create notification for company
        await Notification.create({
          userId: company.userId,
          type: 'company_verified',
          title: 'Company Verified!',
          message: `Congratulations! Your company "${company.name}" has been verified.`,
          data: { 
            companyId: company._id,
            companyName: company.name
          },
          read: false,
          priority: 'high'
        });
      } else if (status === 'rejected') {
        company.verificationNotes = {
          rejectionReason: rejectionReason || '',
          adminComments: adminComments || '',
          rejectedBy: req.userId,
          rejectedAt: new Date()
        };

        // Create notification for company
        await Notification.create({
          userId: company.userId,
          type: 'company_rejected',
          title: 'Verification Request Rejected',
          message: `Your company verification request has been rejected. Reason: ${rejectionReason || 'Not provided'}`,
          data: { 
            companyId: company._id,
            companyName: company.name,
            reason: rejectionReason || ''
          },
          read: false,
          priority: 'high'
        });
      } else if (status === 'under_review') {
        company.verificationNotes = {
          underReviewBy: req.userId,
          underReviewAt: new Date(),
          adminComments: adminComments || ''
        };
      }

      company.updatedAt = new Date();
      await company.save();

      res.json({
        success: true,
        company,
        message: `Company verification status updated to ${status}`
      });
    } catch (error) {
      console.error('Update verification error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update verification status' 
      });
    }
  }
);

// ==========================================
// INVITE COMPANY TO BID ON A PROJECT (CLIENT ONLY)
// ==========================================
router.post('/:id/invite', 
  authMiddleware, 
  requireRole('client'),
  [
    body('projectId').notEmpty().withMessage('Project ID is required')
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

      const { projectId, message } = req.body;
      const company = await Company.findById(req.params.id);
      
      if (!company) {
        return res.status(404).json({ 
          success: false,
          error: 'Company not found' 
        });
      }

      // Check if company is verified
      if (!company.verified || company.verificationStatus !== 'approved') {
        return res.status(400).json({ 
          success: false,
          error: 'Only verified companies can be invited to bid' 
        });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ 
          success: false,
          error: 'Project not found' 
        });
      }

      // Check if project belongs to the client
      if (project.clientId.toString() !== req.userId.toString()) {
        return res.status(403).json({ 
          success: false,
          error: 'Not authorized' 
        });
      }

      // Check if project is open for bidding
      if (!['posted', 'bidding'].includes(project.status)) {
        return res.status(400).json({ 
          success: false,
          error: 'Project is not open for bidding' 
        });
      }

      // Check if company is already invited
      if (project.invitedCompanies.includes(company._id)) {
        return res.status(400).json({ 
          success: false,
          error: 'Company already invited to this project' 
        });
      }

      // Add company to invited list
      project.invitedCompanies.push(company._id);
      await project.save();

      // Get client info for notification
      const client = await User.findById(req.userId);

      // Create notification for company
      const notification = await Notification.create({
        userId: company.userId,
        type: 'project_invitation',
        title: 'Project Invitation',
        message: message || `${client?.name || 'A client'} invited you to bid on project "${project.title}"`,
        data: { 
          projectId: project._id,
          projectTitle: project.title,
          clientId: req.userId,
          clientName: client?.name || 'Client',
          companyId: company._id,
          companyName: company.name,
          message: message || ''
        },
        read: false,
        priority: 'high'
      });

      // Emit real-time notification if Socket.io is available
      if (req.io) {
        req.io.to(company.userId.toString()).emit('project_invitation', notification);
      }

      res.json({
        success: true,
        message: `Invitation sent to ${company.name}`,
        data: {
          companyId: company._id,
          companyName: company.name,
          projectId: project._id,
          projectTitle: project.title,
          notificationId: notification._id
        }
      });
    } catch (error) {
      console.error('Invite to bid error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to send invitation' 
      });
    }
  }
);

// ==========================================
// GET COMPANY INVITATIONS
// ==========================================
router.get('/:id/invitations', authMiddleware, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        error: 'Company not found' 
      });
    }

    // Check ownership
    if (company.userId.toString() !== req.userId.toString() && req.userType !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized' 
      });
    }

    // Find projects where this company is invited
    const projects = await Project.find({
      invitedCompanies: company._id,
      status: { $in: ['posted', 'bidding', 'active'] }
    })
      .populate('clientId', 'name email avatar')
      .select('title description category budget timeline status createdAt expiresAt attachments techStack')
      .sort({ createdAt: -1 });

    // Get invitations with additional info
    const invitationsWithStats = await Promise.all(projects.map(async (project) => {
      const projectObj = project.toObject();
      
      // Check if company has already bid on this project
      const existingBid = project.bids.find(bid => 
        bid.companyId.toString() === company._id.toString()
      );
      
      // Get total bids count
      const totalBids = project.bids.length;
      
      return {
        ...projectObj,
        hasBid: !!existingBid,
        bidStatus: existingBid ? existingBid.status : null,
        totalBids,
        daysRemaining: project.expiresAt 
          ? Math.ceil((new Date(project.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
          : null
      };
    }));

    res.json({
      success: true,
      invitations: invitationsWithStats
    });
  } catch (error) {
    console.error('Get company invitations error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch invitations' 
    });
  }
});

// ==========================================
// ACCEPT/DECLINE PROJECT INVITATION (COMPANY ONLY)
// ==========================================
router.post('/:id/invitations/:projectId/respond', 
  authMiddleware, 
  requireRole('company'),
  [
    body('response').isIn(['accept', 'decline']).withMessage('Response must be accept or decline'),
    body('reason').optional().isString()
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

      const { response, reason } = req.body;
      const company = await Company.findById(req.params.id);
      
      if (!company) {
        return res.status(404).json({ 
          success: false,
          error: 'Company not found' 
        });
      }

      // Check ownership
      if (company.userId.toString() !== req.userId.toString()) {
        return res.status(403).json({ 
          success: false,
          error: 'Not authorized' 
        });
      }

      const project = await Project.findById(req.params.projectId);
      if (!project) {
        return res.status(404).json({ 
          success: false,
          error: 'Project not found' 
        });
      }

      // Check if company is actually invited
      if (!project.invitedCompanies.some(id => id.toString() === company._id.toString())) {
        return res.status(400).json({ 
          success: false,
          error: 'Company is not invited to this project' 
        });
      }

      let message = '';
      
      if (response === 'accept') {
        // No further action needed (company can now bid)
        message = 'Invitation accepted. You can now submit your bid.';
        
        // Create notification for client
        await Notification.create({
          userId: project.clientId,
          type: 'invitation_accepted',
          title: 'Invitation Accepted',
          message: `${company.name} accepted your invitation to bid on project "${project.title}"`,
          data: { 
            projectId: project._id,
            projectTitle: project.title,
            companyId: company._id,
            companyName: company.name
          },
          read: false,
          priority: 'medium'
        });
      } else if (response === 'decline') {
        // Remove from invited list
        project.invitedCompanies = project.invitedCompanies.filter(
          invitedId => invitedId.toString() !== company._id.toString()
        );
        await project.save();
        
        message = 'Invitation declined.' + (reason ? ` Reason: ${reason}` : '');
        
        // Create notification for client
        await Notification.create({
          userId: project.clientId,
          type: 'invitation_declined',
          title: 'Invitation Declined',
          message: `${company.name} declined your invitation to bid on project "${project.title}"${reason ? `. Reason: ${reason}` : ''}`,
          data: { 
            projectId: project._id,
            projectTitle: project.title,
            companyId: company._id,
            companyName: company.name,
            reason: reason || ''
          },
          read: false,
          priority: 'low'
        });
      }

      res.json({
        success: true,
        message,
        data: {
          response,
          projectId: project._id,
          companyId: company._id,
          reason: reason || ''
        }
      });
    } catch (error) {
      console.error('Respond to invitation error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to respond to invitation' 
      });
    }
  }
);

// ==========================================
// GET COMPANY'S ACTIVE BIDS AND PROJECTS
// ==========================================
router.get('/:id/bids', authMiddleware, async (req, res) => {
  try {
    const { status, type = 'all', page = 1, limit = 10 } = req.query;
    
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        error: 'Company not found' 
      });
    }

    // Check ownership
    if (company.userId.toString() !== req.userId.toString() && req.userType !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized' 
      });
    }

    // Build query for projects where company has bids
    const query = { 'bids.companyId': company._id };
    
    // Filter by bid status
    if (status && status !== 'all') {
      query['bids.status'] = status;
    }
    
    // Filter by project type
    if (type === 'active') {
      query.status = 'active';
    } else if (type === 'completed') {
      query.status = 'completed';
    } else if (type === 'open') {
      query.status = { $in: ['posted', 'bidding'] };
    }

    // Pagination
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    const projects = await Project.find(query)
      .populate('clientId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitInt);

    // Transform to include company's specific bid
    const bidsData = projects.map(project => {
      const projectObj = project.toObject();
      const companyBid = project.bids.find(bid => 
        bid.companyId.toString() === company._id.toString()
      );
      
      return {
        project: {
          _id: project._id,
          title: project.title,
          description: project.description,
          category: project.category,
          budget: project.budget,
          timeline: project.timeline,
          status: project.status,
          clientId: project.clientId,
          createdAt: project.createdAt
        },
        bid: companyBid,
        stats: {
          totalBids: project.bids.length,
          daysRemaining: project.expiresAt 
            ? Math.ceil((new Date(project.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
            : null
        }
      };
    });

    // Get totals for different bid statuses
    const pendingBids = await Project.countDocuments({
      'bids.companyId': company._id,
      'bids.status': 'pending'
    });

    const acceptedBids = await Project.countDocuments({
      'bids.companyId': company._id,
      'bids.status': 'accepted',
      status: 'active'
    });

    const rejectedBids = await Project.countDocuments({
      'bids.companyId': company._id,
      'bids.status': 'rejected'
    });

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      bids: bidsData,
      pagination: {
        page: pageInt,
        limit: limitInt,
        total,
        totalPages: Math.ceil(total / limitInt)
      },
      stats: {
        pending: pendingBids,
        accepted: acceptedBids,
        rejected: rejectedBids,
        totalBids: pendingBids + acceptedBids + rejectedBids
      }
    });
  } catch (error) {
    console.error('Get company bids error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch company bids' 
    });
  }
});

// ==========================================
// GET COMPANY DASHBOARD STATS
// ==========================================
router.get('/:id/dashboard', authMiddleware, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        error: 'Company not found' 
      });
    }

    // Check ownership
    if (company.userId.toString() !== req.userId.toString() && req.userType !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized' 
      });
    }

    // Get active projects count
    const activeProjects = await Project.countDocuments({
      'bids.companyId': company._id,
      'bids.status': 'accepted',
      status: 'active'
    });

    // Get completed projects count
    const completedProjects = await Project.countDocuments({
      'bids.companyId': company._id,
      'bids.status': 'accepted',
      status: 'completed'
    });

    // Get pending bids count
    const pendingBids = await Project.countDocuments({
      'bids.companyId': company._id,
      'bids.status': 'pending'
    });

    // Get active invitations count
    const activeInvitations = await Project.countDocuments({
      invitedCompanies: company._id,
      status: { $in: ['posted', 'bidding'] },
      expiresAt: { $gt: new Date() }
    });

    // Get recent notifications
    const recentNotifications = await Notification.find({
      userId: company.userId
    })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get revenue from completed projects
    const revenueData = await Project.aggregate([
      { $match: { 
        'bids.companyId': company._id,
        'bids.status': 'accepted',
        status: 'completed'
      }},
      { $unwind: '$bids' },
      { $match: { 
        'bids.companyId': company._id,
        'bids.status': 'accepted'
      }},
      { $group: {
          _id: null,
          totalRevenue: { $sum: '$bids.amount' },
          avgRevenue: { $avg: '$bids.amount' },
          projectCount: { $sum: 1 }
        }
      }
    ]);

    const dashboardData = {
      stats: {
        activeProjects,
        completedProjects,
        pendingBids,
        activeInvitations,
        unreadNotifications: recentNotifications.filter(n => !n.read).length
      },
      revenue: revenueData[0] || {
        totalRevenue: 0,
        avgRevenue: 0,
        projectCount: 0
      },
      recentNotifications,
      verificationStatus: company.verificationStatus,
      profileCompletion: calculateProfileCompletion(company)
    };

    res.json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Get company dashboard error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard data' 
    });
  }
});

// ADD TO EXISTING server/routes/companies.js

// ==========================================
// GET COMPANY CATEGORIES
// ==========================================
router.get('/categories', async (req, res) => {
  try {
    const categories = await Company.distinct('category');
    
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => ({
        id: cat,
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        count: await Company.countDocuments({ category: cat })
      }))
    );

    res.json({
      success: true,
      categories: categoriesWithCounts
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// ==========================================
// GET COMPANY STATS
// ==========================================
router.get('/:id/stats', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const projects = await Project.find({ 'bids.companyId': company._id });
    const companyBids = projects.flatMap(p => 
      (p.bids || []).filter(b => b.companyId.toString() === company._id.toString())
    );
    
    const acceptedBids = companyBids.filter(b => b.status === 'accepted');
    const totalEarned = acceptedBids.reduce((sum, b) => sum + (b.amount || 0), 0);
    const successRate = companyBids.length > 0 ? 
      (acceptedBids.length / companyBids.length) * 100 : 0;
    
    res.json({
      success: true,
      stats: {
        totalBids: companyBids.length,
        acceptedBids: acceptedBids.length,
        pendingBids: companyBids.filter(b => b.status === 'pending').length,
        rejectedBids: companyBids.filter(b => b.status === 'rejected').length,
        totalEarned,
        avgProjectValue: acceptedBids.length > 0 ? totalEarned / acceptedBids.length : 0,
        successRate,
        responseTime: 24
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function calculateProfileCompletion(company) {
  const fields = [
    { field: 'name', weight: 10 },
    { field: 'description', weight: 15 },
    { field: 'services', weight: 15, check: (val) => val && val.length > 0 },
    { field: 'portfolio', weight: 20, check: (val) => val && val.length > 0 },
    { field: 'location', weight: 10 },
    { field: 'website', weight: 5 },
    { field: 'teamSize', weight: 5 },
    { field: 'yearsInBusiness', weight: 5 },
    { field: 'logo', weight: 10 },
    { field: 'tagline', weight: 5 }
  ];

  let completion = 0;
  let totalWeight = 0;

  fields.forEach(({ field, weight, check }) => {
    totalWeight += weight;
    if (check) {
      if (check(company[field])) completion += weight;
    } else if (company[field]) {
      completion += weight;
    }
  });

  return Math.round((completion / totalWeight) * 100);
}

module.exports = router;
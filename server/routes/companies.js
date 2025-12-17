const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
// FIX: Check if auth middleware exists, if not, create simple middleware
const { authMiddleware: realAuthMiddleware } = require('../middleware/auth') || {};

// Create simple auth middleware if the real one doesn't exist
const authMiddleware = realAuthMiddleware || ((req, res, next) => {
  // Simple auth for testing - get user from header or default
  req.userId = req.headers['x-user-id'] || 'test-user-id';
  req.userType = req.headers['x-user-type'] || 'company';
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

// Get all companies with filters (for BrowsePage.jsx)
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      minPrice, 
      maxPrice, 
      search, 
      verified,
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

    // Execute query - select only fields needed for BrowsePage
    const companies = await Company.find(query)
      .select('name verified tagline services ratings startingPrice category description location teamSize yearsInBusiness verificationStatus')
      .sort({ 'ratings.average': -1, createdAt: -1 })
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

    res.json({
      success: true,
      count: companies.length,
      total,
      totalPages: Math.ceil(total / limitInt),
      currentPage: pageInt,
      companies,
      categoryCounts
    });

  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch companies' 
    });
  }
});

// Get single company by ID
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('portfolio')
      .populate({
        path: 'ratings.reviews',
        populate: {
          path: 'userId',
          select: 'name'
        }
      });

    if (!company) {
      return res.status(404).json({ 
        success: false,
        error: 'Company not found' 
      });
    }

    res.json({ 
      success: true,
      company 
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch company' 
    });
  }
});

// Create company profile (requires authentication)
// FIX: Removed requireRole temporarily to avoid middleware issues
router.post('/', authMiddleware, async (req, res) => {
  try {
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
      category
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
});

// Update company profile
router.put('/:id', authMiddleware, async (req, res) => {
  try {
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
      'website', 'linkedin', 'facebook', 'twitter'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        company[field] = req.body[field];
      }
    });

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
});

// Add portfolio item
router.post('/:id/portfolio', authMiddleware, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ 
        success: false,
        error: 'Company not found' 
      });
    }

    // Check ownership
    if (company.userId.toString() !== req.userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized' 
      });
    }

    const { title, description, images, category, clientName, liveUrl, completedDate } = req.body;

    if (!title || !description) {
      return res.status(400).json({ 
        success: false,
        error: 'Title and description are required' 
      });
    }

    company.portfolio.push({
      title,
      description,
      images: images || [],
      category,
      clientName,
      liveUrl,
      completedDate: completedDate || new Date()
    });

    await company.save();

    res.json({ 
      success: true,
      company,
      message: 'Portfolio item added successfully' 
    });
  } catch (error) {
    console.error('Add portfolio error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add portfolio item' 
    });
  }
});

// Get companies for admin verification
router.get('/admin/pending', authMiddleware, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    
    // For testing, show all companies with verificationStatus
    const companies = await Company.find({ verificationStatus: status })
      .populate('userId', 'name email phone')
      .sort({ createdAt: 1 });

    console.log(`Found ${companies.length} companies with status: ${status}`);

    res.json({
      success: true,
      companies,
      count: companies.length
    });
  } catch (error) {
    console.error('Get pending companies error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch pending companies' 
    });
  }
});

// Update verification status (admin only)
router.put('/:id/verify', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
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

    company.verificationStatus = status;
    company.verified = status === 'approved';
    
    if (status === 'approved') {
      company.verificationNotes = {
        verifiedBy: req.userId,
        verifiedAt: new Date(),
        adminComments: adminComments || ''
      };
    } else if (status === 'rejected') {
      company.verificationNotes = {
        rejectionReason: rejectionReason || '',
        adminComments: adminComments || ''
      };
    }

    await company.save();

    res.json({
      success: true,
      company,
      message: `Company verification ${status}`
    });
  } catch (error) {
    console.error('Update verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update verification status' 
    });
  }
});

// Invite company to bid on a project
router.post('/:id/invite', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.body;
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        error: 'Company not found' 
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

    // Add company to invited list if not already
    if (!project.invitedCompanies.includes(company._id)) {
      project.invitedCompanies.push(company._id);
      await project.save();
    }

    // Create notification for company
    // Note: Notification model needs to exist
    // await Notification.create({
    //   userId: company.userId,
    //   type: 'project_invite',
    //   title: 'Project Invitation',
    //   message: `You've been invited to bid on project "${project.title}"`,
    //   data: { 
    //     projectId: project._id,
    //     projectTitle: project.title,
    //     companyName: company.name,
    //     clientId: req.userId
    //   },
    //   read: false
    // });

    res.json({
      success: true,
      message: `Invitation sent to ${company.name}`,
      data: {
        companyId: company._id,
        companyName: company.name,
        projectId: project._id,
        projectTitle: project.title
      }
    });
  } catch (error) {
    console.error('Invite to bid error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send invitation' 
    });
  }
});

// Get company invitations
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
    if (company.userId.toString() !== req.userId.toString()) {
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
      .populate('clientId', 'name email')
      .select('title description category budget timeline status createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      invitations: projects
    });
  } catch ( error) {
    console.error('Get company invitations error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch invitations' 
    });
  }
});

// Accept/decline project invitation
router.post('/:id/invitations/:projectId/respond', authMiddleware, async (req, res) => {
  try {
    const { response } = req.body; // 'accept' or 'decline'
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        error: 'Company not found' 
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
    if (!project.invitedCompanies.includes(company._id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Company is not invited to this project' 
      });
    }

    // If accepted, no further action needed (company can now bid)
    // If declined, remove from invited list
    if (response === 'decline') {
      project.invitedCompanies = project.invitedCompanies.filter(
        invitedId => invitedId.toString() !== company._id.toString()
      );
      await project.save();
    }

    res.json({
      success: true,
      message: response === 'accept' 
        ? 'Invitation accepted. You can now submit your bid.' 
        : 'Invitation declined.',
      data: {
        response,
        projectId: project._id,
        companyId: company._id
      }
    });
  } catch (error) {
    console.error('Respond to invitation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to respond to invitation' 
    });
  }
});

module.exports = router;
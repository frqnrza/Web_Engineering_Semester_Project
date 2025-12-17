const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authMiddleware, requireAdmin, requireCompany } = require('../middleware/auth');

// ==========================================
// COMPANY SUBMITS VERIFICATION REQUEST
// ==========================================
router.post('/submit', authMiddleware, requireCompany, async (req, res) => {
  try {
    const company = await Company.findOne({ userId: req.userId });
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        error: 'Company profile not found. Please create your profile first.' 
      });
    }
    
    // Check if already verified
    if (company.verified) {
      return res.status(400).json({ 
        success: false,
        error: 'Company is already verified' 
      });
    }
    
    const { documents } = req.body;
    
    // Validate required documents
    const requiredDocs = [
      'secp_certificate',
      'ntn_certificate',
      'owner_cnic_front',
      'owner_cnic_back'
    ];
    
    const missingDocs = requiredDocs.filter(doc => !documents[doc] || !documents[doc].url);
    
    if (missingDocs.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required documents',
        missingDocs 
      });
    }
    
    // Update verification documents
    company.verificationDocuments = {
      ...company.verificationDocuments,
      ...documents
    };
    
    // Update verification status
    company.verificationStatus = 'under_review';
    
    await company.save();

    // Notify all admins
    const admins = await User.find({ type: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        type: 'verification_update',
        title: 'New Verification Request',
        message: `${company.name} has submitted verification documents`,
        data: { 
          companyId: company._id,
          companyName: company.name,
          userId: company.userId 
        },
        relatedTo: {
          companyId: company._id
        },
        metadata: {
          actionUrl: `/admin/verification/${company._id}`,
          icon: 'file-check'
        },
        priority: 'high',
        read: false
      });
    }

    res.json({
      success: true,
      company,
      message: 'Verification documents submitted. Under admin review.'
    });
  } catch (error) {
    console.error('Submit verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit verification request' 
    });
  }
});

// ==========================================
// GET COMPANY VERIFICATION STATUS
// ==========================================
router.get('/status', authMiddleware, requireCompany, async (req, res) => {
  try {
    const company = await Company.findOne({ userId: req.userId })
      .select('verificationStatus verificationDocuments verificationNotes verified');
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        error: 'Company profile not found' 
      });
    }
    
    res.json({ 
      success: true,
      company 
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch verification status' 
    });
  }
});

// ==========================================
// ADMIN: GET ALL PENDING VERIFICATIONS
// ==========================================
router.get('/pending', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { status = 'under_review' } = req.query;
    
    const companies = await Company.find({ verificationStatus: status })
      .populate('userId', 'name email phone createdAt')
      .sort({ updatedAt: -1 });
    
    res.json({ 
      success: true,
      companies, 
      count: companies.length 
    });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch pending verifications' 
    });
  }
});

// ==========================================
// ADMIN: GET VERIFICATION DETAILS
// ==========================================
router.get('/:companyId', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId)
      .populate('userId', 'name email phone createdAt emailVerified');
    
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
    console.error('Get verification details error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch verification details' 
    });
  }
});

// ==========================================
// ADMIN: APPROVE VERIFICATION
// ==========================================
router.post('/:companyId/approve', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { adminComments } = req.body;
    const company = await Company.findById(req.params.companyId)
      .populate('userId', 'email name');
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        error: 'Company not found' 
      });
    }

    // Update company verification
    company.verified = true;
    company.verificationStatus = 'approved';
    company.verificationNotes = {
      adminComments: adminComments || 'All documents verified and approved',
      verifiedBy: req.userId,
      verifiedAt: new Date()
    };
    
    await company.save();
    
    // Update user verification status
    await User.findByIdAndUpdate(company.userId, { verified: true });

    // Notify company
    await Notification.create({
      userId: company.userId,
      type: 'verification_approved',
      title: 'Verification Approved',
      message: `Congratulations! Your company "${company.name}" has been verified successfully.`,
      data: { 
        companyId: company._id,
        companyName: company.name,
        adminComments: adminComments || 'All documents verified and approved'
      },
      relatedTo: {
        companyId: company._id
      },
      metadata: {
        actionUrl: '/dashboard',
        icon: 'check-circle'
      },
      priority: 'high',
      read: false
    });

    res.json({
      success: true,
      company,
      message: 'Company verification approved'
    });
  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to approve verification' 
    });
  }
});

// ==========================================
// ADMIN: REJECT VERIFICATION
// ==========================================
router.post('/:companyId/reject', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { rejectionReason, adminComments } = req.body;
    const company = await Company.findById(req.params.companyId)
      .populate('userId', 'email name');
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        error: 'Company not found' 
      });
    }
    
    if (!rejectionReason) {
      return res.status(400).json({ 
        success: false,
        error: 'Rejection reason is required' 
      });
    }

    // Update company verification
    company.verified = false;
    company.verificationStatus = 'rejected';
    company.verificationNotes = {
      rejectionReason,
      adminComments: adminComments || '',
      verifiedBy: req.userId,
      verifiedAt: new Date()
    };
    
    await company.save();

    // Notify company
    await Notification.create({
      userId: company.userId,
      type: 'verification_rejected',
      title: 'Verification Rejected',
      message: `Your company verification for "${company.name}" was rejected: ${rejectionReason}`,
      data: { 
        companyId: company._id,
        companyName: company.name,
        rejectionReason,
        adminComments: adminComments || ''
      },
      relatedTo: {
        companyId: company._id
      },
      metadata: {
        actionUrl: '/dashboard/verification',
        icon: 'x-circle'
      },
      priority: 'urgent',
      read: false
    });

    res.json({
      success: true,
      company,
      message: 'Company verification rejected'
    });
  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to reject verification' 
    });
  }
});

// ==========================================
// ADMIN: REQUEST MORE DOCUMENTS
// ==========================================
router.post('/:companyId/request-documents', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId)
      .populate('userId', 'email name');
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        error: 'Company not found' 
      });
    }
    
    const { requestedDocuments, message } = req.body;
    
    if (!requestedDocuments || requestedDocuments.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Please specify which documents are needed' 
      });
    }
    
    // Update verification notes
    company.verificationNotes = {
      ...company.verificationNotes,
      adminComments: message || 'Additional documents requested',
      requestedDocuments,
      verifiedBy: req.userId
    };
    
    company.verificationStatus = 'pending';
    
    await company.save();

    // Notify company
    await Notification.create({
      userId: company.userId,
      type: 'verification_update',
      title: 'Additional Documents Required',
      message: `Additional documents are required for your company verification: ${requestedDocuments.join(', ')}`,
      data: { 
        companyId: company._id,
        companyName: company.name,
        requestedDocuments,
        message: message || 'Additional documents requested'
      },
      relatedTo: {
        companyId: company._id
      },
      metadata: {
        actionUrl: '/dashboard/verification',
        icon: 'file-upload'
      },
      priority: 'high',
      read: false
    });

    res.json({
      success: true,
      message: 'Document request sent to company',
      company
    });
  } catch (error) {
    console.error('Request documents error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to request documents' 
    });
  }
});

// ==========================================
// ADMIN: VERIFY INDIVIDUAL DOCUMENT
// ==========================================
router.put('/:companyId/documents/:docType/verify', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { companyId, docType } = req.params;
    const { verified } = req.body;
    
    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        error: 'Company not found' 
      });
    }
    
    // Update specific document verification
    if (company.verificationDocuments[docType]) {
      company.verificationDocuments[docType].verified = verified;
      await company.save();
      
      res.json({
        success: true,
        message: `Document ${verified ? 'verified' : 'marked as unverified'}`,
        company
      });
    } else {
      res.status(404).json({ 
        success: false,
        error: 'Document not found' 
      });
    }
  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to verify document' 
    });
  }
});

// ==========================================
// GET VERIFICATION STATISTICS (ADMIN)
// ==========================================
router.get('/stats/overview', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const stats = await Company.aggregate([
      {
        $group: {
          _id: '$verificationStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalCompanies = await Company.countDocuments();
    const verifiedCompanies = await Company.countDocuments({ verified: true });
    
    const formattedStats = {
      total: totalCompanies,
      verified: verifiedCompanies,
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0
    };
    
    stats.forEach(stat => {
      if (stat._id) {
        formattedStats[stat._id] = stat.count;
      }
    });

    // Get recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentActivity = await Company.aggregate([
      {
        $match: {
          updatedAt: { $gte: weekAgo }
        }
      },
      {
        $group: {
          _id: '$verificationStatus',
          count: { $sum: 1 },
          latest: { $max: '$updatedAt' }
        }
      }
    ]);

    res.json({ 
      success: true,
      stats: formattedStats,
      recentActivity 
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch statistics' 
    });
  }
});

// ==========================================
// GET VERIFICATION TIMELINE
// ==========================================
router.get('/:companyId/timeline', authMiddleware, async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId)
      .select('verificationStatus verificationNotes createdAt updatedAt');
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        error: 'Company not found' 
      });
    }
    
    const timeline = [
      {
        event: 'Profile Created',
        date: company.createdAt,
        status: 'completed',
        description: 'Company profile was created'
      }
    ];
    
    if (company.verificationNotes?.verifiedAt) {
      timeline.push({
        event: company.verified ? 'Verification Approved' : 'Verification Rejected',
        date: company.verificationNotes.verifiedAt,
        status: company.verified ? 'completed' : 'rejected',
        description: company.verificationNotes.adminComments || 
                    (company.verified ? 'All documents verified successfully' : 'Verification rejected')
      });
    }
    
    if (company.verificationStatus === 'under_review') {
      timeline.push({
        event: 'Under Review',
        date: company.updatedAt,
        status: 'in_progress',
        description: 'Documents submitted and under admin review'
      });
    }
    
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({
      success: true,
      timeline
    });
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch verification timeline' 
    });
  }
});

// ==========================================
// GET ALL VERIFICATION REQUESTS WITH FILTERS
// ==========================================
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { 
      status, 
      search, 
      dateFrom, 
      dateTo,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    // Build query
    const query = {};
    
    // Status filter
    if (status) {
      if (Array.isArray(status)) {
        query.verificationStatus = { $in: status };
      } else {
        query.verificationStatus = status;
      }
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.updatedAt = {};
      if (dateFrom) query.updatedAt.$gte = new Date(dateFrom);
      if (dateTo) query.updatedAt.$lte = new Date(dateTo);
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tagline: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const companies = await Company.find(query)
      .populate('userId', 'name email phone')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Company.countDocuments(query);
    
    res.json({
      success: true,
      companies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get verifications error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch verification requests' 
    });
  }
});

module.exports = router;
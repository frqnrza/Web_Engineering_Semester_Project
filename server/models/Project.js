const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 3000
  },
  category: {
    type: String,
    required: true,
    enum: ['web', 'mobile', 'marketing', 'design', 'other']
  },
  budget: {
    min: Number,
    max: Number,
    range: String  // e.g., "100-250", "500+"
  },
  timeline: {
    value: String,  // e.g., "1-3", "3-6"
    unit: {
      type: String,
      enum: ['weeks', 'months'],
      default: 'months'
    }
  },
  deadline: Date,
  
  // ✅ UPDATED: Enhanced attachments with Cloudinary support
  attachments: [{
    url: String,
    publicId: String,
    originalName: String,
    fileType: String,  // 'document', 'image', etc.
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ✅ ADDED: Client contact info
  clientInfo: {
    name: String,
    email: String,
    phone: String
  },
  
  // ✅ ADDED: Tech stack preferences
  techStack: [String],
  
  // ✅ ADDED: Payment preference
  paymentMethod: {
    type: String,
    enum: ['jazzcash', 'easypaisa', 'bank'],
    default: 'jazzcash'
  },
  
  // ✅ ADDED: Privacy settings
  isInviteOnly: {
    type: Boolean,
    default: false
  },
  invitedCompanies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }],
  
  status: {
    type: String,
    enum: ['draft', 'posted', 'bidding', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  
  bids: [{
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    amount: Number,
    timeline: String,
    proposal: String,
    
    // ✅ ADDED: Bid attachments (proposals, documents)
    attachments: [{
      url: String,
      publicId: String,
      originalName: String
    }],
    
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ✅ ADDED: Selected bid tracking
  selectedBid: {
    type: mongoose.Schema.Types.ObjectId
  },
  
  // ✅ ADDED: Project milestones
  milestones: [{
    title: String,
    description: String,
    amount: Number,
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'paid'],
      default: 'pending'
    }
  }],
  
  // ✅ ADDED: View count
  viewCount: {
    type: Number,
    default: 0
  },
  
  // ✅ ADDED: Expiry date (30 days from posting)
  expiresAt: Date
}, {
  timestamps: true  // ✅ CHANGED: Use Mongoose timestamps
});

// ✅ ADDED: Index for search
projectSchema.index({ title: 'text', description: 'text' });
projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ category: 1, status: 1 });
projectSchema.index({ clientId: 1, status: 1 });

// ✅ ADDED: Auto-set expiry date before saving
projectSchema.pre('save', function(next) {
  if (this.isNew && this.status === 'posted' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  //next();
});

module.exports = mongoose.model('Project', projectSchema);
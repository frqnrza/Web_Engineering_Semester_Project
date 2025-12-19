const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  timeline: String,
  proposal: {
    type: String,
    required: true,
    minlength: 50
  },
  attachments: [{
    url: String,
    publicId: String,
    originalName: String
  }],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  milestones: [{
    title: String,
    amount: Number,
    dueDate: Date,
    description: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

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
  
  // ✅ UPDATED: Enhanced bids array with separate schema
  bids: [bidSchema],
  
  // ✅ UPDATED: Selected bid tracking with reference to bid
  selectedBid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'bidSchema'
  },
  
  // ✅ UPDATED: Selected company tracking
  selectedCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
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
  expiresAt: Date,
  
  // ✅ ADDED: Auto-expire old projects
  autoExpireAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true  // ✅ CHANGED: Use Mongoose timestamps
});

// ✅ UPDATED: Index for better query performance
projectSchema.index({ title: 'text', description: 'text' });
projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ category: 1, status: 1 });
projectSchema.index({ clientId: 1, status: 1 });
projectSchema.index({ 'bids.companyId': 1, 'bids.status': 1 });
projectSchema.index({ invitedCompanies: 1, status: 1 });
projectSchema.index({ expiresAt: 1 });

// ✅ ADDED: Auto-set expiry date before saving
projectSchema.pre('save', function(next) {
  if (this.isNew && this.status === 'posted' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  next();
});

// ✅ ADDED: Method to check if company is invited
projectSchema.methods.isCompanyInvited = function(companyId) {
  if (!this.isInviteOnly) return true;
  return this.invitedCompanies.some(id => id.toString() === companyId.toString());
};

// ✅ ADDED: Method to add a bid
projectSchema.methods.addBid = function(bidData) {
  const bid = {
    ...bidData,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  this.bids.push(bid);
  
  // Update project status to bidding if first bid
  if (this.bids.length === 1 && this.status === 'posted') {
    this.status = 'bidding';
  }
  
  return this.bids[this.bids.length - 1]; // Return the new bid
};

// ✅ ADDED: Method to accept a bid
projectSchema.methods.acceptBid = function(bidId) {
  const bidIndex = this.bids.findIndex(b => b._id.toString() === bidId.toString());
  if (bidIndex === -1) throw new Error('Bid not found');
  
  // Update all bids status
  this.bids.forEach(bid => {
    if (bid._id.toString() === bidId.toString()) {
      bid.status = 'accepted';
    } else {
      bid.status = 'rejected';
    }
  });
  
  this.selectedBid = bidId;
  this.selectedCompany = this.bids[bidIndex].companyId;
  this.status = 'active';
  
  return this.bids[bidIndex];
};

// ✅ ADDED: Method to reject a bid
projectSchema.methods.rejectBid = function(bidId) {
  const bidIndex = this.bids.findIndex(b => b._id.toString() === bidId.toString());
  if (bidIndex === -1) throw new Error('Bid not found');
  
  this.bids[bidIndex].status = 'rejected';
  this.bids[bidIndex].updatedAt = new Date();
  
  return this.bids[bidIndex];
};

// ✅ ADDED: Method to withdraw a bid
projectSchema.methods.withdrawBid = function(bidId, companyId) {
  const bidIndex = this.bids.findIndex(b => 
    b._id.toString() === bidId.toString() && 
    b.companyId.toString() === companyId.toString()
  );
  if (bidIndex === -1) throw new Error('Bid not found or unauthorized');
  
  this.bids[bidIndex].status = 'withdrawn';
  this.bids[bidIndex].updatedAt = new Date();
  
  return this.bids[bidIndex];
};

// ✅ ADDED: Method to get company's bid
projectSchema.methods.getCompanyBid = function(companyId) {
  return this.bids.find(b => b.companyId.toString() === companyId.toString());
};

module.exports = mongoose.model('Project', projectSchema);
const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: Date,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'paid'],
    default: 'pending'
  },
  completionProof: [{
    url: String,
    publicId: String,
    originalName: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  clientApproval: {
    approved: Boolean,
    approvedAt: Date,
    comments: String
  }
});

const bidAttachmentSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  publicId: String,
  originalName: String,
  fileType: {
    type: String,
    enum: ['document', 'image', 'presentation', 'other'],
    default: 'document'
  },
  size: Number,
  description: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const bidSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Financial Details
  amount: {
    type: Number,
    required: true,
    min: 0,
    set: v => Math.round(v * 100) / 100 // Store with 2 decimal places
  },
  currency: {
    type: String,
    default: 'PKR',
    enum: ['PKR', 'USD', 'EUR', 'GBP']
  },
  taxPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  totalAmount: {
    type: Number,
    min: 0,
    set: v => Math.round(v * 100) / 100
  },
  
  // Timeline
  proposedTimeline: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months'],
      default: 'days'
    },
    startDate: Date,
    endDate: Date
  },
  
  // Proposal Details
  proposal: {
    type: String,
    required: true,
    minlength: 100,
    maxlength: 5000
  },
  executiveSummary: String,
  methodology: String,
  deliverables: [String],
  teamStructure: [{
    role: String,
    name: String,
    experience: String,
    hoursAllocated: Number
  }],
  
  // Technical Details
  techStack: [String],
  assumptions: [String],
  risks: [{
    description: String,
    mitigation: String,
    probability: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    impact: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  }],
  
  // Milestones & Payments
  milestones: [milestoneSchema],
  paymentSchedule: {
    type: {
      type: String,
      enum: ['milestone', 'weekly', 'monthly', 'lump_sum', 'custom'],
      default: 'milestone'
    },
    details: String
  },
  escrowRequired: {
    type: Boolean,
    default: true
  },
  
  // Attachments
  attachments: [bidAttachmentSchema],
  supportingDocuments: [{
    type: String,
    enum: ['portfolio', 'references', 'certifications', 'legal', 'other']
  }],
  
  // Status & Communication
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'accepted', 'rejected', 'withdrawn', 'expired'],
    default: 'draft',
    index: true
  },
  statusHistory: [{
    status: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  
  // Client Interaction
  clientFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    submittedAt: Date
  },
  questions: [{
    question: String,
    askedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    askedAt: {
      type: Date,
      default: Date.now
    },
    answer: String,
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    answeredAt: Date
  }],
  
  // Negotiation
  negotiationHistory: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    proposedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'countered']
    },
    counterOffer: mongoose.Schema.Types.Mixed,
    finalAccepted: Boolean
  }],
  
  // Flags & Metadata
  isInvited: {
    type: Boolean,
    default: false
  },
  invitationSource: {
    type: String,
    enum: ['client_invite', 'platform_match', 'direct_apply', 'other'],
    default: 'direct_apply'
  },
  priorityLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Automated Fields
  viewedByClient: {
    type: Boolean,
    default: false
  },
  viewedAt: Date,
  shortlisted: {
    type: Boolean,
    default: false
  },
  shortlistedAt: Date,
  
  // Expiry & Auto-cleanup
  expiresAt: {
    type: Date,
    index: true
  },
  autoWithdrawAt: Date,
  
  // Analytics
  revisionCount: {
    type: Number,
    default: 0
  },
  lastRevisedAt: Date,
  
  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
bidSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

bidSchema.virtual('formattedTotalAmount').get(function() {
  const total = this.totalAmount || this.amount * (1 + this.taxPercentage / 100);
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: this.currency
  }).format(total);
});

bidSchema.virtual('daysToExpiry').get(function() {
  if (!this.expiresAt) return null;
  const diff = this.expiresAt - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

bidSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

bidSchema.virtual('timelineInDays').get(function() {
  if (!this.proposedTimeline) return null;
  const { value, unit } = this.proposedTimeline;
  switch (unit) {
    case 'days': return value;
    case 'weeks': return value * 7;
    case 'months': return value * 30;
    default: return value;
  }
});

// Indexes
bidSchema.index({ project: 1, company: 1 }, { unique: true });
bidSchema.index({ client: 1, status: 1 });
bidSchema.index({ company: 1, status: 1 });
bidSchema.index({ createdAt: -1 });
bidSchema.index({ amount: 1 });
bidSchema.index({ 'proposedTimeline.endDate': 1 });

// Middleware
bidSchema.pre('save', function(next) {
  // Calculate total amount if not set
  if (!this.totalAmount && this.amount && this.taxPercentage) {
    this.totalAmount = this.amount * (1 + this.taxPercentage / 100);
  }
  
  // Set expiry date for submitted bids (30 days)
  if (this.isModified('status') && this.status === 'submitted' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  
  // Auto-withdraw after 60 days if no action
  if (this.isModified('status') && this.status === 'submitted' && !this.autoWithdrawAt) {
    this.autoWithdrawAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  }
  
  // Track status history
  if (this.isModified('status')) {
    if (!this.statusHistory) this.statusHistory = [];
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date()
    });
  }
  
  // Update revision count
  if (this.isModified() && !this.isNew) {
    this.revisionCount += 1;
    this.lastRevisedAt = new Date();
  }
  
  next();
});

// Static Methods
bidSchema.statics.findByProject = function(projectId, options = {}) {
  const query = this.find({ project: projectId })
    .populate('company', 'name logo verified ratings services location')
    .populate('createdBy', 'name email avatar')
    .sort({ createdAt: -1 });
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  return query;
};

bidSchema.statics.findByCompany = function(companyId, options = {}) {
  const query = this.find({ company: companyId })
    .populate('project', 'title description category budget timeline status')
    .populate('client', 'name email avatar')
    .sort({ createdAt: -1 });
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  return query;
};

bidSchema.statics.findByClient = function(clientId, options = {}) {
  const query = this.find({ client: clientId })
    .populate('company', 'name logo verified ratings services location')
    .populate('project', 'title category budget timeline')
    .sort({ createdAt: -1 });
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  return query;
};

// Instance Methods
bidSchema.methods.markAsViewed = function(viewerId) {
  if (this.client.toString() === viewerId.toString()) {
    this.viewedByClient = true;
    this.viewedAt = new Date();
  }
  return this.save();
};

bidSchema.methods.toggleShortlist = function(shortlisted) {
  this.shortlisted = shortlisted !== undefined ? shortlisted : !this.shortlisted;
  this.shortlistedAt = this.shortlisted ? new Date() : null;
  return this.save();
};

bidSchema.methods.addQuestion = function(question, askedBy) {
  if (!this.questions) this.questions = [];
  this.questions.push({
    question,
    askedBy,
    askedAt: new Date()
  });
  return this.save();
};

bidSchema.methods.answerQuestion = function(questionIndex, answer, answeredBy) {
  if (this.questions && this.questions[questionIndex]) {
    this.questions[questionIndex].answer = answer;
    this.questions[questionIndex].answeredBy = answeredBy;
    this.questions[questionIndex].answeredAt = new Date();
  }
  return this.save();
};

bidSchema.methods.addNegotiation = function(field, newValue, proposedBy, notes = '') {
  if (!this.negotiationHistory) this.negotiationHistory = [];
  
  this.negotiationHistory.push({
    field,
    oldValue: this[field],
    newValue,
    proposedBy,
    proposedAt: new Date(),
    status: 'pending',
    notes
  });
  
  return this.save();
};

bidSchema.methods.acceptNegotiation = function(negotiationIndex) {
  if (this.negotiationHistory && this.negotiationHistory[negotiationIndex]) {
    const negotiation = this.negotiationHistory[negotiationIndex];
    negotiation.status = 'accepted';
    negotiation.finalAccepted = true;
    
    // Update the actual field value
    this[negotiation.field] = negotiation.newValue;
  }
  return this.save();
};

bidSchema.methods.updateStatus = function(newStatus, changedBy, notes = '') {
  const oldStatus = this.status;
  this.status = newStatus;
  
  this.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy,
    notes: `${notes} (Changed from ${oldStatus} to ${newStatus})`
  });
  
  return this.save();
};

bidSchema.methods.calculateScore = function() {
  let score = 100;
  
  // Company rating bonus
  if (this.company && this.company.ratings && this.company.ratings.average) {
    score += this.company.ratings.average * 10;
  }
  
  // Proposal length bonus (100-500 chars is ideal)
  const proposalLength = this.proposal.length;
  if (proposalLength >= 100 && proposalLength <= 500) {
    score += 20;
  } else if (proposalLength > 500 && proposalLength <= 1000) {
    score += 10;
  }
  
  // Milestones bonus
  if (this.milestones && this.milestones.length >= 3) {
    score += 15;
  }
  
  // Attachments bonus
  if (this.attachments && this.attachments.length > 0) {
    score += 10;
  }
  
  // Invited bid bonus
  if (this.isInvited) {
    score += 25;
  }
  
  return Math.min(score, 200); // Cap at 200
};

module.exports = mongoose.model('Bid', bidSchema);
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // User who receives the notification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Notification type
  type: {
    type: String,
    enum: [
      'new_bid',           // New bid on your project
      'bid_accepted',      // Your bid was accepted
      'bid_rejected',      // Your bid was rejected
      'project_invited',   // Invited to bid on a project (instead of project_invite for consistency)
      'message_received',  // New message received
      'verification_approved',  // Company verification approved
      'verification_rejected',  // Company verification rejected
      'payment_received',  // Payment received
      'milestone_approved', // Milestone approved
      'milestone_completed', // Milestone completed
      'project_completed',   // Project completed
      'system_announcement'  // System-wide announcement
    ],
    required: true
  },
  
  // Notification title
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // Notification message
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  
  // Additional data for the notification
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Related entity references
  relatedTo: {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    bidId: {
      type: mongoose.Schema.Types.ObjectId
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  
  // Read status
  read: {
    type: Boolean,
    default: false
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Expiry date for notifications
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  
  // Additional metadata
  metadata: {
    source: {
      type: String,
      enum: ['system', 'user', 'admin'],
      default: 'system'
    },
    actionUrl: String, // URL for user to take action
    icon: String, // Icon name or URL
    emailSent: {
      type: Boolean,
      default: false
    },
    pushSent: {
      type: Boolean,
      default: false
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ 'relatedTo.projectId': 1 });
notificationSchema.index({ 'relatedTo.companyId': 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to update updatedAt
notificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to create invitation notification
notificationSchema.statics.createInviteNotification = async function(userId, projectId, projectTitle, companyName) {
  return this.create({
    userId,
    type: 'project_invited',
    title: 'Project Invitation',
    message: `${companyName} has invited you to bid on their project "${projectTitle}"`,
    relatedTo: {
      projectId
    },
    priority: 'high',
    metadata: {
      source: 'user',
      actionUrl: `/projects/${projectId}`,
      icon: 'mail'
    }
  });
};

// Static method to create bid notification
notificationSchema.statics.createBidNotification = async function(userId, projectId, bidId, companyName, projectTitle) {
  return this.create({
    userId,
    type: 'new_bid',
    title: 'New Bid Received',
    message: `${companyName} submitted a bid on your project "${projectTitle}"`,
    relatedTo: {
      projectId,
      bidId
    },
    priority: 'high',
    metadata: {
      source: 'system',
      actionUrl: `/projects/${projectId}/bids`,
      icon: 'dollar-sign'
    }
  });
};

// Static method to create verification notification
notificationSchema.statics.createVerificationNotification = async function(userId, status, companyName, reason = '') {
  const statusMessages = {
    'verification_approved': `Your company "${companyName}" has been verified!`,
    'verification_rejected': `Your company "${companyName}" verification was rejected. ${reason}`
  };
  
  const statusTitles = {
    'verification_approved': 'Verification Approved',
    'verification_rejected': 'Verification Rejected'
  };
  
  return this.create({
    userId,
    type: status,
    title: statusTitles[status],
    message: statusMessages[status],
    relatedTo: {
      companyId: userId
    },
    priority: status === 'verification_approved' ? 'high' : 'urgent',
    metadata: {
      source: 'admin',
      actionUrl: '/dashboard/verification',
      icon: status === 'verification_approved' ? 'check-circle' : 'x-circle'
    }
  });
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  return this.save();
};

// Static method to mark multiple notifications as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { userId, read: false },
    { $set: { read: true, updatedAt: new Date() } }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ userId, read: false });
};

// Static method to cleanup old notifications
notificationSchema.statics.cleanupOldNotifications = async function(days = 90) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.deleteMany({ 
    read: true, 
    createdAt: { $lt: cutoffDate },
    priority: { $ne: 'urgent' } // Keep urgent notifications longer
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
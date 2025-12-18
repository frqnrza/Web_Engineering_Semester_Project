const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  tagline: {
    type: String,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  logo: {
    url: String,
    publicId: String
  },
  verified: {
    type: Boolean,
    default: false
  },
  
  // ✅ ADDED: Category field for BrowsePage.jsx filtering
  category: {
    type: String,
    enum: ['web', 'mobile', 'marketing', 'design', 'other'],
    default: 'web'
  },
  
  // ✅ ADDED: Starting price field for filtering
  startingPrice: {
    type: Number,
    default: 100000
  },
  
  verificationStatus: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  
  verificationDocuments: {
    secp_certificate: {
      url: String,
      publicId: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false }
    },
    ntn_certificate: {
      url: String,
      publicId: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false }
    },
    incorporation_certificate: {
      url: String,
      publicId: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false }
    },
    owner_cnic_front: {
      url: String,
      publicId: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false }
    },
    owner_cnic_back: {
      url: String,
      publicId: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false }
    },
    owner_photo: {
      url: String,
      publicId: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false }
    },
    office_photos: [{
      url: String,
      publicId: String,
      uploadedAt: Date
    }],
    utility_bill: {
      url: String,
      publicId: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false }
    }
  },
  
  verificationNotes: {
    adminComments: String,
    rejectionReason: String,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date
  },
  
  services: [{
    type: String
  }],
  
  // ✅ UPDATED: Changed rating to ratings object with average and count
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    reviews: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    }]
  },
  
  teamSize: {
    type: String, // Changed from Number to String (e.g., "50+", "10-20")
    default: "1-10"
  },
  location: {
    type: String,
    trim: true
  },
  yearsInBusiness: {
    type: Number,
    min: 0
  },
  
  // ✅ ADDED: For BrowsePage.jsx compatibility
  reviewCount: {
    type: Number,
    default: 0
  },
  
  portfolio: [{
    title: String,
    description: String,
    images: [{
      url: String,
      publicId: String
    }],
    category: String,
    clientName: String,
    completedDate: Date,
    liveUrl: String
  }],
  
  // Social media links
  website: String,
  linkedin: String,
  facebook: String,
  twitter: String,
  
  // ✅ ADDED: For dashboard statistics
  completedProjects: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ ADDED: Text index for search
companySchema.index({ 
  name: 'text', 
  description: 'text', 
  tagline: 'text',
  services: 'text'
});

// ✅ ADDED: Indexes for better query performance
companySchema.index({ category: 1 });
companySchema.index({ verified: 1 });
companySchema.index({ startingPrice: 1 });
companySchema.index({ verificationStatus: 1 });

// ✅ ADDED: Virtual for rating (compatibility with old code)
companySchema.virtual('rating').get(function() {
  return this.ratings.average;
});

module.exports = mongoose.model('Company', companySchema);
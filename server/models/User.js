const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;
    },
    minlength: [6, 'Password must be at least 6 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['client', 'company', 'admin'],
    required: true,
    default: 'client'
  },
  verified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    trim: true
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  avatar: String,
  companyName: {
    type: String,
    trim: true
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  lockUntil: Date,
  refreshTokens: [{
    token: String,
    createdAt: Date,
    expiresAt: Date
  }],
  lastLogin: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true }, // Include virtuals when converting to JSON
  toObject: { virtuals: true } // Include virtuals when converting to object
});

// Hash password before saving
userSchema.pre('save', async function() {
  // Only run if password is modified
  if (!this.isModified('password')) {
    return;
  }
  
  // Skip if using OAuth without password
  if (this.googleId && !this.password) {
    return;
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return this.accountLocked && this.lockUntil && this.lockUntil > Date.now();
};

// Increment failed login attempts
userSchema.methods.incLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1, accountLocked: 1 }
    });
  }
  
  const updates = { $inc: { failedLoginAttempts: 1 } };
  
  if (this.failedLoginAttempts + 1 >= 5) {
    updates.$set = { 
      accountLocked: true, 
      lockUntil: Date.now() + 30 * 60 * 1000 
    };
  }
  
  return await this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  return await this.updateOne({
    $set: { failedLoginAttempts: 0, lastLogin: Date.now() },
    $unset: { lockUntil: 1, accountLocked: 1 }
  });
};

// ==========================================
// Step 7: Add Virtual Field and Company Methods
// ==========================================

// Virtual field to get company ID easily
userSchema.virtual('companyId').get(function() {
  // This will be populated when needed
  return this._companyId;
});

// Setter for company ID
userSchema.virtual('companyId').set(function(companyId) {
  this._companyId = companyId;
});

// Method to fetch company ID
userSchema.methods.getCompanyId = async function() {
  if (this.type !== 'company') return null;
  
  // If company ID is already set in virtual field, return it
  if (this._companyId) {
    return this._companyId;
  }
  
  const Company = mongoose.model('Company');
  const company = await Company.findOne({ userId: this._id });
  
  if (company) {
    // Cache the company ID in virtual field
    this._companyId = company._id;
    return company._id;
  }
  
  return null;
};

// Method to get full company profile
userSchema.methods.getCompanyProfile = async function() {
  if (this.type !== 'company') return null;
  
  const Company = mongoose.model('Company');
  const company = await Company.findOne({ userId: this._id });
  
  if (company) {
    // Cache the company ID
    this._companyId = company._id;
  }
  
  return company;
};

// Method to check if user has a company profile
userSchema.methods.hasCompanyProfile = async function() {
  if (this.type !== 'company') return false;
  
  const Company = mongoose.model('Company');
  const company = await Company.findOne({ userId: this._id });
  
  if (company) {
    this._companyId = company._id;
    return true;
  }
  
  return false;
};

// ==========================================
// Existing methods
// ==========================================

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshTokens;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  delete user.failedLoginAttempts;
  delete user.lockUntil;
  delete user._companyId; // Don't expose internal field
  return user;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

// Static method to find company users
userSchema.statics.findCompanies = function() {
  return this.find({ type: 'company' }).populate('companyProfile');
};

module.exports = mongoose.model('User', userSchema);
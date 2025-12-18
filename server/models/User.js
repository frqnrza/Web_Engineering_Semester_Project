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
      // Password not required if using Google Auth
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
  
  // Login Security
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
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date
  }],
  lastLogin: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ FIXED: Robust Password Hashing Hook
userSchema.pre('save', async function(next) {
  // Only run if password is modified
  if (!this.isModified('password')) {
    return next();
  }
  
  // Skip if password is empty (e.g. OAuth user update)
  if (!this.password) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
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

// ✅ FIXED: Modify Instance instead of DB directly (prevents overwrite race conditions)
userSchema.methods.incLoginAttempts = async function() {
  // If lock has expired, reset
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.failedLoginAttempts = 1;
    this.lockUntil = undefined;
    this.accountLocked = false;
  } else {
    // Otherwise increment
    this.failedLoginAttempts += 1;
    
    // Lock if max attempts reached
    if (this.failedLoginAttempts >= 5) {
      this.accountLocked = true;
      this.lockUntil = Date.now() + 30 * 60 * 1000; // 30 mins
    }
  }
  
  return await this.save();
};

// ✅ FIXED: Modify Instance directly
userSchema.methods.resetLoginAttempts = async function() {
  this.failedLoginAttempts = 0;
  this.accountLocked = false;
  this.lockUntil = undefined;
  this.lastLogin = Date.now();
  return await this.save();
};

// ==========================================
// Virtual Field and Company Methods
// ==========================================

// Virtual field to get company ID easily
userSchema.virtual('companyId').get(function() {
  return this._companyId;
});

userSchema.virtual('companyId').set(function(companyId) {
  this._companyId = companyId;
});

// Method to fetch company ID
userSchema.methods.getCompanyId = async function() {
  if (this.type !== 'company') return null;
  
  if (this._companyId) return this._companyId;
  
  const Company = mongoose.model('Company');
  const company = await Company.findOne({ userId: this._id });
  
  if (company) {
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
    this._companyId = company._id;
  }
  
  return company;
};

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
  delete user._companyId;
  delete user.__v;
  return user;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

module.exports = mongoose.model('User', userSchema);
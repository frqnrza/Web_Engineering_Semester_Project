// Save this as: server/scripts/createAdmin.js
// Run with: node server/scripts/createAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/techconnect');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create admin user
const createAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ type: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log('\nIf you need to reset the password, delete this admin from MongoDB first.');
      process.exit(0);
    }

    // Get admin details from environment or use defaults
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@techconnect.pk';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2025!';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    // Check if email is already used by a regular user
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      console.error(`❌ Email ${adminEmail} is already registered as a ${existingUser.type}`);
      console.log('Please use a different email or delete the existing user first.');
      process.exit(1);
    }

    // Create admin user
    const admin = new User({
      email: adminEmail,
      password: adminPassword, // Will be hashed by pre-save hook
      name: adminName,
      type: 'admin',
      emailVerified: true, // Auto-verify admin
      verified: true
    });

    await admin.save();

    console.log('\n✅ Admin account created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Please change the password after first login!');
    console.log('\n🔗 Login at: http://localhost:5173 (Click "Admin" button in header)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

// Main execution
const main = async () => {
  console.log('🚀 Creating Admin Account...\n');
  await connectDB();
  await createAdmin();
};

main();
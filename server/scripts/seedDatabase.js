const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const Project = require('../models/Project');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');

    // âœ… Fix existing company users without company profiles
    const companyUsers = await User.find({ type: 'company' });
    
    for (const user of companyUsers) {
      const existingCompany = await Company.findOne({ userId: user._id });
      
      if (!existingCompany) {
        console.log(`🔧 Creating missing company for user: ${user.email}`);
        
        const newCompany = new Company({
          userId: user._id,
          name: user.companyName || `${user.name}'s Company`,
          tagline: 'Professional tech services',
          description: 'We provide excellent tech services',
          services: ['Web Development', 'Mobile Development'],
          startingPrice: 100000,
          location: 'Pakistan',
          category: 'web',
          verified: false,
          verificationStatus: 'pending',
          ratings: { average: 0, count: 0, reviews: [] },
          teamSize: '1-10',
          yearsInBusiness: 1
        });
        
        await newCompany.save();
        console.log(`✅ Created company profile: ${newCompany._id}`);
      } else {
        console.log(`✓ Company already exists for: ${user.email}`);
      }
    }

    // âœ… Create sample projects if none exist
    const projectCount = await Project.countDocuments();
    
    if (projectCount === 0) {
      console.log('📦 Creating sample projects...');
      
      const clientUsers = await User.find({ type: 'client' }).limit(2);
      
      if (clientUsers.length > 0) {
        const sampleProjects = [
          {
            title: 'E-commerce Website Development',
            description: 'Need a modern e-commerce website with payment integration',
            category: 'web',
            budget: { min: 200000, max: 500000, currency: 'PKR' },
            timeline: { value: 3, unit: 'months' },
            clientId: clientUsers[0]._id,
            clientInfo: {
              name: clientUsers[0].name,
              email: clientUsers[0].email,
              phone: clientUsers[0].phone || '+92-XXX-XXXXXXX'
            },
            techStack: ['React', 'Node.js', 'MongoDB'],
            status: 'posted',
            isInviteOnly: false,
            bids: [],
            paymentMethod: 'jazzcash',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          {
            title: 'Mobile App for Food Delivery',
            description: 'iOS and Android app for restaurant food delivery service',
            category: 'mobile',
            budget: { min: 500000, max: 1000000, currency: 'PKR' },
            timeline: { value: 6, unit: 'months' },
            clientId: clientUsers[0]._id,
            clientInfo: {
              name: clientUsers[0].name,
              email: clientUsers[0].email,
              phone: clientUsers[0].phone || '+92-XXX-XXXXXXX'
            },
            techStack: ['React Native', 'Firebase'],
            status: 'posted',
            isInviteOnly: false,
            bids: [],
            paymentMethod: 'bank',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        ];
        
        await Project.insertMany(sampleProjects);
        console.log('✅ Created sample projects');
      }
    } else {
      console.log('✓ Projects already exist');
    }

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
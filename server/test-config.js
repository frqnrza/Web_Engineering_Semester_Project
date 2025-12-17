require('dotenv').config();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
console.log('🧪 Testing Configuration...\n');

// Test 1: Environment Variables
// console.log('1️⃣ Environment Variables:');
// console.log('   PORT:', process.env.PORT || '❌ Missing');
// console.log('   CLIENT_URL:', process.env.CLIENT_URL || '❌ Missing');
// console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
// console.log('   JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✅ Set' : '❌ Missing');
// console.log('   GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID || '❌ Missing');
// console.log('   EMAIL_USER:', process.env.EMAIL_USER || '❌ Missing');
// console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing');
console.log('   MONGO_URL:' + process.env.MONGODB_URI);
console.log('   NODE_ENV:', process.env.NODE_ENV || '❌ Missing');

// Test 2: MongoDB Connection
console.log('\n2️⃣ Testing MongoDB Connection...');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('   ✅ MongoDB Connected Successfully');
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error('   ❌ MongoDB Connection Failed:', err);
  });

// // Test 3: Email Service
// console.log('\n3️⃣ Testing Email Service...');
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASSWORD
//   }
// });

// transporter.verify((error, success) => {
//   if (error) {
//     console.error('   ❌ Email Service Failed:', error.message);
//   } else {
//     console.log('   ✅ Email Service Ready');
//   }
// });

console.log('\n✅ Configuration test complete!\n');
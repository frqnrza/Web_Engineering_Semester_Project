const nodemailer = require('nodemailer');

// Create transporter
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   secure: false, // Use TLS
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASSWORD
//   }
// });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD // Use App Password, not regular password
  }
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error);
  } else {
    console.log('✅ Email service ready');
  }
});

// Send verification email
const sendVerificationEmail = async (email, name, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify Your TechConnect Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0A2540; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f5f7f9; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #008C7E; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TechConnect Pakistan</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${name}!</h2>
            <p>Thank you for registering with TechConnect. Please verify your email address to get started.</p>
            <p>Click the button below to verify your account:</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <p>Or copy this link: <br><small>${verificationUrl}</small></p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} TechConnect Pakistan. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error);
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Reset Your TechConnect Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0A2540; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f5f7f9; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #FF8A2B; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TechConnect Pakistan</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy this link: <br><small>${resetUrl}</small></p>
            <p>This link will expire in 1 hour.</p>
            <p><strong>If you didn't request this, please ignore this email and your password will remain unchanged.</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} TechConnect Pakistan. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error);
    return false;
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, name, userType) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Welcome to TechConnect Pakistan!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0A2540; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f5f7f9; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #008C7E; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to TechConnect!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Your account has been successfully created!</p>
            ${userType === 'company' 
              ? '<p>As a service provider, you can now browse projects and submit bids. Make sure to complete your company profile to get verified.</p>' 
              : '<p>As a client, you can now post projects and receive bids from verified tech companies across Pakistan.</p>'
            }
            <a href="${process.env.CLIENT_URL}/dashboard" class="button">Go to Dashboard</a>
            <p>Need help? Contact us at support@techconnect.pk</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} TechConnect Pakistan. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
};
# TechConnect Production Integration Guide

This guide explains how to integrate real backend services, APIs, and deploy the TechConnect platform to production.

## 📋 Table of Contents

1. [Backend & Database Setup](#backend--database-setup)
2. [Authentication Integration](#authentication-integration)
3. [Payment Gateway Integration](#payment-gateway-integration)
4. [Translation API](#translation-api)
5. [AI Chatbot Integration](#ai-chatbot-integration)
6. [Real-time Messaging](#real-time-messaging)
7. [File Storage](#file-storage)
8. [SEO Optimization](#seo-optimization)
9. [Deployment](#deployment)
10. [Security Best Practices](#security-best-practices)

---

## 🗄️ Backend & Database Setup

### MongoDB Atlas Integration

**Current:** Mock localStorage-based database  
**Production:** MongoDB Atlas cloud database

#### Steps:

1. **Create MongoDB Atlas Account**
   ```bash
   # Visit: https://www.mongodb.com/cloud/atlas
   # Create a free cluster
   ```

2. **Install Dependencies**
   ```bash
   npm install mongodb mongoose
   ```

3. **Create Database Schema**
   ```javascript
   // /server/models/User.js
   const mongoose = require('mongoose');
   
   const userSchema = new mongoose.Schema({
     email: { type: String, required: true, unique: true },
     password: { type: String, required: true }, // hashed
     name: String,
     type: { type: String, enum: ['client', 'company'] },
     verified: { type: Boolean, default: false },
     createdAt: { type: Date, default: Date.now }
   });
   
   module.exports = mongoose.model('User', userSchema);
   ```

4. **Connect to MongoDB**
   ```javascript
   // /server/config/database.js
   const mongoose = require('mongoose');
   
   const connectDB = async () => {
     try {
       await mongoose.connect(process.env.MONGODB_URI, {
         useNewUrlParser: true,
         useUnifiedTopology: true
       });
       console.log('MongoDB connected');
     } catch (error) {
       console.error('MongoDB connection failed:', error);
       process.exit(1);
     }
   };
   
   module.exports = connectDB;
   ```

5. **Environment Variables**
   ```env
   # .env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/techconnect
   JWT_SECRET=your_super_secret_key_here
   ```

6. **Replace Mock API**
   - Update `/services/api.js` to call REST endpoints
   - Example: `fetch('/api/companies')` instead of localStorage

---

## 🔐 Authentication Integration

### Google OAuth Integration

**Current:** Mock Google sign-in  
**Production:** Real Google OAuth 2.0

#### Steps:

1. **Google Cloud Console Setup**
   ```bash
   # Visit: https://console.cloud.google.com
   # Create new project "TechConnect"
   # Enable Google+ API
   # Create OAuth 2.0 credentials
   # Add authorized redirect URIs:
   # - http://localhost:3000 (development)
   # - https://techconnect.pk (production)
   ```

2. **Install Google OAuth Library**
   ```bash
   npm install @react-oauth/google
   ```

3. **Update SignInModal.jsx**
   ```jsx
   import { GoogleLogin } from '@react-oauth/google';
   import { GoogleOAuthProvider } from '@react-oauth/google';
   
   // Wrap app in provider (App.jsx)
   <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
     <App />
   </GoogleOAuthProvider>
   
   // In SignInModal component
   <GoogleLogin
     onSuccess={(credentialResponse) => {
       // Send credentialResponse.credential to your backend
       fetch('/api/auth/google', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ token: credentialResponse.credential })
       });
     }}
     onError={() => console.log('Login Failed')}
   />
   ```

4. **Backend Verification**
   ```javascript
   // /server/routes/auth.js
   const { OAuth2Client } = require('google-auth-library');
   const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
   
   router.post('/auth/google', async (req, res) => {
     const { token } = req.body;
     const ticket = await client.verifyIdToken({
       idToken: token,
       audience: process.env.GOOGLE_CLIENT_ID
     });
     const payload = ticket.getPayload();
     // Create or update user in database
   });
   ```

### Email/Password Authentication

```bash
npm install bcryptjs jsonwebtoken
```

```javascript
// /server/routes/auth.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  const { email, password, type } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashedPassword, type });
  await user.save();
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  res.json({ token, user });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  res.json({ token, user });
});
```

---

## 💳 Payment Gateway Integration

### JazzCash Integration

**Current:** Mock payment flow  
**Production:** JazzCash Mobile Account API

#### Steps:

1. **Get JazzCash Merchant Account**
   ```bash
   # Contact: merchant@jazzcash.com.pk
   # Required: Business registration, bank account
   # Get: Merchant ID, Password, Integrity Salt
   ```

2. **Install Dependencies**
   ```bash
   npm install crypto node-fetch
   ```

3. **Create Payment Service**
   ```javascript
   // /server/services/jazzcash.js
   const crypto = require('crypto');
   
   class JazzCashService {
     constructor() {
       this.merchantId = process.env.JAZZCASH_MERCHANT_ID;
       this.password = process.env.JAZZCASH_PASSWORD;
       this.integritySalt = process.env.JAZZCASH_SALT;
       this.returnUrl = process.env.JAZZCASH_RETURN_URL;
     }
     
     generateHash(data) {
       const sortedString = Object.keys(data)
         .sort()
         .map(key => data[key])
         .join('&');
       return crypto
         .createHmac('sha256', this.integritySalt)
         .update(sortedString)
         .digest('hex');
     }
     
     async initiatePayment(amount, orderId, customerPhone) {
       const data = {
         pp_Version: '1.1',
         pp_TxnType: 'MWALLET',
         pp_MerchantID: this.merchantId,
         pp_Password: this.password,
         pp_TxnRefNo: orderId,
         pp_Amount: amount * 100, // Convert to paisa
         pp_TxnCurrency: 'PKR',
         pp_TxnDateTime: new Date().toISOString().replace(/[-:]/g, '').split('.')[0],
         pp_BillReference: orderId,
         pp_Description: 'TechConnect Project Payment',
         pp_TxnExpiryDateTime: this.getExpiryDateTime(),
         pp_ReturnURL: this.returnUrl,
         pp_MobileNumber: customerPhone
       };
       
       data.pp_SecureHash = this.generateHash(data);
       
       // POST to JazzCash API
       const response = await fetch('https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(data)
       });
       
       return response.json();
     }
   }
   ```

### EasyPaisa Integration

Similar process - contact EasyPaisa merchant services at merchant@easypaisa.com.pk

**API Documentation:** Request from EasyPaisa team after merchant approval

---

## 🌐 Translation API

### Google Translate API Integration

**Current:** Predefined translations dictionary  
**Production:** Dynamic Google Cloud Translation API

#### Steps:

1. **Enable Google Cloud Translation**
   ```bash
   # Visit: https://console.cloud.google.com
   # Enable Cloud Translation API
   # Create API key
   ```

2. **Install SDK**
   ```bash
   npm install @google-cloud/translate
   ```

3. **Update Translation Service**
   ```javascript
   // /services/translations.js
   const { Translate } = require('@google-cloud/translate').v2;
   
   const translate = new Translate({
     key: process.env.GOOGLE_TRANSLATE_API_KEY
   });
   
   export async function translateText(text, targetLang) {
     try {
       const [translation] = await translate.translate(text, targetLang);
       return translation;
     } catch (error) {
       console.error('Translation error:', error);
       return text; // Fallback to original
     }
   }
   ```

4. **Environment Variable**
   ```env
   GOOGLE_TRANSLATE_API_KEY=your_api_key_here
   ```

---

## 🤖 AI Chatbot Integration

### OpenAI Integration

**Current:** Keyword-based mock responses  
**Production:** OpenAI GPT-4 API

#### Steps:

1. **Get OpenAI API Key**
   ```bash
   # Visit: https://platform.openai.com
   # Create account and get API key
   ```

2. **Install OpenAI SDK**
   ```bash
   npm install openai
   ```

3. **Update Chatbot Component**
   ```javascript
   // /services/api.js
   import OpenAI from 'openai';
   
   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY
   });
   
   export const chatbotAPI = {
     async sendMessage(message) {
       const completion = await openai.chat.completions.create({
         model: "gpt-4",
         messages: [
           {
             role: "system",
             content: "You are a helpful assistant for TechConnect, a platform connecting Pakistani businesses with tech companies. Answer questions about services, pricing, and how the platform works."
           },
           {
             role: "user",
             content: message
           }
         ],
         temperature: 0.7,
         max_tokens: 150
       });
       
       return completion.choices[0].message.content || 'Sorry, I could not process that.';
     }
   };
   ```

4. **Environment Variable**
   ```env
   OPENAI_API_KEY=sk-your_api_key_here
   ```

**Cost Optimization:**
- Cache common questions/answers
- Set token limits
- Implement rate limiting per user

---

## 💬 Real-time Messaging

### WebSocket Implementation

**Current:** Mock messaging with setTimeout  
**Production:** Socket.io or Supabase Realtime

#### Option 1: Socket.io

```bash
npm install socket.io socket.io-client
```

**Server:**
```javascript
// /server/index.js
const io = require('socket.io')(server, {
  cors: { origin: process.env.CLIENT_URL }
});

io.on('connection', (socket) => {
  socket.on('join-conversation', (conversationId) => {
    socket.join(conversationId);
  });
  
  socket.on('send-message', async (data) => {
    const message = await Message.create(data);
    io.to(data.conversationId).emit('new-message', message);
  });
});
```

**Client:**
```javascript
// /services/messaging.js
import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_API_URL);

export function joinConversation(conversationId) {
  socket.emit('join-conversation', conversationId);
}

export function sendMessage(conversationId, content) {
  socket.emit('send-message', { conversationId, content });
}

export function onNewMessage(callback) {
  socket.on('new-message', callback);
}
```

#### Option 2: Supabase Realtime

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Subscribe to new messages
supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  }, (payload) => {
    console.log('New message:', payload.new);
  })
  .subscribe();
```

---

## 📁 File Storage

### AWS S3 or Cloudinary Integration

**For:** Company logos, portfolio images, project attachments

#### Cloudinary (Recommended for images)

```bash
npm install cloudinary
```

```javascript
// /server/services/upload.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadImage(file) {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'techconnect',
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  });
  return result.secure_url;
}
```

---

## 🔍 SEO Optimization

### Next.js Migration (Recommended)

For better SEO, migrate to Next.js for server-side rendering:

```bash
npx create-next-app@latest techconnect
```

**Benefits:**
- Server-side rendering
- Dynamic meta tags
- Automatic code splitting
- Better performance

### Meta Tags Implementation

```jsx
// /pages/index.js (Next.js)
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>TechConnect - Pakistan's Premier Tech Marketplace</title>
        <meta name="description" content="Connect with verified tech companies in Pakistan for web development, mobile apps, and digital marketing services." />
        <meta name="keywords" content="pakistan tech companies, web development pakistan, mobile app development, digital marketing" />
        <meta property="og:title" content="TechConnect - Pakistan's Premier Tech Marketplace" />
        <meta property="og:description" content="Get your projects done by verified professionals" />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:url" content="https://techconnect.pk" />
        <link rel="canonical" content="https://techconnect.pk" />
      </Head>
      {/* Component content */}
    </>
  );
}
```

### Sitemap Generation

```xml
<!-- /public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://techconnect.pk/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://techconnect.pk/browse</loc>
    <priority>0.8</priority>
  </url>
  <!-- Add all pages -->
</urlset>
```

---

## 🚀 Deployment

### Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Environment Variables on Vercel:**
- Add all API keys in Vercel dashboard
- Settings → Environment Variables

### Backend Deployment (Railway/Render)

**Railway.app:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

**Render.com:**
- Connect GitHub repository
- Select "Web Service"
- Add environment variables
- Deploy

### Database Deployment

- MongoDB Atlas (already cloud-hosted)
- Add production cluster
- Whitelist deployment server IPs

### Domain Setup

1. **Purchase Domain:** techconnect.pk
2. **DNS Configuration:**
   ```
   A Record: @ → Vercel IP
   CNAME: www → cname.vercel-dns.com
   ```

### SSL Certificate

- Automatic with Vercel/Railway
- Or use Let's Encrypt + Certbot

---

## 🔒 Security Best Practices

### Environment Variables

```env
# NEVER commit .env to git
# Add to .gitignore

# Backend
MONGODB_URI=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JAZZCASH_MERCHANT_ID=
JAZZCASH_PASSWORD=
JAZZCASH_SALT=
OPENAI_API_KEY=

# Frontend
REACT_APP_API_URL=
REACT_APP_GOOGLE_CLIENT_ID=
```

### Input Validation

```javascript
// Use validator.js
npm install validator

import validator from 'validator';

function validateEmail(email) {
  return validator.isEmail(email);
}

function sanitizeInput(input) {
  return validator.escape(input);
}
```

### Rate Limiting

```javascript
// Express rate limiter
npm install express-rate-limit

const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
```

### MongoDB Security

- Enable authentication
- Use connection string with username/password
- Whitelist IP addresses only
- Enable audit logging

---

## 📊 Monitoring & Analytics

### Google Analytics

```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Error Tracking (Sentry)

```bash
npm install @sentry/react

import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV
});
```

---

## 📝 Final Checklist

- [ ] MongoDB Atlas cluster created and connected
- [ ] Google OAuth credentials configured
- [ ] JazzCash/EasyPaisa merchant accounts approved
- [ ] OpenAI API key obtained
- [ ] Translation API enabled
- [ ] File storage (Cloudinary) configured
- [ ] WebSocket server deployed
- [ ] SSL certificate installed
- [ ] Environment variables set on hosting
- [ ] Domain pointed to hosting
- [ ] Analytics and monitoring enabled
- [ ] Error tracking configured
- [ ] Email service configured (SendGrid/Mailgun)
- [ ] Backup strategy implemented
- [ ] Security audit completed

---

## 🆘 Support Resources

- **MongoDB:** https://docs.mongodb.com
- **Google Cloud:** https://cloud.google.com/docs
- **JazzCash:** https://developer.jazzcash.com.pk
- **OpenAI:** https://platform.openai.com/docs
- **Vercel:** https://vercel.com/docs
- **Next.js:** https://nextjs.org/docs

---

**Note:** This is a comprehensive production integration guide. Implement features incrementally and test thoroughly in a staging environment before production deployment.

For questions or issues, refer to the respective service documentation or contact their support teams.
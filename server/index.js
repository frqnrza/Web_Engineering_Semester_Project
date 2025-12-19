const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const notificationRoutes = require('./routes/notifications');
const path = require('path'); // ✅ ADDED for production
const rateLimit = require('express-rate-limit'); // ✅ ADDED for security
const helmetConfig = require('./config/helmet-config');

dotenv.config();

const app = express();

// Enable compression for better performance
if (process.env.ENABLE_COMPRESSION === 'true') {
  const compression = require('compression');
  app.use(compression());
}

// âœ… FIXED: Proper CORS configuration for development
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000']; // Add default for dev

const corsOptions = {
  origin: function (origin, callback) {
    // âœ… CRITICAL: Allow requests with no origin (Postman, mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Total-Count'],
  preflightContinue: false, // âœ… Added
  optionsSuccessStatus: 204 // âœ… Added for legacy browsers
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ✅ ADDED: Security headers middleware
app.use((req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Request logging in production (lightweight)
  if (process.env.NODE_ENV === 'production') {
    console.log(`${new Date().toISOString()} - ${req.ip} - ${req.method} ${req.url} - ${req.get('user-agent')?.substring(0, 50) || 'Unknown'}`);
  } else {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  }
  
  next();
});

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/verification', require('./routes/verification')); 
app.use('/api/notifications', notificationRoutes);
// app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/users', require('./routes/users'));        // âœ… NEW
app.use('/api/bids', require('./routes/bids'));          // âœ… NEW
app.use('/api/company-setup', require('./routes/company-setup'));
app.use(helmetConfig);

// ✅ REMOVED: /api/translate route (using static i18n)
// app.use('/api/translate', require('./routes/translate'));

// âœ… MOVED: Health check BEFORE rate limiter
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusText = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }[dbStatus];
  
  const healthStatus = dbStatus === 1 ? 'healthy' : 'unhealthy';
  
  res.json({ 
    status: healthStatus,
    service: 'techconnect-backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: statusText,
      connection: dbStatus
    }
  });
});

// âœ… Rate limiting AFTER health check
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // âœ… Increased for dev
  skip: (req) => req.path === '/api/health', // âœ… Skip health checks
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});

app.use('/api/', apiLimiter);

// ✅ ADDED: API version endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'TechConnect API v1.0',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      companies: '/api/companies',
      projects: '/api/projects',
      messages: '/api/messages',
      payments: '/api/payments',
      upload: '/api/upload',
      verification: '/api/verification',
      notifications: '/api/notifications',
      chatbot: '/api/chatbot',
      health: '/api/health'
    },
    documentation: process.env.API_DOCS_URL || 'Coming soon...'
  });
});

// ✅ ADDED: Serve static files in production (if serving frontend from same server)
if (process.env.NODE_ENV === 'production' && process.env.SERVE_FRONTEND === 'true') {
  // Serve static files from the React/Vite build
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
  
  console.log('📁 Serving frontend from same server');
}

// ✅ IMPROVED: 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    message: 'The requested endpoint does not exist',
    documentation: process.env.API_DOCS_URL || null
  });
});

// ✅ IMPROVED: Global error handler
app.use((err, req, res, next) => {
  // Log error with context
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    error: {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      name: err.name,
      code: err.code
    }
  };
  
  console.error('API Error:', JSON.stringify(errorLog, null, 2));
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: messages,
      message: 'Please check your input data'
    });
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      error: 'Duplicate Entry',
      field: field,
      message: `${field} already exists`
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication Error',
      message: 'Invalid token. Please log in again.'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication Error',
      message: 'Token expired. Please log in again.'
    });
  }
  
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS Error',
      message: 'Origin not allowed',
      allowedOrigins: allowedOrigins
    });
  }
  
  // Default error response
  const statusCode = err.status || 500;
  const response = {
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong. Please try again later.' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  };
  
  // Don't send stack trace in production
  if (process.env.NODE_ENV === 'production') {
    delete response.stack;
    delete response.details;
  }
  
  res.status(statusCode).json(response);
});

// ✅ ADDED: Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

// ✅ UPDATED: Server startup with better logging
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => { // Listen on all interfaces
  console.log(`
🚀 ==========================================
   TechConnect Backend Server Started
==========================================
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📅 Date: ${new Date().toLocaleString()}
🔗 Health Check: http://localhost:${PORT}/api/health
📚 API Info: http://localhost:${PORT}/api/v1
==========================================
  `);
  
  // Log database connection status
  const dbState = mongoose.connection.readyState;
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState];
  console.log(`🗄️  MongoDB: ${dbStatus} (${dbState})`);
  
  // Log environment summary
  console.log(`
📋 Environment Summary:
   • NODE_ENV: ${process.env.NODE_ENV || 'development'}
   • CLIENT_URL: ${process.env.CLIENT_URL || 'Not set'}
   • ALLOWED_ORIGINS: ${allowedOrigins.join(', ')}
   • MONGO_URI Set: ${!!process.env.MONGODB_URI}
   • GEMINI_API_KEY Set: ${!!process.env.GEMINI_API_KEY}
   • CLOUDINARY Set: ${!!process.env.CLOUDINARY_CLOUD_NAME}
==========================================
  `);
});

// ✅ ADDED: Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
  }
});

// Export for testing
module.exports = app;
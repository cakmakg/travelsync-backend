"use strict";
/* -------------------------------------------------------
    TravelSync - Server with Auth Routes
------------------------------------------------------- */

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

// Load environment variables
dotenv.config();

// Import configurations
const { connectDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TravelSync API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/v1/auth', require('./routes/auth'));

// Welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to TravelSync API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
    },
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
      method: req.method,
    },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value entered';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// ============================================
// SERVER START
// ============================================

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║        🏨 TravelSync API Server          ║
║                                           ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(28)}║
║  Port:        ${PORT.toString().padEnd(28)}║
║  Database:    Connected ✓                 ║
║                                           ║
║  🔗 API Endpoints:                        ║
║  ├─ Health:   /health                     ║
║  ├─ Auth:     /api/v1/auth                ║
║  │   ├─ POST  /register                   ║
║  │   ├─ POST  /login                      ║
║  │   ├─ GET   /me                         ║
║  │   ├─ POST  /refresh                    ║
║  │   └─ POST  /logout                     ║
║                                           ║
╚═══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
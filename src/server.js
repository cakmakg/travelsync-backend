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

// ============================================
// CRITICAL: Error handlers MUST be at the top!
// ============================================

// Handle uncaught exceptions (MUST BE FIRST!)
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! 💥 Shutting down...');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  process.exit(1);
});

// Import configurations
const { connectDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5001;  // ✅ Changed from 5000 to 8000

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
    environment: process.env.NODE_ENV || 'development',
  });
});

// Welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to TravelSync API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      organizations: '/api/v1/organizations',
      users: '/api/v1/users',
      properties: '/api/v1/properties',
      roomTypes: '/api/v1/room-types',
      ratePlans: '/api/v1/rate-plans',
      prices: '/api/v1/prices',
      inventory: '/api/v1/inventory',
      reservations: '/api/v1/reservations',
       agencies: '/api/v1/agencies', 
  agencyContracts: '/api/v1/agency-contracts',
    },
  });
});

// API Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/organizations', require('./routes/organization'));
app.use('/api/v1/users', require('./routes/user'));
app.use('/api/v1/properties', require('./routes/property'));
app.use('/api/v1/room-types', require('./routes/roomType'));
app.use('/api/v1/rate-plans', require('./routes/ratePlan'));
app.use('/api/v1/prices', require('./routes/price'));
app.use('/api/v1/inventory', require('./routes/inventory'));
app.use('/api/v1/reservations', require('./routes/reservation'));

// Phase 2: Agency Routes
app.use('/api/v1/agencies', require('./routes/agency'));
app.use('/api/v1/agency-contracts', require('./routes/agencyContract')); 


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

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  }

  // Mongoose duplicate key error
  if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value entered';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Log error in development
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
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err.message 
      }),
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
    const server = app.listen(PORT, () => {
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
║  ├─ Health:        /health                ║
║  ├─ Auth:          /api/v1/auth           ║
║  ├─ Organizations: /api/v1/organizations  ║
║  ├─ Users:         /api/v1/users          ║
║  ├─ Properties:    /api/v1/properties     ║
║  ├─ Room Types:    /api/v1/room-types     ║
║  ├─ Rate Plans:    /api/v1/rate-plans     ║
║  ├─ Prices:        /api/v1/prices         ║
║  ├─ Inventory:     /api/v1/inventory      ║
║  └─ Reservations:  /api/v1/reservations   ║
║                                           ║
║  🚀 Server is ready to accept requests!  ║
║                                           ║
╚═══════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\n👋 SIGINT received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
module.exports = app;
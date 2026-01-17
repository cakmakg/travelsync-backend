"use strict";
/**
 * Express App Configuration
 * Separated from server startup for testing purposes
 */

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Gelişmiş güvenlik modülü
const {
    helmetConfig,
    securityHeaders,
    requestTimeout,
    ipSecurity,
} = require('./middlewares/security');

dotenv.config();
const logger = require('./config/logger');

const app = express();

// ============================================
// ÜST SEVİYE GÜVENLİK MIDDLEWARE
// ============================================

// Gelişmiş Helmet konfigürasyonu (CSP, HSTS, XSS, etc.)
app.use(helmet(helmetConfig));

// Ek güvenlik başlıkları
app.use(securityHeaders);

// Request timeout (30 saniye)
app.use(requestTimeout(30000));

// IP tabanlı güvenlik kontrolleri
app.use(ipSecurity);

// Rate limiting - Genel API koruma (sadece production'da aktif)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: process.env.NODE_ENV === 'production' ? 100 : 10000, // Development'ta çok yüksek limit
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { message: 'Çok fazla istek gönderildi, lütfen 15 dakika bekleyin.' }
    },
    handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(options.statusCode).json(options.message);
    },
    skip: () => process.env.NODE_ENV !== 'production', // Skip in non-production environments
});

// Auth için daha sıkı rate limit (sadece production'da aktif)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: process.env.NODE_ENV === 'production' ? 10 : 1000, // Development'ta sınırsız
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { message: 'Çok fazla giriş denemesi, lütfen 15 dakika bekleyin.' }
    },
    handler: (req, res, next, options) => {
        logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
        res.status(options.statusCode).json(options.message);
    },
    skip: () => process.env.NODE_ENV !== 'production', // Skip in non-production environments
});

// NoSQL Injection koruması
app.use(mongoSanitize({
    onSanitize: ({ req, key }) => {
        logger.warn(`NoSQL injection attempt blocked - Key: ${key}, IP: ${req.ip}`);
    }
}));

// XSS koruması
app.use(xss());

// HTTP Parameter Pollution koruması
app.use(hpp({
    whitelist: ['sort', 'page', 'limit', 'status'] // İzin verilen duplicate params
}));

// Compression
app.use(compression());

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:5173'];

const corsOptions = {
    origin: function (origin, callback) {
        // In development/test, allow all origins
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        // In production, check allowed origins
        if (!origin || origin === 'null' || origin === 'undefined') {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach response methods to res object (res.success(), res.error(), etc.)
const { attachResponseMethods } = require('./utils/response');
app.use(attachResponseMethods);

// Logging in development
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'TravelSync API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    });
});

// API routes
const apiRouter = express.Router();

// Genel API rate limiting
apiRouter.use(limiter);

// Auth route - daha sıkı rate limit
apiRouter.use('/auth', authLimiter, require('./routes/auth'));
apiRouter.use('/organizations', require('./routes/organization'));
apiRouter.use('/users', require('./routes/user'));
apiRouter.use('/properties', require('./routes/property'));
apiRouter.use('/room-types', require('./routes/roomType'));
apiRouter.use('/rate-plans', require('./routes/ratePlan'));
apiRouter.use('/prices', require('./routes/price'));
apiRouter.use('/inventory', require('./routes/inventory'));
apiRouter.use('/reservations', require('./routes/reservation'));
apiRouter.use('/agencies', require('./routes/agency'));
apiRouter.use('/agency-contracts', require('./routes/agencyContract'));
apiRouter.use('/admin', require('./routes/admin'));

// AI Routes
apiRouter.use('/ai/pricing', require('./routes/ai/pricing.routes'));
apiRouter.use('/analytics', require('./routes/analytics'));

// Flash Offer Routes (WhatsApp bildirimleri)
apiRouter.use('/flash-offers', require('./routes/flashOffer'));

app.use('/api/v1', apiRouter);

// 404 handler
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;

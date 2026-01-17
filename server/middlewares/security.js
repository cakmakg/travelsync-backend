"use strict";
/* -------------------------------------------------------
    TravelSync - Security Middleware
    Üst seviye güvenlik yapılandırmaları
------------------------------------------------------- */

/**
 * Gelişmiş Helmet konfigürasyonu
 * Content Security Policy, HSTS, ve diğer güvenlik başlıkları
 */
const helmetConfig = {
    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind için gerekli
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
    },
    // HTTP Strict Transport Security
    hsts: {
        maxAge: 31536000, // 1 yıl
        includeSubDomains: true,
        preload: true,
    },
    // X-Frame-Options
    frameguard: { action: 'deny' },
    // X-Content-Type-Options
    noSniff: true,
    // X-XSS-Protection (legacy browsers için)
    xssFilter: true,
    // Referrer Policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // Permissions Policy
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
};

/**
 * Güvenlik başlıkları (ek)
 */
const securityHeaders = (req, res, next) => {
    // Cache-Control güvenlik
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // X-Permitted-Cross-Domain-Policies
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Permissions-Policy (feature policy)
    res.setHeader('Permissions-Policy',
        'geolocation=(), microphone=(), camera=(), payment=(), usb=()');

    // X-Download-Options (IE için)
    res.setHeader('X-Download-Options', 'noopen');

    next();
};

/**
 * Request timeout middleware
 * DoS saldırılarına karşı koruma
 */
const requestTimeout = (timeout = 30000) => {
    return (req, res, next) => {
        req.setTimeout(timeout, () => {
            if (!res.headersSent) {
                res.status(408).json({
                    success: false,
                    error: { message: 'Request timeout' }
                });
            }
        });
        next();
    };
};

/**
 * IP tabanlı güvenlik kontrolleri
 */
const ipSecurity = (req, res, next) => {
    // Şüpheli IP'leri logla
    const suspiciousPatterns = [
        /sqlmap/i,
        /nikto/i,
        /nmap/i,
        /masscan/i,
    ];

    const userAgent = req.headers['user-agent'] || '';

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(userAgent)) {
            const logger = require('../config/logger');
            logger.warn(`Suspicious user agent detected: ${userAgent}, IP: ${req.ip}`);
            // Bloklamıyoruz ama logluyoruz
        }
    }

    next();
};

/**
 * Şifre güvenlik validasyonu
 * Minimum 8 karakter, büyük harf, küçük harf, rakam, özel karakter
 */
const validatePassword = (password) => {
    const errors = [];

    if (!password || password.length < 8) {
        errors.push('Şifre en az 8 karakter olmalıdır');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Şifre en az bir büyük harf içermelidir');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Şifre en az bir küçük harf içermelidir');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Şifre en az bir rakam içermelidir');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Şifre en az bir özel karakter içermelidir (!@#$%^&*...)');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Şifre validasyon middleware
 */
const passwordValidationMiddleware = (req, res, next) => {
    const password = req.body.password;

    if (password) {
        const validation = validatePassword(password);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Şifre güvenlik gereksinimlerini karşılamıyor',
                    details: validation.errors
                }
            });
        }
    }

    next();
};

/**
 * Güvenli JSON parsing (büyük payload saldırılarına karşı)
 */
const jsonLimits = {
    limit: '1mb', // Normal istekler için
    parameterLimit: 100, // Query parameter limiti
};

/**
 * Dosya yükleme güvenliği
 */
const uploadLimits = {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5, // Maksimum 5 dosya
    allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
    ],
};

/**
 * CORS güvenlik yapılandırması
 */
const getCorsConfig = () => {
    const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
        : ['http://localhost:3000', 'http://localhost:5173'];

    return {
        origin: function (origin, callback) {
            // Development'ta tüm origin'lere izin ver
            if (process.env.NODE_ENV !== 'production') {
                return callback(null, true);
            }

            // Production'da sadece whitelist'teki origin'lere izin ver
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('CORS policy violation'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
        maxAge: 86400, // 24 saat preflight cache
    };
};

/**
 * Güvenlik logları
 */
const securityLogger = (eventType, details, req) => {
    const logger = require('../config/logger');

    logger.warn({
        type: 'SECURITY_EVENT',
        event: eventType,
        ip: req?.ip,
        userAgent: req?.headers?.['user-agent'],
        path: req?.originalUrl,
        method: req?.method,
        userId: req?.user?._id,
        ...details,
        timestamp: new Date().toISOString(),
    });
};

module.exports = {
    helmetConfig,
    securityHeaders,
    requestTimeout,
    ipSecurity,
    validatePassword,
    passwordValidationMiddleware,
    jsonLimits,
    uploadLimits,
    getCorsConfig,
    securityLogger,
};

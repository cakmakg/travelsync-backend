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

/**
 * Redis-backed Rate Limiting Factory
 * Multi-instance deployment için Redis store kullanır
 */
const createRedisRateLimiter = (options = {}) => {
    const rateLimit = require('express-rate-limit');
    const { getRedisClient, isRedisConnected } = require('../config/redis');

    const defaultOptions = {
        windowMs: 15 * 60 * 1000, // 15 dakika
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            error: { message: 'Too many requests, please try again later.' }
        },
        skip: () => process.env.NODE_ENV !== 'production',
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // Redis bağlıysa Redis store kullan
    if (isRedisConnected()) {
        const RedisStore = require('rate-limit-redis');
        const redisClient = getRedisClient();

        if (redisClient) {
            mergedOptions.store = new RedisStore({
                sendCommand: (...args) => redisClient.call(...args),
                prefix: 'rl:',
            });
        }
    }

    return rateLimit(mergedOptions);
};

/**
 * HTTPS Enforcement Middleware
 * Production'da HTTPS'e yönlendirir
 */
const httpsEnforcement = (req, res, next) => {
    // Production değilse devam et
    if (process.env.NODE_ENV !== 'production') {
        return next();
    }

    // Zaten HTTPS ise devam et
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        return next();
    }

    // HTTPS'e yönlendir
    const httpsUrl = `https://${req.headers.host}${req.url}`;
    return res.redirect(301, httpsUrl);
};

/**
 * Gelişmiş Input Sanitization
 * XSS, SQL Injection, NoSQL Injection'a karşı koruma
 */
const inputSanitizer = (req, res, next) => {
    const validator = require('validator');

    const sanitizeValue = (value) => {
        if (typeof value === 'string') {
            // HTML entities escape
            let sanitized = validator.escape(value);
            // Trim whitespace
            sanitized = validator.trim(sanitized);
            // Null bytes temizle
            sanitized = sanitized.replace(/\0/g, '');
            return sanitized;
        }
        return value;
    };

    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;

        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            // Key'leri de kontrol et (prototype pollution)
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                continue;
            }

            if (Array.isArray(value)) {
                sanitized[key] = value.map(v =>
                    typeof v === 'object' ? sanitizeObject(v) : sanitizeValue(v)
                );
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = sanitizeValue(value);
            }
        }
        return sanitized;
    };

    // Body, query ve params'ı sanitize et
    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) req.query = sanitizeObject(req.query);
    if (req.params) req.params = sanitizeObject(req.params);

    next();
};

/**
 * API Key Validation Middleware
 * Harici API erişimleri için API key kontrolü
 */
const apiKeyValidator = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    // API key yoksa veya yanlışsa
    if (!apiKey || apiKey !== process.env.API_KEY) {
        // Bazı route'lar için API key zorunlu değil
        if (req.path.startsWith('/api/v1/auth') ||
            req.path.startsWith('/health') ||
            req.path === '/') {
            return next();
        }

        // API key tanımlı değilse (development) devam et
        if (!process.env.API_KEY) {
            return next();
        }

        securityLogger('INVALID_API_KEY', { providedKey: apiKey?.substring(0, 8) + '...' }, req);
        return res.status(401).json({
            success: false,
            error: { message: 'Invalid or missing API key' }
        });
    }

    next();
};

/**
 * Brute Force Protection
 * Login denemelerini sınırlar
 */
const bruteForceProtection = createRedisRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 5, // 5 deneme
    message: {
        success: false,
        error: {
            message: 'Too many login attempts. Please try again after 15 minutes.',
            retryAfter: 15 * 60
        }
    },
    keyGenerator: (req) => {
        // IP + username kombinasyonu
        const username = req.body?.email || req.body?.username || '';
        return `${req.ip}:${username}`;
    },
    skip: () => process.env.NODE_ENV !== 'production',
});

/**
 * Sensitive Data Masking
 * Log'larda hassas verileri maskeler
 */
const maskSensitiveData = (data) => {
    if (!data || typeof data !== 'object') return data;

    const sensitiveFields = [
        'password', 'token', 'secret', 'apiKey', 'api_key',
        'accessToken', 'refreshToken', 'credit_card', 'cvv',
        'ssn', 'tax_id', 'bank_account'
    ];

    const masked = { ...data };

    for (const field of sensitiveFields) {
        if (masked[field]) {
            masked[field] = '***MASKED***';
        }
    }

    return masked;
};

/**
 * Security Audit Middleware
 * Güvenlik olaylarını loglar
 */
const securityAudit = (req, res, next) => {
    const startTime = Date.now();

    // Response tamamlandığında logla
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const isError = res.statusCode >= 400;
        const isSuspicious = res.statusCode === 401 || res.statusCode === 403;

        if (isSuspicious) {
            securityLogger('AUTH_FAILURE', {
                statusCode: res.statusCode,
                duration,
                body: maskSensitiveData(req.body),
            }, req);
        }
    });

    next();
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
    // Yeni eklenenler
    createRedisRateLimiter,
    httpsEnforcement,
    inputSanitizer,
    apiKeyValidator,
    bruteForceProtection,
    maskSensitiveData,
    securityAudit,
};


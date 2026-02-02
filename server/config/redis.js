"use strict";
/* -------------------------------------------------------
    TravelSync - Redis Configuration
    Rate limiting ve caching için Redis bağlantısı
------------------------------------------------------- */

const Redis = require('ioredis');
const logger = require('./logger');

let redisClient = null;
let isConnected = false;

/**
 * Redis bağlantısını başlat
 */
const connectRedis = () => {
    // Redis URL yoksa mock client döndür
    if (!process.env.REDIS_URL) {
        logger.warn('Redis URL not configured - using in-memory fallback');
        return null;
    }

    try {
        redisClient = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            enableReadyCheck: true,
            lazyConnect: true,
            showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
        });

        redisClient.on('connect', () => {
            logger.info('Redis connected successfully');
            isConnected = true;
        });

        redisClient.on('error', (err) => {
            logger.error('Redis connection error:', err.message);
            isConnected = false;
        });

        redisClient.on('close', () => {
            logger.warn('Redis connection closed');
            isConnected = false;
        });

        // Bağlantıyı başlat
        redisClient.connect().catch((err) => {
            logger.error('Redis initial connection failed:', err.message);
        });

        return redisClient;
    } catch (error) {
        logger.error('Redis initialization failed:', error.message);
        return null;
    }
};

/**
 * Redis client'ı al
 */
const getRedisClient = () => {
    if (!redisClient) {
        connectRedis();
    }
    return redisClient;
};

/**
 * Redis bağlantı durumu
 */
const isRedisConnected = () => isConnected;

/**
 * Redis bağlantısını kapat
 */
const closeRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        isConnected = false;
        logger.info('Redis connection closed');
    }
};

module.exports = {
    connectRedis,
    getRedisClient,
    isRedisConnected,
    closeRedis,
};

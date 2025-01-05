const Redis = require('redis');
const { logger } = require('../utils/logger');

let redisClient;

const setupRedis = async () => {
    try {
        redisClient = Redis.createClient({
            url: `rediss://${process.env.REDIS_HOST}`,
            socket: {
                port: parseInt(process.env.REDIS_PORT),
                tls: true,
                rejectUnauthorized: false // 如果是自签名证书，需要设置为 false
            },
            password: process.env.REDIS_PASSWORD,
            database: parseInt(process.env.REDIS_DB),
            prefix: process.env.REDIS_PREFIX
        });

        redisClient.on('error', (err) => {
            logger.error('Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
            logger.info('Redis Client Connected');
        });

        redisClient.on('reconnecting', () => {
            logger.warn('Redis Client Reconnecting');
        });

        await redisClient.connect();

        return redisClient;
    } catch (error) {
        logger.error('Error setting up Redis:', error);
        throw error;
    }
};

const getRedisClient = () => {
    if (!redisClient) {
        throw new Error('Redis client not initialized');
    }
    return redisClient;
};

// 缓存工具函数
const cacheGet = async (key) => {
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        logger.error('Cache Get Error:', error);
        return null;
    }
};

const cacheSet = async (key, value, ttl = 3600) => {
    try {
        const stringValue = JSON.stringify(value);
        await redisClient.set(key, stringValue, {
            EX: ttl
        });
        return true;
    } catch (error) {
        logger.error('Cache Set Error:', error);
        return false;
    }
};

const cacheDelete = async (key) => {
    try {
        await redisClient.del(key);
        return true;
    } catch (error) {
        logger.error('Cache Delete Error:', error);
        return false;
    }
};

module.exports = {
    setupRedis,
    getRedisClient,
    cacheGet,
    cacheSet,
    cacheDelete
}; 
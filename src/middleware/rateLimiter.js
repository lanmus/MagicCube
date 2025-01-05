const rateLimit = require('express-rate-limit');

// 创建限流器配置
const createRateLimiter = (options = {}) => {
    const {
        windowMs = parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15分钟
        max = parseInt(process.env.RATE_LIMIT_MAX) || 100, // 限制每个IP在windowMs时间内最多100次请求
        message = {
            status: 'error',
            message: '请求过于频繁，请稍后再试'
        },
        skipPaths = ['/static/', '/uploads/', '/health']
    } = options;

    return rateLimit({
        windowMs,
        max,
        message,
        standardHeaders: true,
        legacyHeaders: false,
        // 自定义处理函数
        handler: (req, res) => {
            res.status(429).json({
                status: 'error',
                message: '请求过于频繁，请稍后再试',
                retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
            });
        },
        // 跳过某些路由的限流
        skip: (req) => {
            return skipPaths.some(path => req.path.startsWith(path));
        },
        // 自定义密钥生成函数
        keyGenerator: (req) => {
            return req.user 
                ? `${req.ip}-${req.user.id}` 
                : req.ip;
        }
    });
};

// 创建标准限流器
const rateLimiter = createRateLimiter();

// 创建严格限流器
const strictRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1分钟
    max: 5, // 每分钟最多5次请求
    message: {
        status: 'error',
        message: '请求过于频繁，请稍后再试'
    }
});

module.exports = {
    rateLimiter,
    strictRateLimiter
}; 
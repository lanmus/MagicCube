const { logger } = require('../utils/logger');

const requestLogger = (req, res, next) => {
    // 记录请求开始时间
    const start = Date.now();

    // 记录原始end方法
    const originalEnd = res.end;

    // 重写end方法以记录响应时间
    res.end = function() {
        // 计算请求处理时间
        const duration = Date.now() - start;

        // 记录请求信息
        logger.info('Request completed', {
            method: req.method,
            path: req.path,
            query: req.query,
            params: req.params,
            body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('user-agent'),
            ip: req.ip,
            user: req.user ? req.user._id : null
        });

        // 调用原始end方法
        originalEnd.apply(res, arguments);
    };

    // 记录请求开始
    logger.info('Request started', {
        method: req.method,
        path: req.path,
        query: req.query,
        userAgent: req.get('user-agent'),
        ip: req.ip
    });

    next();
};

module.exports = {
    requestLogger
}; 
const logger = require('../utils/logger');

// 异步处理包装器
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
    logger.error(err.stack);

    // 默认错误
    let statusCode = 500;
    let message = '服务器内部错误';
    let errors = null;

    // 处理不同类型的错误
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = '数据验证错误';
        errors = Object.values(err.errors).map(error => error.message);
    } else if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 400;
        message = '数据已存在';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = '无效的令牌';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = '令牌已过期';
    }

    res.status(statusCode).json({
        status: 'error',
        message,
        errors: errors || undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = {
    asyncHandler,
    errorHandler
}; 
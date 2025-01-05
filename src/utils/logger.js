const winston = require('winston');
const path = require('path');

// 日志格式定义
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// 创建日志目录
const logDir = path.dirname(process.env.LOG_FILE);
require('fs').mkdirSync(logDir, { recursive: true });

// 创建logger实例
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // 文件日志
        new winston.transports.File({
            filename: process.env.LOG_FILE,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        }),
        // 错误日志
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        })
    ]
});

// 非生产环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// 请求日志格式化
const formatRequestLog = (req, res, responseTime) => {
    return {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        status: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.get('user-agent'),
        ip: req.ip,
        user: req.user ? req.user.id : 'anonymous'
    };
};

module.exports = {
    logger,
    formatRequestLog
}; 
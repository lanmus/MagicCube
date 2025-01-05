const express = require('express');
const app = express();
const { logger } = require('./utils/logger');
const { createDatabase, testConnection, initDatabase, pool } = require('./config/database');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // 创建数据库（如果不存在）
        await createDatabase();
        logger.info('Database creation checked');

        // 初始化数据库连接
        await testConnection();
        logger.info('Database connection tested');

        // 初始化数据库表
        await initDatabase();
        logger.info('Database tables initialized');

        // 初始化路由（在数据库初始化之后）
        initRoutes();
        logger.info('Routes initialized');

        // 启动服务器
        const server = app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });

        // 优雅关闭
        const gracefulShutdown = async () => {
            logger.info('Received shutdown signal');
            
            server.close(async () => {
                logger.info('HTTP server closed');
                
                // 关闭数据库连接
                await pool.end();
                logger.info('Database connection closed');

                process.exit(0);
            });

            // 如果 10 秒内没有完成关闭，强制退出
            setTimeout(() => {
                logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// 错误处理
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// 启动服务器
startServer();
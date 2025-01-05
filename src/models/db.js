const { pool } = require('../config/database');

const connectDB = async () => {
    try {
        // 测试数据库连接
        const connection = await pool.getConnection();
        console.log('MySQL Connected');
        connection.release();

        // 添加错误处理
        pool.on('error', err => {
            console.error('MySQL connection error:', err);
        });

        // 优雅关闭
        process.on('SIGINT', async () => {
            try {
                await pool.end();
                console.log('MySQL connection closed through app termination');
                process.exit(0);
            } catch (err) {
                console.error('Error closing MySQL connection:', err);
                process.exit(1);
            }
        });

        return pool;
    } catch (error) {
        console.error('Error connecting to MySQL:', error);
        process.exit(1);
    }
};

module.exports = {
    connectDB,
    pool
}; 
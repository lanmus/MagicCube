const { pool } = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

class StatsController {
    // 获取总体统计数据
    getOverview = asyncHandler(async (req, res) => {
        const [
            [{ totalUsers }],
            [{ totalProducts }],
            [{ totalDownloads }],
            [{ totalUploads }]
        ] = await Promise.all([
            pool.query('SELECT COUNT(*) as totalUsers FROM users'),
            pool.query('SELECT COUNT(*) as totalProducts FROM products'),
            pool.query('SELECT COUNT(*) as totalDownloads FROM downloads'),
            pool.query('SELECT COUNT(*) as totalUploads FROM materials')
        ]);

        res.json({
            status: 'success',
            data: {
                stats: {
                    totalUsers,
                    totalProducts,
                    totalDownloads,
                    totalUploads
                }
            }
        });
    });

    // 获取上传统计
    getUploadStats = asyncHandler(async (req, res) => {
        const [dailyStats, monthlyStats] = await Promise.all([
            pool.query(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count,
                    SUM(file_size) as totalSize
                FROM materials
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `),
            pool.query(`
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as count,
                    SUM(file_size) as totalSize
                FROM materials
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY month DESC
            `)
        ]);

        res.json({
            status: 'success',
            data: {
                daily: dailyStats[0],
                monthly: monthlyStats[0]
            }
        });
    });

    // 获取下载统计
    getDownloadStats = asyncHandler(async (req, res) => {
        const [dailyStats, monthlyStats] = await Promise.all([
            pool.query(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM downloads
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `),
            pool.query(`
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as count
                FROM downloads
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY month DESC
            `)
        ]);

        res.json({
            status: 'success',
            data: {
                daily: dailyStats[0],
                monthly: monthlyStats[0]
            }
        });
    });

    // 获取性能监控数据
    getPerformanceStats = asyncHandler(async (req, res) => {
        const [
            [{ avgResponseTime }],
            [{ errorRate }],
            [{ activeUsers }]
        ] = await Promise.all([
            pool.query(`
                SELECT AVG(response_time) as avgResponseTime
                FROM request_logs
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            `),
            pool.query(`
                SELECT 
                    COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*) as errorRate
                FROM request_logs
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            `),
            pool.query(`
                SELECT COUNT(DISTINCT user_id) as activeUsers
                FROM user_sessions
                WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
            `)
        ]);

        res.json({
            status: 'success',
            data: {
                performance: {
                    avgResponseTime: avgResponseTime || 0,
                    errorRate: errorRate || 0,
                    activeUsers: activeUsers || 0
                }
            }
        });
    });
}

module.exports = new StatsController(); 
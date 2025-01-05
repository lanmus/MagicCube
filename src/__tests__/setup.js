const db = require('../models/db');
const app = require('../app');

let server;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
    
    try {
        // 创建测试数据库
        const connection = await db.pool.getConnection();
        
        // 创建并使用测试数据库
        await connection.query(`
            CREATE DATABASE IF NOT EXISTS magic_cube_test;
            USE magic_cube_test;
        `);

        // 创建必要的表
        await connection.query(`
            DROP TABLE IF EXISTS images;
            DROP TABLE IF EXISTS modules;
            DROP TABLE IF EXISTS products;
            DROP TABLE IF EXISTS users;

            CREATE TABLE users (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE products (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                user_id BIGINT NOT NULL,
                name VARCHAR(100) NOT NULL,
                spu_code VARCHAR(50) NOT NULL UNIQUE,
                gender ENUM('male', 'female', 'unisex') NOT NULL,
                age_range VARCHAR(50) NOT NULL,
                scene VARCHAR(100) NOT NULL,
                style VARCHAR(100) NOT NULL,
                designer_3d VARCHAR(50) NOT NULL,
                designer_2d VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE modules (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                product_id BIGINT NOT NULL,
                module_type VARCHAR(50) NOT NULL,
                sub_type VARCHAR(50) NOT NULL,
                name VARCHAR(100) NOT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );

            CREATE TABLE images (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                module_id BIGINT NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(255) NOT NULL,
                file_size BIGINT NOT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
            );
        `);

        connection.release();

        // 启动服务器
        server = await new Promise(resolve => {
            const s = app.listen(process.env.PORT, () => resolve(s));
        });
    } catch (error) {
        console.error('Setup failed:', error);
        throw error;
    }
});

afterAll(async () => {
    try {
        // 清理测试数据
        const connection = await db.pool.getConnection();
        await connection.query('DROP DATABASE IF EXISTS magic_cube_test');
        connection.release();

        // 关闭数据库连接
        await db.end();

        // 关闭服务器
        if (server) {
            await new Promise((resolve, reject) => {
                server.close(err => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
    } catch (error) {
        console.error('Cleanup failed:', error);
        throw error;
    }
});

// 添加全局错误处理
process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
}); 
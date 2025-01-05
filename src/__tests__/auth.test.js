const request = require('supertest');
const app = require('../app');
const db = require('../models/db');

describe('认证 API', () => {
    beforeEach(async () => {
        try {
            // 清理测试数据
            await db.query('DELETE FROM users WHERE username = ?', ['testuser']);
        } catch (error) {
            console.error('Failed to clean test data:', error);
        }
    });

    test('用户注册', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                password: 'testpass123'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('userId');
    });

    test('用户登录', async () => {
        // 先注册用户
        await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                password: 'testpass123'
            });

        // 测试登录
        const res = await request(app)
            .post('/auth/login')
            .send({
                username: 'testuser',
                password: 'testpass123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
    });
}); 
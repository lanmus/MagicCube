const request = require('supertest');
const app = require('../app');

describe('下载 API', () => {
    let token;

    beforeAll(async () => {
        const loginRes = await request(app)
            .post('/auth/login')
            .send({
                username: 'testuser',
                password: 'testpass'
            });
        token = loginRes.body.token;
    });

    test('下载商品素材', async () => {
        const res = await request(app)
            .get('/api/test/download/1') // 使用测试路由
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toBe('application/zip');
    });
}); 
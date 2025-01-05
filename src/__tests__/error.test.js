const request = require('supertest');
const app = require('../app');

describe('错误处理', () => {
    test('404 处理', async () => {
        const res = await request(app)
            .get('/not-exist');

        expect(res.statusCode).toBe(404);
        expect(res.text).toContain('404');
    });

    test('API 404 处理', async () => {
        const res = await request(app)
            .get('/api/test/not-exist');

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('error', '未找到请求的 API 接口');
    });
}); 
const request = require('supertest');
const app = require('../app');
const path = require('path');

describe('上传 API', () => {
    let token;
    let productId;
    let moduleId;

    beforeAll(async () => {
        // 先登录获取 token
        const loginRes = await request(app)
            .post('/auth/login')
            .send({
                username: 'testuser',
                password: 'testpass'
            });
        token = loginRes.body.token;

        // 创建测试商品
        const productRes = await request(app)
            .post('/api/test/products') // 使用测试路由
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: '测试商品',
                spu_code: 'TEST001',
                gender: 'unisex',
                age_range: 'adult',
                scene: '测试场景',
                style: '测试风格',
                designer_3d: '测试设计师',
                designer_2d: '测试设计师'
            });

        expect(productRes.statusCode).toBe(201);
        expect(productRes.body).toHaveProperty('id');
        expect(productRes.body).toHaveProperty('modules');
        expect(Array.isArray(productRes.body.modules)).toBe(true);
        expect(productRes.body.modules.length).toBeGreaterThan(0);

        productId = productRes.body.id;
        moduleId = productRes.body.modules[0].id;
    });

    test('上传图片', async () => {
        const res = await request(app)
            .post(`/api/test/modules/${moduleId}/images`) // 使用测试路由
            .set('Authorization', `Bearer ${token}`)
            .attach('images', path.join(__dirname, '../test/fixtures/test-image.jpg'));

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', '上传成功');
    });
}); 
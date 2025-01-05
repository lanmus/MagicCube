const request = require('supertest');
const app = require('../app');

describe('商品 API', () => {
    let token;
    let testProductId;

    beforeAll(async () => {
        const loginRes = await request(app)
            .post('/auth/login')
            .send({
                username: 'testuser',
                password: 'testpass'
            });
        token = loginRes.body.token;
    });

    test('创建商品', async () => {
        const res = await request(app)
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

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
        testProductId = res.body.id;
    });

    test('获取商品列表', async () => {
        const res = await request(app)
            .get('/api/test/products') // 使用测试路由
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('products');
        expect(Array.isArray(res.body.products)).toBe(true);
    });

    test('获取商品详情', async () => {
        const res = await request(app)
            .get(`/api/products/${testProductId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id', testProductId);
        expect(res.body).toHaveProperty('modules');
    });

    test('更新商品', async () => {
        const res = await request(app)
            .put(`/api/products/${testProductId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: '更新后的商品名称',
                style: '后现代'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
    });

    test('删除商品', async () => {
        // 先创建一个商品
        const createRes = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: '测试商品',
                spuCode: 'TEST001',
                gender: 'unisex',
                ageRange: '18-30',
                scene: '居家',
                style: '现代',
                designer3d: '张三',
                designer2d: '李四'
            });

        expect(createRes.statusCode).toBe(201);
        const productId = createRes.body.productId;

        // 然后删除这个商品
        const deleteRes = await request(app)
            .delete(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(deleteRes.statusCode).toBe(200);
        expect(deleteRes.body).toHaveProperty('success', true);

        // 验证商品已被删除
        const getRes = await request(app)
            .get(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(getRes.statusCode).toBe(404);
    });
}); 
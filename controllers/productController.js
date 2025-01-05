const db = require('../models/db');

class ProductController {
    // 创建商品
    async create(req, res) {
        try {
            const {
                name,
                spuCode,
                gender,
                ageRange,
                scene,
                style,
                designer3d,
                designer2d,
                modules
            } = req.body;

            // 开启事务
            const connection = await db.beginTransaction();

            try {
                // 1. 插入商品基本信息
                const [product] = await connection.query(
                    'INSERT INTO products (user_id, name, spu_code, gender, age_range, scene, style, designer_3d, designer_2d) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [req.user.id, name, spuCode, gender, ageRange, scene, style, designer3d, designer2d]
                );

                // 2. 插入模块信息
                for (const module of modules) {
                    await connection.query(
                        'INSERT INTO modules (product_id, module_type, sub_type, name, sort_order) VALUES (?, ?, ?, ?, ?)',
                        [product.insertId, module.type, module.subType, module.name, module.sortOrder]
                    );
                }

                await connection.commit();
                res.json({ success: true, productId: product.insertId });
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // 获取商品列表
    async list(req, res) {
        try {
            const { page = 1, pageSize = 10, search } = req.query;
            const offset = (page - 1) * pageSize;

            let query = 'SELECT * FROM products WHERE user_id = ?';
            const params = [req.user.id];

            if (search) {
                query += ' AND (name LIKE ? OR spu_code LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(pageSize), offset);

            const [products] = await db.query(query, params);
            res.json({ products });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ProductController(); 
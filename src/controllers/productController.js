const { pool } = require('../config/database');
const { MaterialModule } = require('../models/materialModule');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// 创建商品
const createProduct = asyncHandler(async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const { name, description, spu, status = 'draft' } = req.body;
        const [result] = await conn.query(
            'INSERT INTO products (name, description, spu, status, creator_id) VALUES (?, ?, ?, ?, ?)',
            [name, description, spu, status, req.user.id]
        );

        const [product] = await conn.query(
            'SELECT p.*, u.username as creator_name FROM products p LEFT JOIN users u ON p.creator_id = u.id WHERE p.id = ?',
            [result.insertId]
        );

        await conn.commit();

        res.status(201).json({
            status: 'success',
            data: { product: product[0] }
        });
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
});

// 获取商品列表
const getProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        sort = 'created_at DESC',
        search
    } = req.query;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];
    if (search) {
        whereClause += ' AND (name LIKE ? OR spu LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    const offset = (page - 1) * limit;
    const [products, [{ total }]] = await Promise.all([
        pool.query(
            `SELECT p.*, u.username as creator_name 
             FROM products p 
             LEFT JOIN users u ON p.creator_id = u.id 
             ${whereClause} 
             ORDER BY ${sort} 
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        ),
        pool.query(
            `SELECT COUNT(*) as total FROM products ${whereClause}`,
            params
        )
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            products: products[0],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(total),
                pages: Math.ceil(total / limit)
            }
        }
    });
});

// 获取商品详情
const getProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [[product], [modules]] = await Promise.all([
        pool.query(
            `SELECT p.*, u.username as creator_name 
             FROM products p 
             LEFT JOIN users u ON p.creator_id = u.id 
             WHERE p.id = ?`,
            [id]
        ),
        pool.query(
            `SELECT * FROM material_modules 
             WHERE product_id = ? AND status = 'active' 
             ORDER BY \`order\``,
            [id]
        )
    ]);

    if (!product) {
        throw new AppError('商品不存在', 404);
    }

    // 更新浏览次数
    await pool.query(
        'UPDATE products SET view_count = view_count + 1 WHERE id = ?',
        [id]
    );

    product.modules = modules;

    res.status(200).json({
        status: 'success',
        data: { product }
    });
});

// 更新商品
const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction();

        // 检查商品是否存在
        const [[product]] = await conn.query(
            'SELECT * FROM products WHERE id = ?',
            [id]
        );

        if (!product) {
            throw new AppError('商品不存在', 404);
        }

        // 检查权限
        if (product.creator_id !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('没有权限修改此商品', 403);
        }

        // 更新商品
        const { name, description, status } = req.body;
        await conn.query(
            'UPDATE products SET name = ?, description = ?, status = ? WHERE id = ?',
            [name, description, status, id]
        );

        // 获取更新后的商品
        const [[updatedProduct]] = await conn.query(
            `SELECT p.*, u.username as creator_name 
             FROM products p 
             LEFT JOIN users u ON p.creator_id = u.id 
             WHERE p.id = ?`,
            [id]
        );

        await conn.commit();

        res.status(200).json({
            status: 'success',
            data: { product: updatedProduct }
        });
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
});

// 删除商品
const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction();

        // 检查商品是否存在
        const [[product]] = await conn.query(
            'SELECT * FROM products WHERE id = ?',
            [id]
        );

        if (!product) {
            throw new AppError('商品不存在', 404);
        }

        // 检查权限
        if (product.creator_id !== req.user.id && req.user.role !== 'admin') {
            throw new AppError('没有权限删除此商品', 403);
        }

        // 删除商品（外键约束会自动删除关联的模块和材料）
        await conn.query('DELETE FROM products WHERE id = ?', [id]);

        await conn.commit();

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
});

// 获取商品统计信息
const getProductStats = asyncHandler(async (req, res) => {
    const [[stats]] = await pool.query(`
        SELECT 
            COUNT(*) as totalProducts,
            SUM(view_count) as totalViews,
            SUM(download_count) as totalDownloads,
            AVG(view_count) as avgViews,
            AVG(download_count) as avgDownloads
        FROM products
    `);

    res.status(200).json({
        status: 'success',
        data: { stats }
    });
});

module.exports = {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    getProductStats
}; 